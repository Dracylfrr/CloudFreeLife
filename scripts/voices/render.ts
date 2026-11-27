/**
 * Voice pack renderer (developer tool, runs in a browser tab served by `npm run dev`).
 *
 * Reads a story or adventure, gives every line to the right character exactly as the app does when it
 * reads aloud, makes the speech on this computer's graphics chip, joins the lines with natural pauses,
 * compresses the sound to calm voice quality (Opus) and saves ONE file per story, `<voice word>.<story>.dvp`, holding every
 * chapter (or adventure passage) with when each line starts and ends, so the app can highlight the paragraph being read.
 *
 * Open one of:
 *   /scripts/voices/render.html?path=stories/relaxing/<story>&voice=bf_emma     one story
 *   /scripts/voices/render.html?all=1&voice=bf_emma                            every free story (add resume=1 to skip finished ones)
 *   /scripts/voices/render.html?samples=1                                      the short sample of every voice
 * Files go to the little local server started by scripts/voices/pack-server.mjs.
 */
import { phonemize } from 'phonemizer';
import { Synth, SAMPLE_RATE, vocabFromTokenizer, type OrtLike } from '../../src/features/voices/synth';
import { DEFAULT_NARRATOR_SPEED, VOICES, resolveSpeakers, toChunks, voiceInfo, type CastMember, type Chunk } from '../../src/features/voices/casts';
import { buildPack } from '../../src/features/voices/packfile';
import { writeOggOpus, type OpusPacket } from './ogg';

const q = new URLSearchParams(location.search);
const PATH = q.get('path') ?? '';
const VOICE = q.get('voice') ?? 'bf_emma';
const SPEED = Number(q.get('speed') ?? DEFAULT_NARRATOR_SPEED);
const KBPS = Number(q.get('kbps') ?? 24);
const CPU = q.get('cpu') === '1';
const ONLY = q.get('only'); // render just one unit, for a quick try
const RESUME = q.get('resume') === '1';
const SERVER = q.get('server') ?? 'http://127.0.0.1:8765';

const logEl = document.getElementById('log')!;
const log = (s: string) => {
  logEl.textContent += '\n' + s;
  console.log(s);
};
logEl.textContent = 'starting';

interface Unit {
  id: string;
  paragraphs: string[];
  extras: string[];
}

async function getJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}
async function getBytes(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

async function loadUnits(path: string): Promise<{ id: string; cast: CastMember[] | undefined; units: Unit[] }> {
  for (const f of ['story.json', 'adventure.json']) {
    const r = await fetch(`/content/${path}/${f}`);
    // an unknown file is answered with the app's own page, so only a real JSON answer counts
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) continue;
    const j = await r.json();
    if (Array.isArray(j.chapters)) {
      return { id: j.id, cast: j.cast, units: j.chapters.map((c: { text: string[] }, i: number) => ({ id: `c${i + 1}`, paragraphs: c.text, extras: [] })) };
    }
    if (j.nodes) {
      const units: Unit[] = Object.entries<{ text: string[]; choices?: { text: string }[] }>(j.nodes).map(([id, n]) => ({
        id,
        paragraphs: n.text,
        extras: (n.choices ?? []).map((c, i) => `Choice ${i + 1}. ${c.text}.`)
      }));
      return { id: j.id, cast: j.cast, units };
    }
  }
  throw new Error(`No story or adventure found at content/${path}`);
}

/** Cuts the silence off both ends of a line, keeping a breath of it. */
function trim(s: Float32Array): Float32Array {
  const margin = Math.round(SAMPLE_RATE * 0.04);
  let a = 0;
  let b = s.length - 1;
  while (a < b && Math.abs(s[a]) < 0.004) a++;
  while (b > a && Math.abs(s[b]) < 0.004) b--;
  return s.slice(Math.max(0, a - margin), Math.min(s.length, b + margin));
}

