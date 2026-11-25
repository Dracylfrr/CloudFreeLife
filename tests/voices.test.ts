// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { buildCatalog } from '../src/core/content/registry';
import { validateAdventure, validateStory } from '../src/core/manifests';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { setHttpGet, type HttpGet } from '../src/features/updates/http';
import {
  NARRATOR_ID, SAMPLE_LINE, SPEED_MAX, SPEED_MIN, VOICES, VOICE_IDS, clampSpeed, namesFor, resolveSpeakers, sanitizeSavedCasts, sentences, splitQuotes, toChunks, type CastMember
} from '../src/features/voices/casts';
import { MODEL_BYTES, MODEL_FILES, VOICE_RELEASE_TAG, downloadModel, filesOf, modelStatus, modelUrl, removeModel, tierBytes } from '../src/features/voices/model';
import { SAMPLE_RATE, cleanForSpeech, encodePhonemes, styleFor, tidy, vocabFromTokenizer } from '../src/features/voices/synth';
import { firstBite, listen, listenState, previewVoice, pauseListening, resumeListening, setAudioOut, stopListening, type AudioOut } from '../src/features/voices/player';
import { setEngineLink, workerCount, type EngineLink } from '../src/features/voices/engine';
import { DiskTree } from './helpers/diskTree';

const NINE = ['af_nicole', 'af_bella', 'am_onyx', 'am_santa', 'am_michael', 'af_sarah', 'bf_emma', 'bf_isabella', 'bm_lewis'];
const cast: CastMember[] = [
  { id: 'tilly', name: 'Tilly', gender: 'f', trait: 'gentle' },
  { id: 'bear', name: 'the bear', gender: 'm', trait: 'jolly' },
  { id: 'hester', name: 'Hester Quill', gender: 'f', trait: 'wise', aka: ['Hester', 'Miss Quill'] },
  { id: 'owl', name: 'the owl', gender: 'f', trait: 'proper' }
];
const narrator = { voice: 'af_nicole', speed: 1 };
const speakers = () => resolveSpeakers(cast, undefined, narrator);

describe('The nine voices', () => {
  it('are exactly the ones asked for, with sensible details', () => {
    expect([...VOICE_IDS].sort()).toEqual([...NINE].sort());
    for (const v of VOICES) {
      expect(v.name.length).toBeGreaterThan(2);
      expect(v.feel.length).toBeGreaterThan(5);
      expect(v.id[0] === 'a' ? 'American' : 'British').toBe(v.accent);
      expect(v.id[1]).toBe(v.gender);
    }
    expect(VOICES.filter((v) => v.gender === 'f')).toHaveLength(5);
    expect(VOICES.filter((v) => v.gender === 'm')).toHaveLength(4);
  });
});

