/**
 * Read Aloud: narration through the voices already installed on the computer
 * (the system speech engine exposed by the web view). Nothing is downloaded, no online
 * speech service is used, and it works fully offline.
 *
 * Only local voices are offered: some Windows voices stream from an online service,
 * and those are deliberately left out so story text never leaves the machine.
 *
 * The controller works one sentence at a time. That makes Pause / Resume / change speed /
 * change voice / jump paragraph behave the same on every engine (engine-level pause is
 * unreliable): each of them simply stops the current sentence and starts again from the
 * right place.
 */
import { get, writable, type Readable } from 'svelte/store';

export type ReadStatus = 'idle' | 'playing' | 'paused';
export type Tone = 'soft' | 'warm' | 'bright';

export const TONES: { id: Tone; label: string; pitch: number }[] = [
  { id: 'soft', label: 'Soft', pitch: 1 },
  { id: 'warm', label: 'Warm', pitch: 0.88 },
  { id: 'bright', label: 'Bright', pitch: 1.12 }
];

export interface VoiceInfo {
  uri: string;
  /** Short readable name, e.g. "Aria". */
  name: string;
  lang: string;
}

export interface ReadAloudState {
  /** False when the system has no usable local voice (or no speech engine at all). */
  supported: boolean;
  status: ReadStatus;
  /** Paragraph being spoken (or next to speak when paused). */
  index: number;
  voices: VoiceInfo[];
  error: string | null;
}

/** The slice of the browser speech API the controller needs (so tests can supply a fake). */
export interface SynthLike {
  speak(u: UtteranceLike): void;
  cancel(): void;
  getVoices(): VoiceLike[];
  addEventListener?(type: 'voiceschanged', fn: () => void): void;
  removeEventListener?(type: 'voiceschanged', fn: () => void): void;
}
export interface VoiceLike {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
}
export interface UtteranceLike {
  text: string;
  voice: VoiceLike | null;
  rate: number;
  pitch: number;
  volume: number;
  lang: string;
  onend: ((e: unknown) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
}
type UtteranceCtor = new (text: string) => UtteranceLike;

const ABBREV = /\b(Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc)\./g;
const DOT = '\u0001';

/** Cleans text so the voice reads it the way a person would: punctuation becomes pauses, no stray symbols. */
export function prepareSpeech(text: string): string {
  return text
    .replace(/[*_#~`]+/g, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\.{3,}|…/g, '… ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits a paragraph into sentence-sized pieces that are comfortable for the engine. */
export function splitSentences(text: string, maxLen = 240): string[] {
  const raw = text.replace(/\s+/g, ' ').trim().replace(ABBREV, (m) => m.slice(0, -1) + DOT);
  if (!raw) return [];
  const parts = raw.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)\s*/g) ?? [raw];
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t) continue;
    const prev = out[out.length - 1];
    // Glue very short pieces ("Oh." / "Hm.") to a neighbour so speech keeps its flow.
    if (prev !== undefined && (prev.length < 18 || t.length < 14) && prev.length + t.length + 1 <= maxLen) out[out.length - 1] = `${prev} ${t}`;
    else out.push(t);
  }
  // Very long sentences are cut at commas, semicolons or spaces.
  const final: string[] = [];
  for (const s of out) {
    if (s.length <= maxLen) {
      final.push(s);
      continue;
    }
    let rest = s;
    while (rest.length > maxLen) {
      let cut = Math.max(rest.lastIndexOf(', ', maxLen), rest.lastIndexOf('; ', maxLen), rest.lastIndexOf(' — ', maxLen));
      if (cut < maxLen * 0.4) cut = rest.lastIndexOf(' ', maxLen);
      if (cut <= 0) cut = maxLen;
      final.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) final.push(rest);
  }
  return final.map((x) => prepareSpeech(x.split(DOT).join('.'))).filter(Boolean);
}

/** "Microsoft Aria Online (Natural) - English (United States)" -> "Aria". */
export function friendlyVoiceName(name: string): string {
  return (
    name
      .replace(/^Microsoft\s+/i, '')
      .replace(/\s+-\s+.*$/, '')
      .replace(/\s+(Online|Desktop)\b/gi, '')
      .replace(/\s*\(Natural\)/i, '')
      .trim() || name
  );
}