async function encode(pcm: Float32Array): Promise<Uint8Array> {
  const packets: OpusPacket[] = [];
  let head: Uint8Array | null = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => {
      const d = meta?.decoderConfig?.description;
      if (d && !head) head = new Uint8Array(d as ArrayBuffer).slice();
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      packets.push({ data, samples48: Math.round(((chunk.duration ?? 20000) / 1_000_000) * 48000) });
    },
    error: (e) => {
      throw e;
    }
  });
  enc.configure({ codec: 'opus', sampleRate: SAMPLE_RATE, numberOfChannels: 1, bitrate: KBPS * 1000, opus: { application: 'audio', signal: 'voice', frameDuration: 20000, complexity: 10 } } as AudioEncoderConfig);
  const block = SAMPLE_RATE;
  for (let at = 0; at < pcm.length; at += block) {
    const part = pcm.slice(at, Math.min(pcm.length, at + block));
    enc.encode(new AudioData({ format: 'f32', sampleRate: SAMPLE_RATE, numberOfFrames: part.length, numberOfChannels: 1, timestamp: Math.round((at / SAMPLE_RATE) * 1e6), data: part }));
  }
  await enc.flush();
  enc.close();
  if (!head) {
    // the encoder did not hand over a header: write the standard one
    const h = new Uint8Array(19);
    h.set(new TextEncoder().encode('OpusHead'));
    h[8] = 1;
    h[9] = 1;
    h[10] = 312 & 255;
    h[11] = 312 >> 8;
    new DataView(h.buffer).setUint32(12, SAMPLE_RATE, true);
    head = h;
  }
  return writeOggOpus(head, packets);
}

async function save(name: string, bytes: Uint8Array | string) {
  const r = await fetch(`${SERVER}/save/${name}`, { method: 'PUT', body: bytes as BodyInit });
  if (!r.ok) throw new Error(`could not save ${name}: ${r.status}`);
}

/** Brings loud peaks down a little so nothing is harsh once compressed. */
function levelOff(pcm: Float32Array) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  if (peak > 0.95) {
    const k = 0.95 / peak;
    for (let i = 0; i < pcm.length; i++) pcm[i] *= k;
  }
}

async function exists(name: string) {
  try {
    return (await fetch(`${SERVER}/out/${name}`, { method: 'HEAD' })).ok;
  } catch {
    return false;
  }
}

async function makeEngine() {
  const t0 = performance.now();
  const ort = (CPU ? await import('onnxruntime-web/wasm') : await import('onnxruntime-web/webgpu')) as unknown as OrtLike & { env: { wasm: Record<string, unknown> } };
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = new URL('/tts/', location.href).href;
  const synth = new Synth(ort, phonemize, vocabFromTokenizer(await getJson(`${SERVER}/tokenizer.json`)));
  await synth.load(await getBytes(`${SERVER}/${CPU ? 'model.onnx' : 'model-fast.onnx'}`), CPU ? undefined : { executionProviders: ['webgpu'], graphOptimizationLevel: 'all' });
  log(`model ready after ${((performance.now() - t0) / 1000).toFixed(1)} s (${CPU ? 'processor' : 'graphics chip'})`);
  const voices = new Map<string, Float32Array>();
  const voiceData = async (v: string) => {
    if (!voices.has(v)) voices.set(v, new Float32Array((await getBytes(`${SERVER}/${v}.bin`)).buffer));
    return voices.get(v)!;
  };
  return { synth, voiceData };
}
type Engine = Awaited<ReturnType<typeof makeEngine>>;