describe('Choosing a voice for each character', () => {
  it('starts with the narrator, who keeps the chosen voice and speed', () => {
    const s = resolveSpeakers(cast, undefined, { voice: 'bf_emma', speed: 0.9 });
    expect(s[0]).toMatchObject({ id: NARRATOR_ID, isNarrator: true, voice: 'bf_emma', speed: 0.9, custom: false });
  });
  it('gives female characters female voices and male characters male voices, never the same one twice', () => {
    const s = speakers();
    for (const x of s.slice(1)) expect(VOICES.find((v) => v.id === x.voice)?.gender, x.name).toBe(x.gender);
    expect(new Set(s.map((x) => x.voice)).size).toBe(s.length);
  });
  it('suits the voice to the character: a jolly bear gets the jolly voice, a gentle girl the soft one', () => {
    const s = resolveSpeakers([cast[0], cast[1]], undefined, { voice: 'bf_emma', speed: 1 });
    expect(s.find((x) => x.id === 'bear')!.voice).toBe('am_santa');
    expect(s.find((x) => x.id === 'tilly')!.voice).toBe('af_nicole');
    const wise = resolveSpeakers([{ id: 'whale', name: 'the whale', gender: 'm', trait: 'wise' }, { id: 'fox', name: 'Rowan', gender: 'm', trait: 'proper' }], undefined, narrator);
    expect(wise[1].voice).toBe('am_onyx');
    expect(wise[2].voice).toBe('bm_lewis');
  });
  it('is the same every time for the same story', () => {
    expect(speakers().map((s) => s.voice)).toEqual(speakers().map((s) => s.voice));
  });
  it('lets the author suggest a voice, and the reader overrule it, and remembers the reader', () => {
    const authored = resolveSpeakers([{ ...cast[1], voice: 'bm_lewis' }], undefined, narrator);
    expect(authored[1].voice).toBe('bm_lewis');
    const chosen = resolveSpeakers([{ ...cast[1], voice: 'bm_lewis' }], { bear: { voice: 'am_onyx', speed: 0.8 } }, narrator);
    expect(chosen[1]).toMatchObject({ voice: 'am_onyx', speed: 0.8, custom: true });
  });
  it('keeps speeds in a comfortable range', () => {
    expect(clampSpeed(5)).toBe(SPEED_MAX);
    expect(clampSpeed(0.1)).toBe(SPEED_MIN);
    expect(clampSpeed(NaN)).toBe(1);
    expect(clampSpeed('fast')).toBe(1);
    expect(clampSpeed(1.03)).toBe(1.05);
  });
});

describe('Remembering the choices', () => {
  it('saves them in settings, and cleans up anything strange when settings load', () => {
    const raw = {
      voiceNarrator: 'af_bella',
      voiceNarratorSpeed: 9,
      voiceCasts: { the_story: { tilly: { voice: 'af_sarah', speed: 1.2 }, bad: { voice: 'robot', speed: 1 }, 'BAD ID': { voice: 'af_sarah', speed: 1 } }, 'Not Valid': {} }
    };
    const s = sanitizeSettings(raw);
    expect(s.voiceNarrator).toBe('af_bella');
    expect(s.voiceNarratorSpeed).toBe(SPEED_MAX);
    expect(s.voiceCasts).toEqual({ the_story: { tilly: { voice: 'af_sarah', speed: 1.2 } } });
    expect(sanitizeSettings({ voiceNarrator: 'nobody' }).voiceNarrator).toBe(DEFAULT_SETTINGS.voiceNarrator);
    expect(sanitizeSavedCasts('junk')).toEqual({});
    expect(sanitizeSavedCasts({ a: { b: null } })).toEqual({});
  });
  it('the narrator defaults to Nicole at normal speed', () => {
    expect(DEFAULT_SETTINGS.voiceNarrator).toBe('af_nicole');
    expect(DEFAULT_SETTINGS.voiceNarratorSpeed).toBe(1);
    expect(DEFAULT_SETTINGS.voiceCasts).toEqual({});
  });
});