/** Local voices only, the user's language first, stable order. */
export function listLocalVoices(all: VoiceLike[], preferLang = 'en'): VoiceInfo[] {
  const local = all.filter((v) => v.localService && v.voiceURI);
  const mine = local.filter((v) => v.lang.toLowerCase().startsWith(preferLang));
  const use = mine.length ? mine : local;
  return use
    .map((v) => ({ uri: v.voiceURI, name: friendlyVoiceName(v.name), lang: v.lang }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Higher is more natural-sounding. Neural-style voices first, then the clearer classic ones. */
export function voiceScore(name: string): number {
  const n = name.toLowerCase();
  let sc = 0;
  if (/natural|neural/.test(n)) sc += 100;
  if (/\b(aria|jenny|sonia|libby|ryan|guy|davis|emma|brian)\b/.test(n)) sc += 40;
  if (/\b(zira|hazel|susan|george)\b/.test(n)) sc += 25;
  if (/\b(david|mark)\b/.test(n)) sc += 15;
  if (/en-us|united states|en-gb|united kingdom/.test(n)) sc += 3;
  return sc;
}

/** The voice used when the reader has not chosen one. */
export function pickBestVoice(all: VoiceLike[], preferLang = 'en'): VoiceLike | null {
  const local = all.filter((v) => v.localService && v.voiceURI);
  const mine = local.filter((v) => v.lang.toLowerCase().startsWith(preferLang));
  const use = mine.length ? mine : local;
  return [...use].sort((a, b) => voiceScore(b.name) - voiceScore(a.name) || a.name.localeCompare(b.name))[0] ?? null;
}

export interface ReadAloudOptions {
  /** Quiet moment between paragraphs, in ms (a natural breath). Default 450. */
  paragraphPauseMs?: number;
  synth?: SynthLike | null;
  Utterance?: UtteranceCtor | null;
  /** Called whenever the paragraph being read changes. */
  onParagraph?: (index: number) => void;
  /** Called when the last paragraph has been read to the end. */
  onFinish?: () => void;
  /** Wait between cancel() and speak(); some engines drop a speak() issued right after cancel(). */
  restartDelayMs?: number;
}

export class ReadAloud {
  private synth: SynthLike | null;
  private Utt: UtteranceCtor | null;
  private paragraphs: string[][] = [];
  private para = 0;
  private sentence = 0;
  private gen = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private rate = 1;
  private tone: Tone = 'soft';
  private voiceUri = '';
  private volume = 1;
  private readonly opts: ReadAloudOptions;
  private readonly store = writable<ReadAloudState>({ supported: false, status: 'idle', index: 0, voices: [], error: null });
  private readonly voicesHandler = () => this.refreshVoices();
  readonly state: Readable<ReadAloudState> = { subscribe: this.store.subscribe };

  constructor(opts: ReadAloudOptions = {}) {
    this.opts = opts;
    const g = globalThis as unknown as { speechSynthesis?: SynthLike; SpeechSynthesisUtterance?: UtteranceCtor };
    this.synth = opts.synth !== undefined ? opts.synth : (g.speechSynthesis ?? null);
    this.Utt = opts.Utterance !== undefined ? opts.Utterance : (g.SpeechSynthesisUtterance ?? null);
    if (this.synth && this.Utt) {
      this.synth.addEventListener?.('voiceschanged', this.voicesHandler);
      this.refreshVoices();
    }
  }

  private patch(p: Partial<ReadAloudState>) {
    this.store.update((s) => ({ ...s, ...p }));
  }

  private refreshVoices() {
    if (!this.synth || !this.Utt) return;
    let voices: VoiceInfo[] = [];
    try {
      voices = listLocalVoices(this.synth.getVoices());
    } catch {
      voices = [];
    }
    this.patch({ voices, supported: voices.length > 0 });
  }

  get status(): ReadStatus {
    return get(this.store).status;
  }

  /** Loads the paragraphs of the chapter to read. Stops any narration in progress. */
  setText(paragraphs: string[], start = 0) {
    this.halt();
    this.paragraphs = paragraphs.map((p) => splitSentences(p));
    this.para = Math.max(0, Math.min(start, Math.max(0, this.paragraphs.length - 1)));
    this.sentence = 0;
    this.patch({ status: 'idle', index: this.para, error: null });
  }

  setRate(rate: number) {
    const next = Math.max(0.75, Math.min(1.5, rate));
    if (next === this.rate) return;
    this.rate = next;
    if (this.status === 'playing') this.restartHere();
  }
  setVoice(uri: string) {
    if (uri === this.voiceUri) return;
    this.voiceUri = uri;
    if (this.status === 'playing') this.restartHere();
  }
  setTone(tone: Tone) {
    if (tone === this.tone) return;
    this.tone = tone;
    if (this.status === 'playing') this.restartHere();
  }
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.status === 'playing') this.restartHere();
  }

  /** Starts reading from `index` (or from the current paragraph). */
  play(index?: number) {
    if (!this.synth || !this.Utt || !get(this.store).supported) {
      this.patch({ error: "Read Aloud isn't available with the current system voice configuration." });
      return;
    }
    if (!this.paragraphs.length) return;
    if (index !== undefined) {
      this.para = Math.max(0, Math.min(index, this.paragraphs.length - 1));
      this.sentence = 0;
    }
    // A finished paragraph list starts over from the top.
    this.patch({ status: 'playing', index: this.para, error: null });
    this.opts.onParagraph?.(this.para);
    this.restartHere();
  }

  pause() {
    if (this.status !== 'playing') return;
    this.halt();
    this.patch({ status: 'paused' });
  }

  resume() {
    if (this.status !== 'paused') return;
    this.patch({ status: 'playing' });
    this.restartHere();
  }

  toggle() {
    const s = this.status;
    if (s === 'playing') this.pause();
    else if (s === 'paused') this.resume();
    else this.play();
  }

  stop() {
    this.halt();
    this.sentence = 0;
    this.patch({ status: 'idle' });
  }

  /** Jumps to the next paragraph; keeps playing if it was playing. */
  next() {
    this.jump(this.para + 1);
  }
  prev() {
    // Past the first sentence of a paragraph, "previous" restarts that paragraph first.
    this.jump(this.sentence > 0 ? this.para : this.para - 1);
  }

  private jump(to: number) {
    if (!this.paragraphs.length) return;
    const was = this.status;
    const target = Math.max(0, Math.min(to, this.paragraphs.length - 1));
    this.halt();
    this.para = target;
    this.sentence = 0;
    this.patch({ index: target });
    this.opts.onParagraph?.(target);
    if (was === 'playing') {
      this.patch({ status: 'playing' });
      this.restartHere();
    }
  }

  /** Releases the speech engine. Call when the reader closes. */
  destroy() {
    this.halt();
    this.synth?.removeEventListener?.('voiceschanged', this.voicesHandler);
    this.paragraphs = [];
    this.patch({ status: 'idle' });
  }

  // ---------------------------------------------------------------- internals

  /** Cancels the engine and invalidates every callback from the old utterance. */
  private halt() {
    this.gen++;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    try {
      this.synth?.cancel();
    } catch {
      /* the engine may already be gone */
    }
  }

  private restartHere() {
    this.halt();
    const myGen = this.gen;
    const delay = this.opts.restartDelayMs ?? 70;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (myGen === this.gen) this.speakCurrent(myGen);
    }, delay);
  }

  private speakCurrent(myGen: number) {
    if (!this.synth || !this.Utt) return;
    const sentences = this.paragraphs[this.para];
    if (!sentences || sentences.length === 0) {
      this.advance(myGen);
      return;
    }
    if (this.sentence >= sentences.length) {
      this.advance(myGen);
      return;
    }
    let u: UtteranceLike;
    try {
      u = new this.Utt(sentences[this.sentence]);
    } catch {
      this.fail('Read Aloud stopped unexpectedly.');
      return;
    }
    const all = this.synth.getVoices();
    const chosen = this.voiceUri ? (all.find((v) => v.voiceURI === this.voiceUri && v.localService) ?? null) : null;
    const voice = chosen ?? (this.voiceUri ? null : pickBestVoice(all));
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = this.rate;
    u.pitch = TONES.find((t) => t.id === this.tone)?.pitch ?? 1;
    u.volume = this.volume;
    u.onend = () => {
      if (myGen !== this.gen) return;
      this.sentence++;
      this.speakCurrent(myGen);
    };
    u.onerror = (e) => {
      if (myGen !== this.gen) return;
      if (e?.error === 'interrupted' || e?.error === 'canceled') return;
      this.fail("Read Aloud isn't available with the current system voice configuration.");
    };
    try {
      this.synth.speak(u);
    } catch {
      this.fail("Read Aloud isn't available with the current system voice configuration.");
    }
  }

  private advance(myGen: number) {
    if (myGen !== this.gen) return;
    if (this.para + 1 >= this.paragraphs.length) {
      this.halt();
      this.sentence = 0;
      this.para = 0;
      this.patch({ status: 'idle', index: 0 });
      this.opts.onFinish?.();
      return;
    }
    this.para++;
    this.sentence = 0;
    this.patch({ index: this.para });
    this.opts.onParagraph?.(this.para);
    // A short breath between paragraphs, the way a person reads aloud.
    const gap = this.opts.paragraphPauseMs ?? 450;
    if (gap > 0) {
      this.timer = setTimeout(() => {
        this.timer = null;
        if (myGen === this.gen) this.speakCurrent(myGen);
      }, gap);
    } else this.speakCurrent(myGen);
  }

  private fail(message: string) {
    this.halt();
    this.patch({ status: 'idle', error: message });
  }
}
