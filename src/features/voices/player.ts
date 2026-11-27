/**
 * Reads a passage aloud, line by line: each line is made a little before it is needed, so there is
 * hardly ever a wait, and every line is spoken by the right character at that character's speed.
 */
import { get, writable } from 'svelte/store';
import { getSettings } from '../../core/settings';
import { toChunks, type Chunk, type Speaker } from './casts';
import { SAMPLE_RATE, cancelSpeech, engineParallelism, speakLine, startEngine } from './engine';
import { paragraphAt, startOf } from './packfile';

export interface ListenState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  /** The paragraph being read (for highlighting). */
  para: number;
  /** Which line, and how many in all. */
  index: number;
  total: number;
  message: string;
}
const IDLE: ListenState = { status: 'idle', para: -1, index: 0, total: 0, message: '' };
export const listenState = writable<ListenState>(IDLE);

/** Where sound goes. Tests put a stand-in here. */
export interface AudioOut {
  /** Plays one piece of sound; resolves when it has finished (or been stopped). */
  play(samples: Float32Array, sampleRate: number, volume: number): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
}

class WebAudioOut implements AudioOut {
  private ctx: AudioContext | null = null;
  private current: AudioBufferSourceNode | null = null;
  private release: (() => void) | null = null;
  private context(): AudioContext {
    return (this.ctx ??= new AudioContext({ sampleRate: SAMPLE_RATE }));
  }
  play(samples: Float32Array, sampleRate: number, volume: number) {
    const ctx = this.context();
    return new Promise<void>((resolve) => {
      const buffer = ctx.createBuffer(1, samples.length, sampleRate);
      buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.buffer = buffer;
      src.connect(gain).connect(ctx.destination);
      this.current = src;
      this.release = resolve;
      src.onended = () => {
        if (this.current === src) this.current = null;
        this.release = null;
        resolve();
      };
      void ctx.resume().then(() => src.start());
    });
  }
  pause() {
    void this.ctx?.suspend();
  }
  resume() {
    void this.ctx?.resume();
  }
  stop() {
    const src = this.current;
    this.current = null;
    try {
      src?.stop();
    } catch {
      /* already finished */
    }
    this.release?.();
    this.release = null;
    void this.ctx?.resume();
  }
}

let out: AudioOut = new WebAudioOut();
export function setAudioOut(o: AudioOut | null) {
  out = o ?? new WebAudioOut();
}

let generation = 0;

/** The first line is cut short so the sound starts sooner; the rest follow while it plays. */
export function firstBite(chunks: Chunk[], max = 45): Chunk[] {
  const c = chunks[0];
  if (!c || c.text.length <= max) return chunks;
  const cut = Math.max(c.text.lastIndexOf(', ', max), c.text.lastIndexOf('; ', max), c.text.lastIndexOf(' ', max));
  if (cut < 12) return chunks;
  return [{ ...c, text: c.text.slice(0, cut + 1).trim() }, { ...c, text: c.text.slice(cut + 1).trim() }, ...chunks.slice(1)].filter((x) => x.text.length > 0);
}

const volume = () => {
  const s = getSettings();
  return s.muted ? 0 : Math.min(1, Math.max(0.05, s.volumeMaster + 0.2));
};

/** Reads `paragraphs` (and then `extras`, such as the choices of an adventure) aloud, from paragraph `from`. */
export async function listen(paragraphs: readonly string[], speakers: Speaker[], opts: { from?: number; extras?: readonly string[] } = {}): Promise<void> {
  const gen = ++generation;
  out.stop();
  endRecording();
  cancelSpeech(); // lines of the passage that was being read are not wanted any more
  const carry: { last?: string } = {};
  const all: Chunk[] = toChunks(paragraphs, speakers, carry);
  const extra: Chunk[] = (opts.extras ?? []).flatMap((t, i) => toChunks([t], speakers).map((c) => ({ ...c, para: paragraphs.length + i, who: 'narrator' })));
  const first = Math.max(0, opts.from ?? 0);
  const chunks = firstBite([...all, ...extra].filter((c) => c.para >= first));
  const byId = new Map(speakers.map((s) => [s.id, s]));
  listenState.set({ status: 'loading', para: chunks[0]?.para ?? -1, index: 0, total: chunks.length, message: '' });
  try {
    await startEngine();
    if (gen !== generation) return;
    const made = new Map<number, Promise<Float32Array>>();
    const make = (i: number) => {
      if (i >= chunks.length) return;
      if (!made.has(i)) {
        const c = chunks[i];
        const sp = byId.get(c.who) ?? speakers[0];
        made.set(i, speakLine(c.text, sp.voice, sp.speed));
        made.get(i)!.catch(() => {});
      }
    };
    // as many lines are being made ahead as the engines can work on at once, and one more
    const ahead = engineParallelism() + 1;
    for (let i = 0; i < chunks.length; i++) {
      // the very first line is made on its own, so the first words come as soon as possible
      make(i);
      // if the next line is not ready, say so, rather than going quiet without a word
      let settled = false;
      const pending = made.get(i)!.then((v) => ((settled = true), v));
      await Promise.race([pending, Promise.resolve()]);
      if (!settled && i > 0) listenState.update((s) => (s.status === 'paused' ? s : { ...s, status: 'loading', para: chunks[i].para, index: i, message: 'Catching up…' }));
      const samples = await pending;
      if (gen !== generation) return;
      // now the next lines are made while this one is heard
      for (let k = 1; k <= ahead; k++) make(i + k);
      made.delete(i);
      listenState.update((s) => (s.status === 'paused' ? s : { ...s, status: 'playing', para: chunks[i].para, index: i, message: '' }));
      if (samples.length) await out.play(samples, SAMPLE_RATE, volume());
      if (gen !== generation) return;
      // a breath between paragraphs
      if (chunks[i + 1] && chunks[i + 1].para !== chunks[i].para) await new Promise((r) => setTimeout(r, 380));
    }
    if (gen === generation) listenState.set(IDLE);
  } catch (e) {
    if (gen !== generation) return;
    listenState.set({ ...IDLE, status: 'error', message: e instanceof Error && e.message !== 'Stopped.' ? e.message : 'The voices stopped.' });
  }
}