describe('Working out who is speaking', () => {
  const who = (text: string, c: CastMember[] = cast) => toChunks([text], resolveSpeakers(c, undefined, narrator)).map((x) => `${x.who}:${x.text}`);
  it('gives words in quotes to the character named after them', () => {
    expect(who('"Mind the step," said Tilly softly.')).toEqual(['tilly:Mind the step,', 'narrator:said Tilly softly.']);
  });
  it('knows the character when the name comes first, and with a title or a nickname', () => {
    expect(who('Tilly said, "Good night."')[1]).toBe('tilly:Good night.');
    expect(who('"Welcome in," said Miss Quill.')[0]).toBe('hester:Welcome in,');
    expect(who('"Come in, come in," Hester said.')[0]).toBe('hester:Come in, come in,');
  });
  it('finds "the bear" and "The bear" and does not mistake other words for it', () => {
    expect(who('"I would like to sing," said the bear.')[0]).toBe('bear:I would like to sing,');
    expect(who('The bear nodded. "Lovely," he said.')[1]).toBe('bear:Lovely,');
    expect(who('"Hmm," said the beard of the old man.')[0]).toBe('narrator:Hmm,');
  });
  it('uses he and she to tell a man from a woman', () => {
    const c: CastMember[] = [{ id: 'sam', name: 'Sam', gender: 'm' }, { id: 'clara', name: 'Clara', gender: 'f' }];
    expect(who('"Hello," she says.', c)[0]).toBe('clara:Hello,');
    expect(who('"Hello," he says.', c)[0]).toBe('sam:Hello,');
  });
  it('lets the narrator read anything it cannot place, which is always safe', () => {
    expect(who('"Who goes there?" asked a stranger.')[0]).toBe('narrator:Who goes there?');
    expect(toChunks(['No one speaks here.'], speakers()).every((c) => c.who === NARRATOR_ID)).toBe(true);
  });
  it('splits at quotes, curly ones too', () => {
    expect(splitQuotes('He said, “hello” and left.').map((p) => [p.speech, p.text])).toEqual([[false, 'He said, '], [true, 'hello'], [false, ' and left.']]);
    expect(splitQuotes('')).toEqual([]);
  });
  it('cuts long text into sentences of a size that is quick to make', () => {
    const long = Array.from({ length: 30 }, (_, i) => `This is sentence number ${i + 1}.`).join(' ');
    const parts = sentences(long, 120);
    expect(parts.length).toBeGreaterThan(5);
    expect(parts.every((p) => p.length <= 160)).toBe(true);
    expect(parts.join(' ')).toBe(long);
    expect(sentences('Just one.')).toEqual(['Just one.']);
    expect(sentences('')).toEqual([]);
  });
  it('knows each paragraph a line belongs to', () => {
    const chunks = toChunks(['First one. Second one.', '"Hi," said Tilly.'], speakers());
    expect([...new Set(chunks.map((c) => c.para))]).toEqual([0, 1]);
  });
  it('lists the words that point at a character', () => {
    expect(namesFor({ name: 'Hester Quill', aka: ['Miss Quill'] })).toEqual(expect.arrayContaining(['Hester Quill', 'Hester', 'Quill', 'Miss Quill']));
    expect(namesFor({ name: 'the bear', aka: [] })).toEqual(['bear']);
  });
});

