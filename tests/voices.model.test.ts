// @vitest-environment node
// The real Kokoro model, driven by our own code. It only runs when the model files are on this computer:
//   set KOKORO_DEV_DIR to a folder with model_quantized.onnx, tokenizer.json and voices/*.bin
// Without it every test here is skipped, so the normal test run never needs the 88 MB model.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';
import { Synth, SAMPLE_RATE, VOICE_BYTES, toPhonemes, vocabFromTokenizer, type OrtLike } from '../src/features/voices/synth';

const dir = process.env.KOKORO_DEV_DIR ?? '';
const have = !!dir && existsSync(join(dir, 'model_quantized.onnx'));
const d = have ? describe : describe.skip;

d('The real model', () => {
  let synth: Synth;
  let phonemize: (t: string, l: string) => Promise<string[]>;
  const voice = (id: string) => {
    const b = readFileSync(join(dir, 'voices', `${id}.bin`));
    return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  };
  const rms = (a: Float32Array) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / Math.max(1, a.length));

  beforeAll(async () => {
    const ort = (await import('onnxruntime-web/wasm')) as unknown as OrtLike & { env: { wasm: { numThreads: number; wasmPaths: unknown } } };
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = new URL('../node_modules/onnxruntime-web/dist/', import.meta.url).href;
    phonemize = ((await import('phonemizer')) as { phonemize: typeof phonemize }).phonemize;
    synth = new Synth(ort, phonemize, vocabFromTokenizer(JSON.parse(readFileSync(join(dir, 'tokenizer.json'), 'utf8'))));
    await synth.load(new Uint8Array(readFileSync(join(dir, 'model_quantized.onnx'))));
  }, 120000);

  it('every one of the nine voice files is the right size', () => {
    for (const id of ['af_nicole', 'af_bella', 'am_onyx', 'am_santa', 'am_michael', 'af_sarah', 'bf_emma', 'bf_isabella', 'bm_lewis']) {
      expect(readFileSync(join(dir, 'voices', `${id}.bin`)).byteLength, id).toBe(VOICE_BYTES);
    }
  });

  it('turns words into the sounds Kokoro expects, American and British', async () => {
    const us = await toPhonemes('Have you got the schedule for tomorrow, said the owl?', false, phonemize);
    const gb = await toPhonemes('Have you got the schedule for tomorrow, said the owl?', true, phonemize);
    expect(us.length).toBeGreaterThan(10);
    expect(us).toContain(',');
    expect(us).not.toBe(gb);
    expect(us).not.toMatch(/r/); // r becomes the model's own symbol
  });

  it('speaks a sentence: real, audible sound of a sensible length', async () => {
    const t0 = Date.now();
    const a = await synth.speak('The lanterns are lit, and the tea is warm.', 'af_nicole', voice('af_nicole'), 1);
    const seconds = a.length / SAMPLE_RATE;
    console.log(`spoke ${seconds.toFixed(2)}s of audio in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
    expect(seconds).toBeGreaterThan(1.5);
    expect(seconds).toBeLessThan(8);
    expect(rms(a)).toBeGreaterThan(0.01);
    expect(a.every((x) => Number.isFinite(x) && Math.abs(x) <= 1.5)).toBe(true);
  }, 60000);

  it('a higher speed is shorter, a lower speed is longer', async () => {
    const text = 'Once upon a time, a small train waited at a quiet station.';
    const slow = (await synth.speak(text, 'am_michael', voice('am_michael'), 0.8)).length;
    const mid = (await synth.speak(text, 'am_michael', voice('am_michael'), 1)).length;
    const fast = (await synth.speak(text, 'am_michael', voice('am_michael'), 1.3)).length;
    expect(slow).toBeGreaterThan(mid * 1.1);
    expect(fast).toBeLessThan(mid * 0.9);
  }, 90000);

  it('different voices sound different, and all nine speak', async () => {
    const seen = new Set<string>();
    for (const id of ['af_nicole', 'af_bella', 'am_onyx', 'am_santa', 'am_michael', 'af_sarah', 'bf_emma', 'bf_isabella', 'bm_lewis']) {
      const a = await synth.speak('Hello there, little friend.', id, voice(id), 1);
      expect(rms(a), id).toBeGreaterThan(0.01);
      seen.add(`${a.length}:${Math.round(rms(a) * 1e5)}`);
    }
    expect(seen.size).toBeGreaterThanOrEqual(8);
  }, 120000);

  it('empty or silent text gives no sound and no error', async () => {
    expect((await synth.speak('   ', 'af_nicole', voice('af_nicole'), 1)).length).toBe(0);
  });
});
