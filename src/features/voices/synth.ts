/**
 * Text to speech, all on this computer. It follows the way the Kokoro model is meant to be driven:
 *   text -> a little cleaning -> phonemes (how the words sound) -> numbers -> the model + a voice -> sound.
 *
 * This file knows nothing about the screen, storage or workers, so the same code runs inside the
 * app's background worker and in the tests. The cleaning and phoneme steps follow the open-source
 * kokoro-js project (Apache-2.0); see docs/VOICES.md for the notices.
 */

export const SAMPLE_RATE = 24000;
const MAX_TOKENS = 510;
const STYLE_DIMS = 256;
const STYLE_ROWS = 510;

/** Expected size of one voice file: 510 rows of 256 numbers. */
export const VOICE_BYTES = STYLE_ROWS * STYLE_DIMS * 4;

export type Phonemize = (text: string, language: string) => Promise<string[]>;

/** Spoken-friendly text: tidy quotes and a few abbreviations, so the model is never handed anything odd. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/«/g, '“')
    .replace(/»/g, '”')
    .replace(/[“”]/g, '"')
    .replace(/–/g, ' to ')
    .replace(/[^\S \n]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\bDr\.(?= [A-Z])/g, 'Doctor')
    .replace(/\bMr\.(?= [A-Z])/g, 'Mister')
    .replace(/\bMrs\.(?= [A-Z])/g, 'Missus')
    .replace(/\bMs\.(?= [A-Z])/g, 'Miss')
    .replace(/\betc\.(?! [A-Z])/gi, 'etc')
    .replace(/\b(y)eah?\b/gi, "$1e'a")
    .trim();
}

const BREAKS = /(\s*[;:,.!?¡¿—…"«»“”(){}[\]]+\s*)+/g;

/** Words to phonemes. Punctuation is kept as it is: the model uses it for pauses and tone. */
export async function toPhonemes(text: string, british: boolean, phonemize: Phonemize): Promise<string> {
  const clean = cleanForSpeech(text);
  const parts: { match: boolean; text: string }[] = [];
  let last = 0;
  for (const m of clean.matchAll(BREAKS)) {
    if (last < m.index) parts.push({ match: false, text: clean.slice(last, m.index) });
    if (m[0].length) parts.push({ match: true, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < clean.length) parts.push({ match: false, text: clean.slice(last) });
  const lang = british ? 'en' : 'en-us';
  const out = (await Promise.all(parts.map(async (p) => (p.match ? p.text : (await phonemize(p.text, lang)).join(' '))))).join('');
  let r = out
    .replace(/kəkˈoːɹoʊ/g, 'kˈoʊkəɹoʊ')
    .replace(/kəkˈɔːɹəʊ/g, 'kˈəʊkəɹəʊ')
    .replace(/ʲ/g, 'j')
    .replace(/r/g, 'ɹ')
    .replace(/x/g, 'k')
    .replace(/ɬ/g, 'l')
    .replace(/(?<=[a-zɹː])(?=hˈʌndɹɪd)/g, ' ')
    .replace(/ z(?=[;:,.!?¡¿—…"«»“” ]|$)/g, 'z');
  if (!british) r = r.replace(/(?<=nˈaɪn)ti(?!ː)/g, 'di');
  return r.trim();
}

/** Phonemes to the model's numbers, with a 0 at each end. Anything the model has no sound for is dropped. */
export function encodePhonemes(phonemes: string, vocab: Record<string, number>): number[] {
  const ids: number[] = [];
  for (const ch of phonemes) {
    const id = vocab[ch];
    if (id !== undefined) ids.push(id);
    if (ids.length >= MAX_TOKENS) break;
  }
  return [0, ...ids, 0];
}

/** The part of a voice file that matches a line of this length. */
export function styleFor(voice: Float32Array, tokenCount: number): Float32Array {
  const row = Math.min(Math.max(tokenCount - 2, 0), STYLE_ROWS - 1);
  return voice.slice(row * STYLE_DIMS, row * STYLE_DIMS + STYLE_DIMS);
}

export const isBritish = (voiceId: string) => voiceId.startsWith('b');

/** The bits of onnxruntime-web this file uses, so tests can hand in a stand-in. */
export interface OrtLike {
  InferenceSession: { create(model: Uint8Array, opts?: unknown): Promise<{ run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array | ArrayLike<number> }>>; release?(): Promise<void> }> };
  Tensor: new (type: string, data: unknown, dims: number[]) => unknown;
}

export class Synth {
  private session: Awaited<ReturnType<OrtLike['InferenceSession']['create']>> | null = null;

  constructor(
    private readonly ort: OrtLike,
    private readonly phonemize: Phonemize,
    private readonly vocab: Record<string, number>
  ) {}

  async load(model: Uint8Array, options: unknown = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }) {
    this.session = await this.ort.InferenceSession.create(model, options);
  }

  get ready() {
    return this.session !== null;
  }

  /** One line of text in one voice at one speed. Returns sound at 24,000 samples a second. */
  async speak(text: string, voiceId: string, voice: Float32Array, speed: number): Promise<Float32Array> {
    if (!this.session) throw new Error('The voice engine is not loaded.');
    const phonemes = await toPhonemes(text, isBritish(voiceId), this.phonemize);
    const ids = encodePhonemes(phonemes, this.vocab);
    if (ids.length <= 2) return new Float32Array(0);
    const feeds = {
      input_ids: new this.ort.Tensor('int64', BigInt64Array.from(ids.map((n) => BigInt(n))), [1, ids.length]),
      style: new this.ort.Tensor('float32', styleFor(voice, ids.length), [1, STYLE_DIMS]),
      speed: new this.ort.Tensor('float32', new Float32Array([speed]), [1])
    };
    const out = await this.session.run(feeds);
    return Float32Array.from(out.waveform.data as ArrayLike<number>);
  }

  async dispose() {
    await this.session?.release?.();
    this.session = null;
  }
}

/** The text-to-number table inside tokenizer.json. */
export function vocabFromTokenizer(json: unknown): Record<string, number> {
  const vocab = (json as { model?: { vocab?: Record<string, number> } })?.model?.vocab;
  if (!vocab || typeof vocab !== 'object') throw new Error('The voice tokenizer is not valid.');
  return vocab;
}