describe('The bundled stories have casts that work', () => {
  it('every cast is valid, uses real voices and fits its story', async () => {
    const cat = await buildCatalog([new DiskTree()]);
    const withCast = [...cat.stories, ...cat.adventures].filter((s) => s.manifest.cast);
    expect(withCast.length).toBeGreaterThanOrEqual(15);
    for (const s of withCast) {
      const members = s.manifest.cast!;
      const ids = members.map((m) => m.id);
      expect(new Set(ids).size, s.manifest.id).toBe(ids.length);
      const resolved = resolveSpeakers(members, undefined, narrator);
      expect(new Set(resolved.map((x) => x.voice)).size, s.manifest.id).toBe(Math.min(resolved.length, 9));
      for (const x of resolved.slice(1)) expect(VOICES.find((v) => v.id === x.voice)?.gender, `${s.manifest.id} ${x.name}`).toBe(x.gender);
      const text = 'chapters' in s.manifest ? s.manifest.chapters.flatMap((c) => c.text).join(' ') : Object.values(s.manifest.nodes).flatMap((n) => n.text).join(' ');
      for (const m of members) expect(namesFor({ name: m.name, aka: m.aka ?? [] }).some((n) => new RegExp(n, /^[a-z]/.test(n) ? 'i' : '').test(text)), `${s.manifest.id}: ${m.name} appears in the story`).toBe(true);
    }
  });
  it('real lines are given to the right characters in a real story', async () => {
    const cat = await buildCatalog([new DiskTree()]);
    const story = cat.stories.find((s) => s.manifest.id === 'night_train_to_moonwater')!.manifest;
    const sp = resolveSpeakers(story.cast, undefined, narrator);
    const chunks = toChunks(story.chapters.flatMap((c) => c.text), sp);
    const speakersUsed = new Set(chunks.map((c) => c.who));
    expect(speakersUsed.has('tilly')).toBe(true);
    expect(speakersUsed.has('bear')).toBe(true);
    expect(speakersUsed.has(NARRATOR_ID)).toBe(true);
    expect(chunks.filter((c) => c.who !== NARRATOR_ID).length).toBeGreaterThan(5);
  });
  it('the cast field is read, cleaned and limited', () => {
    const story = { id: 's', name: 'S', description: 'd', version: '1.0.0', minAppVersion: '1.0.0', cover: 'c.svg', chapters: [{ title: 'One', text: ['x'] }] };
    const ok = validateStory({ ...story, cast: [{ id: 'a', name: 'Ann', gender: 'f', trait: 'wise', aka: ['A'], voice: 'bf_emma' }, { id: 'narrator', name: 'No', gender: 'f' }, { id: 'b', name: 'Bob', gender: 'x' }, { id: 'a', name: 'Dup', gender: 'm' }, { id: 'c', name: 'Cy', gender: 'm', voice: 'robot', trait: 'grumpy' }] });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.cast).toEqual([{ id: 'a', name: 'Ann', gender: 'f', trait: 'wise', aka: ['A'], voice: 'bf_emma' }, { id: 'c', name: 'Cy', gender: 'm' }]);
    const none = validateStory({ ...story, cast: 'nope' });
    expect(none.ok && none.value.cast).toBeUndefined();
    const adv = validateAdventure({ id: 'a1', name: 'A', description: 'd', cover: 'c.svg', version: '1.0.0', minAppVersion: '1.0.0', genre: 'x', protagonist: 'hero', start: 'a', cast: [{ id: 'z', name: 'Zed', gender: 'm' }], nodes: { a: { text: ['x'], choices: [{ text: 'one', to: 'e1' }, { text: 'two', to: 'e2' }, { text: 'three', to: 'e3' }] }, e1: { text: ['x'], ending: { title: 'One', mood: 'happy' } }, e2: { text: ['x'], ending: { title: 'Two', mood: 'sweet' } }, e3: { text: ['x'], ending: { title: 'Three', mood: 'cozy' } } } });
    expect(adv.ok && adv.value.cast?.[0].id).toBe('z');
  });
});

describe('Preparing text for the model', () => {
  it('tidies quotes and abbreviations', () => {
    expect(cleanForSpeech('“Mr. Alder’s shop,” said Mrs. Quill.')).toBe('"Mister Alder\'s shop," said Missus Quill.');
    expect(cleanForSpeech('  a    b  ')).toBe('a b');
  });
  it('turns sounds into numbers, with a 0 at each end, and drops what the model cannot say', () => {
    const vocab = { $: 0, a: 5, b: 6, ' ': 16 };
    expect(encodePhonemes('ab a', vocab)).toEqual([0, 5, 6, 16, 5, 0]);
    expect(encodePhonemes('a#b', vocab)).toEqual([0, 5, 6, 0]);
    expect(encodePhonemes('a'.repeat(900), { a: 5 }).length).toBe(512);
    expect(encodePhonemes('', vocab)).toEqual([0, 0]);
  });
  it('picks the part of a voice that matches the length of the line', () => {
    const v = Float32Array.from({ length: 510 * 256 }, (_, i) => Math.floor(i / 256));
    expect(styleFor(v, 12)[0]).toBe(10);
    expect(styleFor(v, 2)[0]).toBe(0);
    expect(styleFor(v, 5000)[0]).toBe(509);
    expect(styleFor(v, 12)).toHaveLength(256);
  });
  it('reads the model\'s table of sounds from tokenizer.json, and refuses nonsense', () => {
    expect(vocabFromTokenizer({ model: { vocab: { a: 1 } } })).toEqual({ a: 1 });
    expect(() => vocabFromTokenizer({})).toThrow();
    expect(SAMPLE_RATE).toBe(24000);
  });
});