// ------------------------------------------------------------------ recorded stories

let rec: { audio: HTMLAudioElement; url: string } | null = null;

function endRecording() {
  if (!rec) return;
  const { audio, url } = rec;
  rec = null;
  audio.onended = audio.onerror = audio.ontimeupdate = null;
  audio.pause();
  audio.removeAttribute('src');
  URL.revokeObjectURL(url);
}

/** Plays a ready-made recording of a passage, from paragraph `from`, highlighting the paragraph being read. */
export async function listenRecorded(bytes: Uint8Array, lines: readonly [number, number, number][], from = 0): Promise<void> {
  const gen = ++generation;
  out.stop();
  cancelSpeech();
  endRecording();
  listenState.set({ status: 'loading', para: -1, index: 0, total: lines.length, message: '' });
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'audio/ogg; codecs=opus' }));
  const audio = new Audio(url);
  audio.volume = volume();
  rec = { audio, url };
  audio.onended = () => {
    if (rec?.audio !== audio) return;
    endRecording();
    if (gen === generation) listenState.set(IDLE);
  };
  audio.onerror = () => {
    if (rec?.audio !== audio) return;
    endRecording();
    if (gen === generation) listenState.set({ ...IDLE, status: 'error', message: 'This recording could not be played.' });
  };
  audio.ontimeupdate = () => {
    if (gen !== generation) return;
    const para = paragraphAt(lines, audio.currentTime);
    listenState.update((s) => (s.status === 'paused' || (s.status === 'playing' && (para < 0 || para === s.para)) ? s : { ...s, status: 'playing', para: para >= 0 ? para : s.para, message: '' }));
  };
  const at = startOf(lines, from);
  if (at > 0) audio.currentTime = at;
  try {
    await audio.play();
    if (gen === generation) listenState.update((s) => (s.status === 'loading' ? { ...s, status: 'playing' } : s));
  } catch {
    if (gen === generation && rec?.audio === audio) {
      endRecording();
      listenState.set({ ...IDLE, status: 'error', message: 'This recording could not be played.' });
    }
  }
}

export function pauseListening() {
  if (get(listenState).status !== 'playing') return;
  rec?.audio.pause();
  out.pause();
  listenState.update((s) => ({ ...s, status: 'paused' }));
}

export function resumeListening() {
  if (get(listenState).status !== 'paused') return;
  void rec?.audio.play();
  out.resume();
  listenState.update((s) => ({ ...s, status: 'playing' }));
}

export function stopListening() {
  generation++;
  endRecording();
  out.stop();
  cancelSpeech();
  listenState.set(IDLE);
}

// A sample that has been made once is kept for this session, so hearing it again is instant.
const heardBefore = new Map<string, Float32Array>();

/** Hear one voice at one speed, for choosing. */
export async function previewVoice(text: string, voice: string, speed: number): Promise<void> {
  const gen = ++generation;
  out.stop();
  endRecording();
  cancelSpeech();
  const key = `${voice}|${speed}|${text}`;
  listenState.set({ status: 'loading', para: -1, index: 0, total: 1, message: '' });
  try {
    let sound = heardBefore.get(key);
    if (!sound) {
      await startEngine();
      sound = await speakLine(text, voice, speed);
      if (sound.length) {
        heardBefore.set(key, sound);
        if (heardBefore.size > 40) heardBefore.delete(heardBefore.keys().next().value as string);
      }
    }
    if (gen !== generation) return;
    listenState.set({ status: 'playing', para: -1, index: 0, total: 1, message: '' });
    if (sound.length) await out.play(sound, SAMPLE_RATE, volume());
    if (gen === generation) listenState.set(IDLE);
  } catch (e) {
    if (gen !== generation) return;
    listenState.set({ ...IDLE, status: 'error', message: e instanceof Error ? e.message : 'The voices stopped.' });
  }
}