/** One story in one voice, as the bytes of a .dvp file. */
async function renderStory(engine: Engine, path: string, voiceId: string): Promise<{ id: string; bytes: Uint8Array; seconds: number } | null> {
  const voice = voiceInfo(voiceId);
  if (!voice) throw new Error(`Unknown voice ${voiceId}`);
  const { id, cast, units } = await loadUnits(path);
  // the narrator speaks in the chosen voice; characters get their own, never the same one twice
  const speakers = resolveSpeakers(cast, undefined, { voice: voiceId, speed: SPEED });
  const byId = new Map(speakers.map((s) => [s.id, s]));
  log(`${id}: ${units.length} parts · ` + speakers.map((s) => `${s.name}=${voiceInfo(s.voice)?.name}`).join(', '));
  const done: { id: string; audio: Uint8Array; seconds: number; lines: [number, number, number][] }[] = [];
  let sum = 0;
  for (const unit of units) {
    if (ONLY && unit.id !== ONLY) continue;
    const carry: { last?: string } = {};
    const all: Chunk[] = toChunks(unit.paragraphs, speakers, carry);
    const extra: Chunk[] = unit.extras.flatMap((t, i) => toChunks([t], speakers).map((c) => ({ ...c, para: unit.paragraphs.length + i, who: 'narrator' })));
    const parts: Float32Array[] = [];
    const lines: [number, number, number][] = [];
    let at = 0;
    let prev: Chunk | null = null;
    for (const c of [...all, ...extra]) {
      const sp = byId.get(c.who) ?? speakers[0];
      const sound = trim(await engine.synth.speak(c.text, sp.voice, await engine.voiceData(sp.voice), sp.speed));
      if (!sound.length) continue;
      // natural pauses: a breath between paragraphs, a shorter one when the speaker changes, a small one otherwise
      const gap = !prev ? 0 : prev.para !== c.para ? 0.42 : prev.who !== c.who ? 0.16 : 0.08;
      const pause = new Float32Array(Math.round(gap * SAMPLE_RATE));
      parts.push(pause, sound);
      at += pause.length;
      lines.push([c.para, +(at / SAMPLE_RATE).toFixed(2), +((at + sound.length) / SAMPLE_RATE).toFixed(2)]);
      at += sound.length;
      prev = c;
    }
    if (!at) continue;
    const pcm = new Float32Array(at);
    let o = 0;
    for (const p of parts) {
      pcm.set(p, o);
      o += p.length;
    }
    levelOff(pcm);
    done.push({ id: unit.id, audio: await encode(pcm), seconds: at / SAMPLE_RATE, lines });
    sum += at / SAMPLE_RATE;
  }
  if (!done.length) return null;
  const bytes = buildPack({ v: 1, story: id, voice: voice.pack }, done);
  return { id, bytes, seconds: sum };
}

async function renderSamples(engine: Engine) {
  for (const v of VOICES) {
    const text = `Hello, I am ${v.name}. Settle in, and let me read you something calm.`;
    const pcm = trim(await engine.synth.speak(text, v.id, await engine.voiceData(v.id), SPEED));
    levelOff(pcm);
    const bytes = await encode(pcm);
    await save(`${v.pack}.opus`, bytes);
    log(`sample ${v.name}: ${(pcm.length / SAMPLE_RATE).toFixed(1)} s, ${(bytes.length / 1024).toFixed(0)} KB`);
  }
}

async function main() {
  const t0 = performance.now();
  const engine = await makeEngine();
  if (q.get('samples') === '1') {
    await renderSamples(engine);
    log('done: samples');
    (window as unknown as { __done: boolean }).__done = true;
    return;
  }
  const voice = voiceInfo(VOICE);
  if (!voice) throw new Error(`Unknown voice ${VOICE}`);
  const paths = q.get('all') === '1' ? ((await getJson(`${SERVER}/list`)) as string[]) : PATH.split(',').filter(Boolean);
  log(`${paths.length} stories in ${voice.name}'s voice, speed ${SPEED}, ${KBPS} kbps`);
  let sound = 0;
  let size = 0;
  let n = 0;
  for (const path of paths) {
    const id = path.split('/').pop()!;
    const file = `${voice.pack}.${id}.dvp`;
    if (RESUME && (await exists(file))) {
      log(`${id}: already done, skipped`);
      continue;
    }
    const s0 = performance.now();
    const r = await renderStory(engine, path, VOICE);
    if (!r) continue;
    await save(file, r.bytes);
    sound += r.seconds;
    size += r.bytes.length;
    n++;
    const took = (performance.now() - s0) / 1000;
    log(`${id}: ${r.seconds.toFixed(0)} s of sound, ${(r.bytes.length / 1024).toFixed(0)} KB, made in ${took.toFixed(0)} s (${(r.seconds / took).toFixed(1)}x faster than it lasts)`);
  }
  log(`done: ${n} stories, ${(sound / 60).toFixed(1)} minutes of sound, ${(size / 1048576).toFixed(1)} MB, ${((performance.now() - t0) / 60000).toFixed(1)} minutes`);
  (window as unknown as { __done: boolean }).__done = true;
}

main().catch((e) => log('FAILED: ' + (e instanceof Error ? e.stack : String(e))));