describe('Getting the voice files', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
  });
  afterEach(() => {
    setStorage(null);
    setHttpGet(null);
  });
  // small stand-ins with the right names, so no 90 MB is needed
  const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

  it('lists the sound table, all nine voices and both speech models, with a checksum for every file', () => {
    expect(MODEL_FILES).toHaveLength(12);
    expect(MODEL_FILES.map((f) => f.asset)).toEqual(expect.arrayContaining(['kokoro-model_quantized.onnx', 'kokoro-model_fp32.onnx', 'kokoro-tokenizer.json', ...NINE.map((v) => `kokoro-voice-${v}.bin`)]));
    for (const f of MODEL_FILES) {
      expect(f.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(f.size).toBeGreaterThan(0);
      expect(modelUrl(f)).toBe(`https://github.com/Dracylfrr/CloudFreeLife/releases/download/${VOICE_RELEASE_TAG}/${f.asset}`);
    }
  });
  it('a computer needs only one of the two speech models: the standard download is about 93 MB, the fast one about 315 MB', () => {
    expect(tierBytes('standard')).toBeGreaterThan(90 * 1024 * 1024);
    expect(tierBytes('standard')).toBeLessThan(100 * 1024 * 1024);
    expect(tierBytes('fast')).toBeGreaterThan(300 * 1024 * 1024);
    expect(tierBytes('fast')).toBeLessThan(340 * 1024 * 1024);
    expect(MODEL_BYTES).toBe(tierBytes('standard') + tierBytes('fast') - filesOf('shared').reduce((n, f) => n + f.size, 0));
  });
  const fill = async (parts: ('shared' | 'standard' | 'fast')[]) => {
    for (const part of parts) for (const f of filesOf(part)) await mem.writeBytes(f.path, new Uint8Array(f.size));
  };
  it('knows which voices are installed: the shared files plus either speech model', async () => {
    let s = await modelStatus();
    expect(s).toMatchObject({ installed: false, shared: false, standard: false, fast: false });
    expect(s.missing).toHaveLength(12);
    await fill(['shared']);
    expect(await modelStatus()).toMatchObject({ shared: true, installed: false });
    await fill(['standard']);
    s = await modelStatus();
    expect(s).toMatchObject({ installed: true, standard: true, fast: false });
    await fill(['fast']);
    expect(await modelStatus()).toMatchObject({ installed: true, standard: true, fast: true, missing: [] });
    await mem.writeBytes(filesOf('fast')[0].path, new Uint8Array(3)); // a wrong size does not count
    expect(await modelStatus()).toMatchObject({ standard: true, fast: false });
  });
  it('removing one speech model keeps the other, and removing the last one frees everything', async () => {
    await fill(['shared', 'standard', 'fast']);
    await removeModel('fast');
    expect(await modelStatus()).toMatchObject({ standard: true, fast: false, installed: true });
    expect(await mem.exists(filesOf('shared')[0].path)).toBe(true);
    await removeModel('standard');
    expect((await modelStatus()).installed).toBe(false);
    expect(await mem.list('voices')).toEqual([]);
    await fill(['shared', 'standard', 'fast']);
    await removeModel('all');
    expect(await mem.list('voices')).toEqual([]);
  });
  it('refuses a file whose size or checksum is wrong, and keeps nothing', async () => {
    const first = filesOf('shared')[0];
    setHttpGet(async () => ({ status: 200, contentType: 'application/octet-stream', bytes: new Uint8Array(first.size).fill(7) }));
    for (const tier of ['standard', 'fast'] as const) {
      const r = await downloadModel(tier);
      expect(r.ok).toBe(false);
      expect(r.ok === false && r.message).toMatch(/checksum/);
    }
    expect(await mem.exists(first.path)).toBe(false);
    setHttpGet(async () => ({ status: 200, contentType: 'application/octet-stream', bytes: new Uint8Array(5) }));
    const small = await downloadModel('standard');
    expect(small.ok === false && small.message).toMatch(/size/);
  });
  it('says plainly when the files are not published yet, and when the network fails', async () => {
    setHttpGet(async () => ({ status: 404, contentType: '', bytes: new Uint8Array(0) }));
    const r = await downloadModel('fast');
    expect(r.ok === false && r.message).toMatch(/not available/);
    setHttpGet(async () => {
      throw new Error('offline');
    });
    const n = await downloadModel('standard');
    expect(n.ok === false && n.message).toMatch(/connection/);
  });
  it('only fetches what a tier is missing, and reports progress against that tier\'s own total', async () => {
    await fill(['shared', 'standard']); // everything the standard voices need is there
    let asked = 0;
    setHttpGet(async () => {
      asked++;
      return { status: 404, contentType: '', bytes: new Uint8Array(0) };
    });
    const seen: number[] = [];
    expect((await downloadModel('standard', (d, t) => seen.push(d / t))).ok).toBe(true);
    expect(asked).toBe(0);
    expect(seen[0]).toBe(1);
    // the fast voices still need their model, and only that
    await downloadModel('fast');
    expect(asked).toBe(1);
  });
});

