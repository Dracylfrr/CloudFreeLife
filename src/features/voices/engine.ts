/**
 * Starts the voice engine and turns lines of text into sound. The model is loaded into memory only
 * when someone actually presses Listen, and let go again when they have stopped for a while.
 *
 * Making speech takes about as long as the speech lasts (a little longer on some computers), and
 * the lines of a story are independent of each other, so several engines work side by side, each on a
 * different line, and the player keeps the next few lines being made while one is being heard.
 */
import { writable } from 'svelte/store';
import { getStorage } from '../../core/storage';
import { VOICE_DIR, modelStatus } from './model';
import { SAMPLE_RATE } from './synth';
import type { FromWorker, ToWorker } from './tts.worker';

export type EngineState = { status: 'off' } | { status: 'loading' } | { status: 'ready'; workers: number } | { status: 'error'; message: string };
export const engineState = writable<EngineState>({ status: 'off' });

/** How the app talks to the engine. Tests put a stand-in here. */
export interface EngineLink {
  start(): Promise<void>;
  speak(text: string, voice: string, speed: number): Promise<Float32Array>;
  stop(): void;
  /** How many lines can be made at the same time. */
  readonly parallel?: number;
}

/**
 * How many engines to run: one. Measured on a 16-core laptop, a second engine made speech no faster (the
 * work is limited by the processor's vector units, not by the number of cores) and slowed down the line
 * that was needed first, while holding a second copy of the model in memory.
 */
export function workerCount(_cores: number): number {
  return 1;
}

interface Slot {
  w: Worker;
  busy: number;
  sent: Set<string>;
}
let slots: Slot[] = [];
let starting: Promise<void> | null = null;
let nextReq = 1;
const waiting = new Map<number, { ok: (a: Float32Array) => void; fail: (e: Error) => void; slot: Slot }>();
const voiceCache = new Map<string, Uint8Array>();
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const IDLE_MS = 5 * 60 * 1000;

function wasmBase(): string {
  return new URL(`${import.meta.env.BASE_URL}tts/`, document.baseURI).href;
}

function killAll() {
  for (const s of slots) s.w.terminate();
  slots = [];
  starting = null;
  voiceCache.clear();
  for (const p of waiting.values()) p.fail(new Error('Stopped.'));
  waiting.clear();
}

function launch(model: Uint8Array, tokenizer: string): Promise<Slot> {
  const w = new Worker(new URL('./tts.worker.ts', import.meta.url), { type: 'module' });
  const slot: Slot = { w, busy: 0, sent: new Set() };
  return new Promise<Slot>((resolve, reject) => {
    w.onmessage = (e: MessageEvent<FromWorker>) => {
      const m = e.data;
      if (m.type === 'ready') resolve(slot);
      else if (m.type === 'error' && m.req === undefined) reject(new Error(m.message));
      else if (m.type === 'audio') {
        const p = waiting.get(m.req);
        waiting.delete(m.req);
        if (p) {
          p.slot.busy--;
          p.ok(m.samples);
        }
      } else if (m.type === 'error' && m.req !== undefined) {
        const p = waiting.get(m.req);
        waiting.delete(m.req);
        if (p) {
          p.slot.busy--;
          p.fail(new Error(m.message));
        }
      }
    };
    w.onerror = (e) => reject(new Error(e.message || 'The voice engine could not start.'));
    const init: ToWorker = { type: 'init', model, tokenizer, wasmBase: wasmBase() };
    w.postMessage(init, [model.buffer as ArrayBuffer]);
  });
}

const nativeLink: EngineLink = {
  get parallel() {
    return Math.max(1, slots.length);
  },
  async start() {
    if (slots.length) return;
    if (starting) return starting;
    engineState.set({ status: 'loading' });
    starting = (async () => {
      const status = await modelStatus();
      if (!status.installed) throw new Error('The voices have not been downloaded yet.');
      const st = await getStorage();
      const model = await st.readBytes(`${VOICE_DIR}/model.onnx`);
      const tokenizer = await st.readText(`${VOICE_DIR}/tokenizer.json`);
      if (!model || !tokenizer) throw new Error('The voice files could not be read.');
      const n = workerCount(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 1);
      // every engine gets its own copy of the model to work from
      // (the copies are made first: handing a model to an engine hands the original over)
      const copies = Array.from({ length: n }, (_, i) => (i === n - 1 ? model : model.slice()));
      const made = await Promise.all(copies.map((m) => launch(m, tokenizer)));
      slots = made;
      engineState.set({ status: 'ready', workers: n });
    })()
      .catch((e) => {
        killAll();
        engineState.set({ status: 'error', message: e instanceof Error ? e.message : 'The voice engine could not start.' });
        throw e;
      })
      .finally(() => {
        starting = null;
      });
    return starting;
  },
  async speak(text, voice, speed) {
    if (!slots.length) throw new Error('The voice engine is not running.');
    // the engine with the least to do
    const slot = slots.reduce((a, b) => (b.busy < a.busy ? b : a));
    if (!slot.sent.has(voice)) {
      let bytes = voiceCache.get(voice);
      if (!bytes) {
        bytes = (await (await getStorage()).readBytes(`${VOICE_DIR}/${voice}.bin`)) ?? undefined;
        if (!bytes) throw new Error('A voice file is missing.');
        voiceCache.set(voice, bytes);
      }
      const copy = bytes.slice().buffer as ArrayBuffer;
      slot.w.postMessage({ type: 'voice', id: voice, bytes: copy } satisfies ToWorker, [copy]);
      slot.sent.add(voice);
    }
    const req = nextReq++;
    slot.busy++;
    return new Promise<Float32Array>((ok, fail) => {
      waiting.set(req, { ok, fail, slot });
      slot.w.postMessage({ type: 'speak', req, text, voice, speed } satisfies ToWorker);
    });
  },
  stop() {
    killAll();
    engineState.set({ status: 'off' });
  }
};

let link: EngineLink = nativeLink;
export function setEngineLink(l: EngineLink | null) {
  link = l ?? nativeLink;
}

/** How many lines can usefully be made ahead of the one being heard. */
export const engineParallelism = () => Math.max(1, link.parallel ?? 1);

function armIdle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => link.stop(), IDLE_MS);
}

export async function startEngine(): Promise<void> {
  if (idleTimer) clearTimeout(idleTimer);
  await link.start();
}

export async function speakLine(text: string, voice: string, speed: number): Promise<Float32Array> {
  if (idleTimer) clearTimeout(idleTimer);
  try {
    return await link.speak(text, voice, speed);
  } finally {
    armIdle();
  }
}

export function stopEngine() {
  if (idleTimer) clearTimeout(idleTimer);
  link.stop();
}

export { SAMPLE_RATE };
