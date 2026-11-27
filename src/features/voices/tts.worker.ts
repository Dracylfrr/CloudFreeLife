/// <reference lib="webworker" />
/**
 * The voice engine's own thread. Making speech takes real work, so it happens here and the app stays
 * smooth. It speaks only when asked, one line at a time, and never touches the network or the disk:
 * everything it needs (the model, the voices) is handed to it by the app.
 */
import { phonemize } from 'phonemizer';
import { Synth, vocabFromTokenizer, type OrtLike } from './synth';

export type ToWorker =
  | { type: 'init'; model: Uint8Array; tokenizer: string; wasmBase: string; device: 'cpu' | 'gpu' }
  | { type: 'voice'; id: string; bytes: ArrayBuffer }
  | { type: 'speak'; req: number; text: string; voice: string; speed: number }
  /** Forget every line that has been asked for but not started: the passage they belong to is no longer being read. */
  | { type: 'cancel' }
  /** A health check: can the word-to-sound step run here? */
  | { type: 'check'; req: number };

export type FromWorker =
  | { type: 'ready' }
  | { type: 'error'; req?: number; message: string }
  | { type: 'audio'; req: number; samples: Float32Array }
  | { type: 'checked'; req: number; phonemes: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const voices = new Map<string, Float32Array>();
let synth: Synth | null = null;
// lines are made one after another, in the order they were asked for
let queue: Promise<void> = Promise.resolve();
// bumped by "cancel": lines asked for before that are skipped when their turn comes
let epoch = 0;

const say = (m: FromWorker, transfer: Transferable[] = []) => ctx.postMessage(m, transfer);

ctx.onmessage = (e: MessageEvent<ToWorker>) => {
  const m = e.data;
  if (m.type === 'init') {
    queue = queue.then(async () => {
      try {
        // the engine for the processor, or the one that can also use the graphics chip: only the one needed is loaded
        const ort = m.device === 'gpu' ? await import('onnxruntime-web/webgpu') : await import('onnxruntime-web/wasm');
        // one thread: extra threads did not make it faster
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.proxy = false;
        ort.env.wasm.wasmPaths = m.wasmBase;
        synth = new Synth(ort as unknown as OrtLike, phonemize, vocabFromTokenizer(JSON.parse(m.tokenizer)));
        await synth.load(m.model, m.device === 'gpu' ? { executionProviders: ['webgpu'], graphOptimizationLevel: 'all' } : undefined);
        say({ type: 'ready' });
      } catch (err) {
        say({ type: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    });
  } else if (m.type === 'check') {
    void phonemize('Hello there.', 'en-us').then(
      (p) => say({ type: 'checked', req: m.req, phonemes: p.join(' ') }),
      (err) => say({ type: 'error', req: m.req, message: err instanceof Error ? err.message : String(err) })
    );
  } else if (m.type === 'voice') {
    voices.set(m.id, new Float32Array(m.bytes));
  } else if (m.type === 'cancel') {
    epoch++;
  } else if (m.type === 'speak') {
    const asked = epoch;
    queue = queue.then(async () => {
      try {
        if (asked !== epoch) throw new Error('Stopped.');
        const voice = voices.get(m.voice);
        if (!synth || !voice) throw new Error('The voice engine is not ready.');
        const samples = await synth.speak(m.text, m.voice, voice, m.speed);
        say({ type: 'audio', req: m.req, samples }, [samples.buffer]);
      } catch (err) {
        say({ type: 'error', req: m.req, message: err instanceof Error ? err.message : String(err) });
      }
    });
  }
};