describe('The graphics chip', () => {
  it('is used only when it is there, and is asked about only once', async () => {
    const { graphicsChipUsable, forgetGraphicsChip } = await import('../src/features/voices/acceleration');
    forgetGraphicsChip();
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    expect(await graphicsChipUsable()).toBe(false); // no WebGPU at all, as on an older computer
    forgetGraphicsChip();
    let asked = 0;
    Object.defineProperty(globalThis, 'navigator', { value: { gpu: { requestAdapter: async () => (asked++, { requestDevice: async () => ({ destroy() {} }) }) } }, configurable: true });
    expect(await graphicsChipUsable()).toBe(true);
    expect(await graphicsChipUsable()).toBe(true);
    expect(asked).toBe(1);
    forgetGraphicsChip();
    Object.defineProperty(globalThis, 'navigator', { value: { gpu: { requestAdapter: async () => null } }, configurable: true });
    expect(await graphicsChipUsable()).toBe(false); // WebGPU exists but there is no usable chip
    forgetGraphicsChip();
    Object.defineProperty(globalThis, 'navigator', { value: { gpu: { requestAdapter: async () => ({ requestDevice: async () => { throw new Error('lost'); } }) } }, configurable: true });
    expect(await graphicsChipUsable()).toBe(false); // the driver refuses
  });
  it('sound that is not a real number becomes silence and never louder than the speakers take', () => {
    const t = tidy(Float32Array.from([0.5, NaN, Infinity, -Infinity, 3, -3, 0]));
    expect([...t]).toEqual([0.5, 0, 0, 0, 1, -1, 0]);
  });
  it('the worker loads only the engine it is asked for, and the app ships both', () => {
    const w = readFileSync('src/features/voices/tts.worker.ts', 'utf8');
    expect(w).toContain("import('onnxruntime-web/webgpu')");
    expect(w).toContain("import('onnxruntime-web/wasm')");
    expect(w).toContain("executionProviders: ['webgpu']");
    const e = readFileSync('src/features/voices/engine.ts', 'utf8');
    expect(e).toContain('tries.push(\'gpu\')');
    expect(e).toContain('model-fast.onnx');
    const copy = readFileSync('scripts/copy-tts.mjs', 'utf8');
    expect(copy).toContain('ort-wasm-simd-threaded.jsep.wasm');
  });
});

describe('Reading aloud', () => {
  const heard: { text: string; voice: string; speed: number }[] = [];
  const played: number[] = [];
  let paused = false;
  const link: EngineLink = {
    async start() {},
    async speak(text, voice, speed) {
      heard.push({ text, voice, speed });
      return new Float32Array(240).fill(0.1);
    },
    stop() {}
  };
  const out: AudioOut = {
    async play(samples) {
      played.push(samples.length);
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    stop() {}
  };
  beforeEach(() => {
    heard.length = 0;
    played.length = 0;
    paused = false;
    setEngineLink(link);
    setAudioOut(out);
  });
  afterEach(() => {
    stopListening();
    setEngineLink(null);
    setAudioOut(null);
  });

  it('reads each line in its own character\'s voice and speed', async () => {
    const sp = resolveSpeakers(cast, { bear: { voice: 'am_onyx', speed: 0.8 } }, narrator);
    await listen(['The train waited.', '"Hush now," said the bear.'], sp);
    const bear = heard.find((h) => h.text === 'Hush now,')!;
    expect(bear).toMatchObject({ voice: 'am_onyx', speed: 0.8 });
    expect(heard.find((h) => h.text === 'The train waited.')).toMatchObject({ voice: 'af_nicole', speed: 1 });
    expect(played.length).toBe(heard.length);
    expect(get(listenState).status).toBe('idle');
  });
  it('can start part way through, and reads extra lines such as choices at the end', async () => {
    await listen(['One.', 'Two.', 'Three.'], speakers(), { from: 2, extras: ['Choice 1. Go left.'] });
    expect(heard.map((h) => h.text)).toEqual(['Three.', 'Choice 1. Go left.']);
  });
  it('pauses and carries on, and stops cleanly', async () => {
    listenState.set({ status: 'playing', para: 0, index: 0, total: 3, message: '' });
    pauseListening();
    expect(get(listenState).status).toBe('paused');
    expect(paused).toBe(true);
    resumeListening();
    expect(get(listenState).status).toBe('playing');
    stopListening();
    expect(get(listenState).status).toBe('idle');
  });
  it('says what went wrong in plain words when the engine cannot start', async () => {
    setEngineLink({ ...link, async start() { throw new Error('The voices have not been downloaded yet.'); } });
    await listen(['Hello.'], speakers());
    expect(get(listenState)).toMatchObject({ status: 'error', message: 'The voices have not been downloaded yet.' });
  });
});

describe('Keeping up with the story', () => {
  it('runs one engine: a second one made speech no faster and slowed the first line down', () => {
    expect([0, 1, 4, 8, 16, 64, NaN].map(workerCount)).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });
  it('cuts every line short enough to be made quickly', () => {
    const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i + 1} goes on for a little while, with a comma in the middle of it.`).join(' ');
    const chunks = toChunks([long], speakers());
    expect(chunks.length).toBeGreaterThan(8);
    expect(chunks.every((c) => c.text.length <= 180)).toBe(true);
  });
  it('says "catching up" and not nothing when the next line is not ready yet', async () => {
    const states: string[] = [];
    // an engine that makes one line at a time, slower than the sound is played
    let chain: Promise<unknown> = Promise.resolve();
    const slow: EngineLink = {
      parallel: 1,
      async start() {},
      speak() {
        const next = chain.then(() => new Promise((r) => setTimeout(r, 30))).then(() => new Float32Array(10).fill(0.1));
        chain = next;
        return next;
      },
      stop() {}
    };
    setEngineLink(slow);
    setAudioOut({ async play() {}, pause() {}, resume() {}, stop() {} });
    const un = listenState.subscribe((s) => states.push(`${s.status}:${s.index}`));
    // one paragraph of four long sentences, so there is no breath between them
    const sentence = (n: number) => `This is sentence number ${n} and it goes on for quite a while so that it is long enough to stand on its own as a line to be read aloud.`;
    await listen([[1, 2, 3, 4].map(sentence).join(' ')], speakers());
    un();
    expect(states).toContain('loading:1');
    setEngineLink(null);
    setAudioOut(null);
  });
  it('cuts the first line short so the sound starts sooner, without losing a word', () => {
    const long = 'Tilly walked down the carriage with her tray of warm milk and honey biscuits, humming softly to herself all the way.';
    const out = firstBite([{ para: 0, who: 'narrator', text: long }, { para: 0, who: 'narrator', text: 'Next.' }]);
    expect(out.length).toBe(3);
    expect(out[0].text.length).toBeLessThanOrEqual(45);
    expect(out.slice(0, 2).map((c) => c.text).join(' ')).toBe(long);
    expect(out[2].text).toBe('Next.');
    const short = [{ para: 0, who: 'narrator', text: 'A short line.' }];
    expect(firstBite(short)).toBe(short);
    expect(firstBite([])).toEqual([]);
  });
  it('the player has the next lines being made while one is heard', async () => {
    let live = 0;
    let most = 0;
    const slow: EngineLink = {
      parallel: 3,
      async start() {},
      async speak() {
        live++;
        most = Math.max(most, live);
        await new Promise((r) => setTimeout(r, 15));
        live--;
        return new Float32Array(10).fill(0.1);
      },
      stop() {}
    };
    setEngineLink(slow);
    setAudioOut({ async play() { await new Promise((r) => setTimeout(r, 40)); }, pause() {}, resume() {}, stop() {} });
    await listen(['One.', 'Two.', 'Three.', 'Four.', 'Five.', 'Six.', 'Seven.', 'Eight.'], speakers());
    expect(most).toBeGreaterThanOrEqual(3);
    setEngineLink(null);
    setAudioOut(null);
  });
});

describe('Hearing a voice', () => {
  it('the sample is short, so the first press answers within a few seconds', () => {
    expect(SAMPLE_LINE.length).toBeLessThanOrEqual(45);
  });
  it('the Hear buttons say what they are doing, and a sample made once plays again at once', async () => {
    const settings = readFileSync('src/features/settings/Settings.svelte', 'utf8');
    expect(settings).toContain("$listenState.status === 'loading' ? 'Getting ready…'");
    expect(settings).toContain("'Speaking…'");
    expect(settings).toContain("$listenState.status === 'error'");
    let made = 0;
    setEngineLink({ async start() {}, async speak() { made++; return new Float32Array(20).fill(0.1); }, stop() {} });
    setAudioOut({ async play() {}, pause() {}, resume() {}, stop() {} });
    await previewVoice('Hello there.', 'af_nicole', 1);
    await previewVoice('Hello there.', 'af_nicole', 1);
    await previewVoice('Hello there.', 'af_nicole', 1.2);
    expect(made).toBe(2); // the second press reused the first; a different speed is a new sample
    expect(get(listenState).status).toBe('idle');
    setEngineLink(null);
    setAudioOut(null);
  });
});

describe('Getting ready before Listen is pressed', () => {
  it('pointing at Listen starts the voices, and the graphics chip is warmed up with one short sentence', () => {
    const bar = readFileSync('src/features/voices/ListenBar.svelte', 'utf8');
    expect(bar).toContain('onpointerenter={warm}');
    expect(bar).toContain('onfocus={warm}');
    const e = readFileSync('src/features/voices/engine.ts', 'utf8');
    expect(e).toContain("if (mode === 'gpu') await nativeLink.speak('Hello.'");
  });
});

describe('Where it appears', () => {
  const read = (f: string) => readFileSync(f, 'utf8');
  it('both readers have a Listen bar, highlight the paragraph being read and offer the voices', () => {
    for (const f of ['src/features/stories/StoryReader.svelte', 'src/features/stories/AdventurePlayer.svelte']) {
      const src = read(f);
      expect(src, f).toContain('<ListenBar');
      expect(src, f).toContain('data-listen-para');
      expect(src, f).toContain('class:reading');
    }
    const bar = read('src/features/voices/ListenBar.svelte');
    expect(bar).toContain('Voices');
    expect(bar).toContain('set up voices');
  });
  it('the voices window saves choices at once, and Settings has a Voices tab with the notices', () => {
    const panel = read('src/features/voices/VoicesPanel.svelte');
    expect(panel).toContain('saveVoice(');
    expect(panel).toContain('saved for this story automatically');
    const settings = read('src/features/settings/Settings.svelte');
    expect(settings).toContain("id: 'voices'");
    expect(settings).toContain('Kokoro-82M');
    expect(settings).toContain('eSpeak NG');
    expect(read('src/App.svelte')).toContain('<VoicesPanel />');
  });
  it('the voices are an optional download that the person chooses, never part of the installer', () => {
    const setup = read('src/features/voices/VoiceSetup.svelte');
    expect(setup).toContain('You choose whether to download them');
    expect(read('src-tauri/tauri.conf.json')).toContain("'wasm-unsafe-eval'");
  });
});
