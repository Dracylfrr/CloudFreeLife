/**
 * Gentle procedural audio (Web Audio). Nothing is downloaded or bundled: every sound is
 * synthesised, so the app stays tiny and works offline.
 *
 * What makes it pleasant rather than "beepy":
 *  - every sound has a soft attack and a long, gentle decay (no clicks, no sharp edges);
 *  - tones are rounded sines with a quiet overtone, low-passed, never above about 1.3 kHz;
 *  - everything shares one warm room reverb, so sounds blend instead of stacking;
 *  - repeated sounds (bubbles, bricks) walk through a pentatonic scale, so a long
 *    run of them sounds like a little melody, never an annoying repeat;
 *  - a compressor keeps overlapping sounds soft.
 *
 * Buses: master -> music | ambience | effects | painting
 */
import { settings, type Settings } from './settings';
import { effectiveMusic, moodProfile } from './moods';
import { BUBBLE_RISE, MUSIC, noteHz, type MusicDef } from './music';
import { isAppHidden, onVisibilityChange } from './visibility';

type Bus = 'music' | 'ambience' | 'effects' | 'painting';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverbIn: GainNode | null = null;
const buses: Partial<Record<Bus, GainNode>> = {};
let noiseBuf: AudioBuffer | null = null;
let rainBuf: AudioBuffer | null = null;
let current: Settings | null = null;
/** 1 normally; a spare multiplier on music and ambience volume (kept at 1). */
let duck = 1;

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;
  if (!AC) return null;
  try {
    // Larger buffers: every sound here is soft and gentle, so a few milliseconds of extra latency is
    // unnoticeable, and the audio thread wakes far less often (this is most of the music's CPU cost).
    ctx = new AC({ latencyHint: 'playback' });
  } catch {
    return null;
  }
  master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor(); // keeps everything soft even if sounds overlap
  comp.threshold.value = -24;
  comp.ratio.value = 6;
  master.connect(comp).connect(ctx.destination);
  for (const b of ['music', 'ambience', 'effects', 'painting'] as Bus[]) {
    const g = ctx.createGain();
    g.connect(master);
    buses[b] = g;
  }

  // A small, warm room: decaying noise, rounded so there is no hiss.
  reverbIn = ctx.createGain();
  const conv = ctx.createConvolver();
  const irLen = Math.floor(ctx.sampleRate * 1.7);
  const ir = ctx.createBuffer(1, irLen, ctx.sampleRate); // mono keeps the convolution cheap
  for (let ch = 0; ch < 1; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < irLen; i++) {
      const decay = Math.pow(1 - i / irLen, 3);
      lp += 0.35 * ((Math.random() * 2 - 1) * decay - lp);
      d[i] = lp * 1.6;
    }
  }
  conv.buffer = ir;
  const wetOut = ctx.createGain();
  wetOut.gain.value = 0.8;
  reverbIn.connect(conv).connect(wetOut).connect(master);

  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    // brownish noise: soft, no hiss
    last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04;
    d[i] = last * 3.2;
  }
  // a lighter, rain-like noise for the Rain Pause track
  rainBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const r = rainBuf.getChannelData(0);
  let p = 0;
  for (let i = 0; i < len; i++) {
    p += 0.6 * ((Math.random() * 2 - 1) - p);
    r[i] = p * 0.9;
  }
  applyVolumes();
  return ctx;
}

function applyVolumes() {
  if (!ctx || !master || !current) return;
  const s = current;
  const t = ctx.currentTime;
  const m = s.muted ? 0 : s.volumeMaster;
  master.gain.setTargetAtTime(m * 0.9, t, 0.05);
  buses.music?.gain.setTargetAtTime(s.volumeMusic * duck, t, 0.25);
  buses.ambience?.gain.setTargetAtTime(s.volumeAmbience * duck, t, 0.25);
  buses.effects?.gain.setTargetAtTime(s.volumeEffects, t, 0.05);
  buses.painting?.gain.setTargetAtTime(s.volumePainting, t, 0.05);
}

function canPlay(bus: Bus): AudioContext | null {
  if (!current || current.muted || current.volumeMaster === 0) return null;
  const vol = { music: current.volumeMusic, ambience: current.volumeAmbience, effects: current.volumeEffects, painting: current.volumePainting }[bus];
  if (vol === 0) return null;
  const c = ensure();
  if (!c) return null;
  if (c.state === 'suspended') void c.resume();
  return c;
}

const mood = () => moodProfile(current?.mood ?? 'default');

interface ToneOpts {
  freq: number;
  to?: number;
  /** Seconds the glide to `to` takes (default: the whole note). */
  glide?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  bus?: Bus;
  delay?: number;
  /** Low-pass cut-off in Hz (default 2600, then made warmer by the mood). */
  lp?: number;
  /** How much of the sound also goes to the room reverb (0..1). */
  wet?: number;
  /** Connect here instead of the bus (used by music sessions). */
  out?: AudioNode;
}

/** A soft enveloped tone: slow-ish attack, long gentle decay, low-passed, a touch of room. */
function tone(o: ToneOpts) {
  const bus = o.bus ?? 'effects';
  const c = canPlay(bus);
  if (!c) return;
  const m = mood();
  const soft = bus === 'effects' || bus === 'painting' ? m.softness : 1;
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.glide ?? o.dur));
  const g = c.createGain();
  const peak = (o.gain ?? 0.06) * soft;
  const attack = Math.max(0.008, o.attack ?? 0.015);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = (o.lp ?? 2600) * (bus === 'effects' || bus === 'painting' ? m.warmth : 1);
  osc.connect(f).connect(g);
  g.connect(o.out ?? buses[bus]!);
  const wet = (o.wet ?? 0.15) * (bus === 'effects' ? m.reverb : 1);
  if (wet > 0 && reverbIn) {
    const send = c.createGain();
    send.gain.value = wet;
    g.connect(send).connect(reverbIn);
  }
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

/** A soft bell / music-box note: a rounded fundamental plus two quiet, quickly fading overtones. */
function bell(freq: number, o: { dur?: number; gain?: number; delay?: number; wet?: number; bus?: Bus; out?: AudioNode; attack?: number } = {}) {
  const dur = o.dur ?? 1.6;
  const gain = o.gain ?? 0.05;
  const common = { bus: o.bus, delay: o.delay, wet: o.wet ?? 0.5, out: o.out, lp: 3000 };
  tone({ ...common, freq, dur, gain, attack: o.attack ?? 0.012 });
  // Overtones add sparkle, but never anything shrill: skip any that would land above 2.6 kHz.
  if (freq * 2 < 2600) tone({ ...common, freq: freq * 2, dur: dur * 0.55, gain: gain * 0.22, attack: 0.01 });
  if (freq * 3.01 < 2600) tone({ ...common, freq: freq * 3.01, dur: dur * 0.3, gain: gain * 0.07, attack: 0.008 });
}

/** A woody, marimba-like note. */
function pluck(freq: number, o: { dur?: number; gain?: number; delay?: number; wet?: number } = {}) {
  const dur = o.dur ?? 0.4;
  const gain = o.gain ?? 0.06;
  tone({ freq, dur, gain, attack: 0.008, lp: 1800, wet: o.wet ?? 0.3, delay: o.delay });
  tone({ freq: freq * 4, dur: dur * 0.18, gain: gain * 0.25, attack: 0.005, lp: 2400, wet: 0.1, delay: o.delay });
}

/** A soft burst of filtered noise (splashes, page turns). */
function noise(o: { dur: number; freq: number; q?: number; gain?: number; sweepTo?: number; bus?: Bus; delay?: number; attack?: number; wet?: number }) {
  const bus = o.bus ?? 'effects';
  const c = canPlay(bus);
  if (!c || !noiseBuf) return;
  const m = mood();
  const t0 = c.currentTime + (o.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = o.q ?? 0.8;
  f.frequency.setValueAtTime(o.freq * m.warmth, t0);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo * m.warmth, t0 + o.dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime((o.gain ?? 0.1) * m.softness, t0 + Math.max(0.02, o.attack ?? 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  src.connect(f).connect(g).connect(buses[bus]!);
  if (o.wet && reverbIn) {
    const send = c.createGain();
    send.gain.value = o.wet * m.reverb;
    g.connect(send).connect(reverbIn);
  }
  src.start(t0, Math.random() * 1.5);
  src.stop(t0 + o.dur + 0.05);
}

// Notes for effect sounds: C major pentatonic from C5 to C6, nothing above ~1.05 kHz.
const SFX_SCALE = [0, 2, 4, 7, 9, 12];
const SFX_ROOT = 523.25;
let walk = 0;
/** The next note of a gentle, wandering melody: repeated sounds sing rather than repeat. */
function nextNote(): number {
  walk = (walk + 1 + (Math.random() < 0.4 ? 1 : 0)) % (SFX_SCALE.length * 2);
  const i = walk < SFX_SCALE.length ? walk : SFX_SCALE.length * 2 - 1 - walk; // up, then down
  return noteHz(SFX_ROOT, SFX_SCALE[i]);
}

let lastClick = 0;

export const sfx = {
  /** Buttons and toggles: a quiet, rounded tick. */
  click() {
    const now = performance.now();
    if (now - lastClick < 60) return;
    lastClick = now;
    tone({ freq: 500, to: 420, dur: 0.08, gain: 0.03, attack: 0.008, lp: 1300, wet: 0.06 });
    tone({ freq: 190, dur: 0.07, gain: 0.018, attack: 0.008, lp: 500, wet: 0 });
  },
  /** A soft "bloop". */
  pop(pitch = 1) {
    tone({ freq: 360 * pitch, to: 640 * pitch, dur: 0.14, gain: 0.055, attack: 0.01, lp: 1800, wet: 0.25 });
  },
  /** A bubble that always lands on a pleasant note. */
  bubble() {
    const f = nextNote();
    tone({ freq: f * 0.9, to: f, dur: 0.17, gain: 0.05, attack: 0.012, lp: 2000, wet: 0.35 });
  },
  /** A paintball splash: a soft wet whoosh with a round low note, never a bang. */
  splash() {
    noise({ dur: 0.5, freq: 700, sweepTo: 300, q: 0.6, gain: 0.11, attack: 0.04, wet: 0.2 });
    tone({ freq: 170, to: 95, dur: 0.32, gain: 0.05, attack: 0.02, lp: 480, wet: 0.2 });
    tone({ freq: noteHz(SFX_ROOT, 7), to: noteHz(SFX_ROOT, 12), dur: 0.2, gain: 0.022, attack: 0.02, delay: 0.05, wet: 0.4 });
  },
  /** A paintball being thrown: a breath of air. */
  throw() {
    noise({ dur: 0.28, freq: 350, sweepTo: 800, q: 1, gain: 0.04, attack: 0.1 });
  },
  /** Turning a page of paper. */
  pageTurn() {
    noise({ dur: 0.3, freq: 1500, sweepTo: 750, q: 0.5, gain: 0.04, attack: 0.07, wet: 0.08 });
  },
  /** Completing something: a slow, warm rising chord of bells. */
  chime() {
    [0, 4, 7, 11, 14].forEach((s, i) => bell(noteHz(SFX_ROOT, s), { dur: 2.4, gain: 0.04, delay: i * 0.15, wet: 0.65 }));
  },
  /** Bricks and paddles: a marimba note that walks through the scale. */
  thud() {
    pluck(nextNote() * 0.5, { dur: 0.4, gain: 0.07 });
  },
  sparkle() {
    bell(noteHz(SFX_ROOT, 7), { dur: 1.1, gain: 0.028, wet: 0.6 });
    bell(noteHz(SFX_ROOT, 12), { dur: 1.1, gain: 0.022, delay: 0.09, wet: 0.6 });
  },
  /** Filling an area with colour. */
  fill() {
    noise({ dur: 0.3, freq: 600, sweepTo: 1100, q: 0.7, gain: 0.07, attack: 0.07, wet: 0.1 });
    tone({ freq: 330, to: 495, dur: 0.22, gain: 0.03, attack: 0.03, wet: 0.3 });
  },
  /** Turning a memory card over. */
  flip() {
    noise({ dur: 0.15, freq: 1400, sweepTo: 800, q: 0.6, gain: 0.04, attack: 0.03 });
    pluck(noteHz(SFX_ROOT, 4) * 0.5, { dur: 0.2, gain: 0.035 });
  },
  /** Two cards matching: a soft fifth. */
  match() {
    bell(noteHz(SFX_ROOT, 0), { dur: 1.3, gain: 0.04, wet: 0.5 });
    bell(noteHz(SFX_ROOT, 7), { dur: 1.3, gain: 0.04, delay: 0.1, wet: 0.5 });
  },
  /** A balloon or soft ball bouncing: a round, low "doof". */
  balloon() {
    tone({ freq: 280, to: 150, dur: 0.14, gain: 0.05, attack: 0.012, lp: 700, wet: 0.2 });
    noise({ dur: 0.1, freq: 900, q: 0.7, gain: 0.025, attack: 0.012 });
  },
  /** A singing bowl, for starting and ending a quiet moment. */
  bowl(root = 196) {
    bell(root, { dur: 6, gain: 0.06, attack: 0.04, wet: 0.7 });
    tone({ freq: root * 2.4, dur: 4, gain: 0.012, attack: 0.05, wet: 0.7, lp: 1500 });
  }
};

/** Short previews for the volume sliders in Settings. */
export const preview = {
  effects() {
    sfx.bubble();
    setTimeout(() => sfx.pop(), 220);
  },
  painting() {
    brushSound.begin('soft');
    brushSound.move(0.5);
    setTimeout(() => brushSound.move(0.8), 250);
    setTimeout(() => brushSound.end(), 800);
  },
  ambience() {
    if (current?.ambienceOn) return; // already audible
    startAmbience();
    setTimeout(() => {
      if (!current?.ambienceOn) stopAmbience();
    }, 2600);
  },
  music() {
    bell(noteHz(SFX_ROOT, 0), { bus: 'music', dur: 2, gain: 0.06, wet: 0.6 });
    bell(noteHz(SFX_ROOT, 7), { bus: 'music', dur: 2, gain: 0.05, delay: 0.25, wet: 0.6 });
  }
};

/* ------------------------- painting sound ------------------------- */
let brushSrc: AudioBufferSourceNode | null = null;
let brushGain: GainNode | null = null;
let brushFilter: BiquadFilterNode | null = null;

export const brushSound = {
  begin(kind: 'soft' | 'grainy' = 'soft') {
    const c = canPlay('painting');
    if (!c || !noiseBuf || brushSrc) return;
    brushSrc = c.createBufferSource();
    brushSrc.buffer = noiseBuf;
    brushSrc.loop = true;
    brushFilter = c.createBiquadFilter();
    brushFilter.type = 'bandpass';
    brushFilter.frequency.value = kind === 'grainy' ? 2000 : 1200;
    brushFilter.Q.value = 0.7;
    brushGain = c.createGain();
    brushGain.gain.value = 0.0001;
    brushSrc.connect(brushFilter).connect(brushGain).connect(buses.painting!);
    brushSrc.start(0, Math.random());
  },
  /** speed in canvas px per ms. */
  move(speed: number) {
    if (!brushGain || !ctx) return;
    const level = Math.min(0.14, speed * 0.08) * mood().softness;
    brushGain.gain.setTargetAtTime(level, ctx.currentTime, 0.06);
    if (brushFilter) brushFilter.frequency.setTargetAtTime(800 + Math.min(1200, speed * 800), ctx.currentTime, 0.06);
  },
  end() {
    if (!brushSrc || !brushGain || !ctx) return;
    const s = brushSrc;
    brushGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
    setTimeout(() => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }, 300);
    brushSrc = null;
    brushGain = null;
    brushFilter = null;
  }
};

/* ---------------------- background music (generated) ---------------------- */
interface Session {
  def: MusicDef;
  out: GainNode;
  chord: number;
  timer: ReturnType<typeof setTimeout> | null;
  rain: AudioBufferSourceNode | null;
}
let session: Session | null = null;
let sessionKey = '';

/** One sustained pad note: slow rise, long hold, slow fade, so chords melt into each other. */
function padNote(c: AudioContext, freq: number, t0: number, seconds: number, def: MusicDef, out: AudioNode, level: number, rich = false) {
  const g = c.createGain();
  const att = seconds * 0.38;
  const end = t0 + seconds + 3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(level, t0 + att);
  g.gain.setValueAtTime(level, t0 + seconds * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, end);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = def.padCutoff;
  f.connect(g).connect(out);
  // Light on purpose: one sine per chord tone (two on the low root for warmth) and no reverb on the
  // pad itself, so the room reverb only has to work when a bell rings. This keeps the music cheap.
  const layers: [OscillatorType, number][] = rich ? [['sine', -4], ['triangle', 5]] : [['sine', 0]];
  for (const [type, detune] of layers) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const og = c.createGain();
    og.gain.value = type === 'sine' ? 1 : 0.35;
    o.connect(og).connect(f);
    o.start(t0);
    o.stop(end + 0.1);
  }
}

/** A soft bubble: a rounded sine that rises a little as it "blooms", then fades. */
function bloop(freq: number, delay: number, level: number, out: AudioNode) {
  tone({ freq, to: freq * BUBBLE_RISE, glide: 0.07, dur: 0.34, gain: level, attack: 0.006, lp: 1500, wet: 0.35, bus: 'music', out, delay });
}

function playChord(s: Session) {
  if (session !== s || !ctx) return;
  const c = ctx;
  const def = s.def;
  const t0 = c.currentTime + 0.05;
  const chord = def.chords[s.chord % def.chords.length];
  const level = def.pad / Math.sqrt(chord.length);
  for (const semi of chord) padNote(c, noteHz(def.root, semi + 12), t0, def.chordSeconds, def, s.out, level);
  padNote(c, noteHz(def.root, chord[0]), t0, def.chordSeconds, def, s.out, level * 0.9, true); // a low root underneath
  // a few soft bells, mostly chord tones, never on a beat grid
  const count = Math.max(0, Math.round(def.bells * (0.6 + Math.random() * 0.8)));
  for (let i = 0; i < count; i++) {
    const at = 1.5 + Math.random() * Math.max(1, def.chordSeconds - 4);
    const semi = Math.random() < 0.6 ? chord[Math.floor(Math.random() * chord.length)] + 12 * (1 + Math.floor(Math.random() * 2)) : def.scale[Math.floor(Math.random() * def.scale.length)];
    bell(noteHz(def.root, semi), { bus: 'music', out: s.out, delay: at, dur: 4.6, gain: def.bell, wet: def.wet, attack: 0.03 });
  }
  // little runs of soft bubbles, off the beat, wandering up and down the scale. They step far back
  // while a meditation is running so a quiet session stays quiet.
  const bubbleScale = sessionSound !== null ? 0.25 : 1;
  let left = Math.round(def.bubbles * bubbleScale * (0.7 + Math.random() * 0.6));
  while (left > 0) {
    const run = Math.min(left, 2 + Math.floor(Math.random() * 3));
    let at = 0.8 + Math.random() * Math.max(1, def.chordSeconds - 3.5);
    let i = Math.floor(Math.random() * def.scale.length);
    for (let k = 0; k < run; k++) {
      bloop(noteHz(def.root, def.scale[i] + 12), at, def.bubble * (0.75 + Math.random() * 0.35), s.out);
      at += 0.14 + Math.random() * 0.13;
      i = Math.max(0, Math.min(def.scale.length - 1, i + (Math.random() < 0.6 ? 1 : -1) * (1 + (Math.random() < 0.3 ? 1 : 0))));
    }
    left -= run;
  }
  s.chord++;
  s.timer = setTimeout(() => playChord(s), def.chordSeconds * 1000 - 800);
}

function startMusic(def: MusicDef) {
  const c = canPlay('music');
  if (!c || !buses.music) return;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  out.gain.linearRampToValueAtTime(1, c.currentTime + 3.5); // fade in
  out.connect(buses.music);
  const s: Session = { def, out, chord: 0, timer: null, rain: null };
  if (def.rain && rainBuf) {
    const src = c.createBufferSource();
    src.buffer = rainBuf;
    src.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1100;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 6500;
    const g = c.createGain();
    g.gain.value = 0.16;
    src.connect(hp).connect(lp).connect(g).connect(out);
    src.start(0, Math.random());
    s.rain = src;
  }
  session = s;
  playChord(s);
}

/** Fades the current track out (or cuts it at once) and lets go of its nodes. */
function stopMusic(fadeSeconds = 1.8) {
  const s = session;
  session = null;
  sessionKey = '';
  if (!s) return;
  if (s.timer) clearTimeout(s.timer);
  const c = ctx;
  if (!c) return;
  s.out.gain.cancelScheduledValues(c.currentTime);
  s.out.gain.setTargetAtTime(0.0001, c.currentTime, Math.max(0.01, fadeSeconds / 4));
  setTimeout(
    () => {
      try {
        s.rain?.stop();
        s.out.disconnect();
      } catch {
        /* already gone */
      }
    },
    fadeSeconds * 1000 + 400
  );
}

/** The track currently chosen (by mood or by the Audio setting), or null when music is off. */
export function wantedMusic(s: Settings | null = current): string | null {
  if (!s || s.muted) return null;
  // During a meditation session the session picks the sound: the everyday music steps aside.
  if (sessionSound !== null) return sessionSound === 'garden' ? 'garden' : null;
  if (!s.musicOn) return null;
  return effectiveMusic(s.mood, s.musicMood, s.musicFollowsMood);
}

/** What a meditation session plays under it. null = no session, normal music rules apply. */
export type SessionSound = 'none' | 'rain' | 'hush' | 'garden';
let sessionSound: SessionSound | null = null;
let rainSrc: AudioBufferSourceNode | null = null;

/** Starts (or, with null, ends) the sound of a meditation session. */
export function setSessionSound(kind: SessionSound | null) {
  sessionSound = kind;
  syncLoops();
}

function startRain() {
  const c = canPlay('ambience');
  if (!c || !rainBuf || rainSrc || !buses.ambience) return;
  rainSrc = c.createBufferSource();
  rainSrc.buffer = rainBuf;
  rainSrc.loop = true;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 900;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 6000;
  const g = c.createGain();
  g.gain.value = 0.5;
  rainSrc.connect(hp).connect(lp).connect(g).connect(buses.ambience);
  rainSrc.start(0, Math.random());
}

function stopRain() {
  try {
    rainSrc?.stop();
  } catch {
    /* already stopped */
  }
  rainSrc = null;
}

/* ---------------------------- ambience (hush) ---------------------------- */
let ambSrc: AudioBufferSourceNode | null = null;
let ambLfo: OscillatorNode | null = null;

function startAmbience() {
  const c = canPlay('ambience');
  if (!c || !noiseBuf || ambSrc) return;
  ambSrc = c.createBufferSource();
  ambSrc.buffer = noiseBuf;
  ambSrc.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  const g = c.createGain();
  g.gain.value = 0.5;
  ambLfo = c.createOscillator();
  ambLfo.frequency.value = 0.07;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.25;
  ambLfo.connect(lfoGain).connect(g.gain);
  ambSrc.connect(lp).connect(g).connect(buses.ambience!);
  ambSrc.start();
  ambLfo.start();
}

function stopAmbience() {
  try {
    ambSrc?.stop();
    ambLfo?.stop();
  } catch {
    /* ignore */
  }
  ambSrc = null;
  ambLfo = null;
}

function syncLoops() {
  if (!current) return;
  const want = isAppHidden() ? null : wantedMusic(current);
  if (want !== (sessionKey || null)) {
    const had = !!session;
    stopMusic(had ? 2.2 : 0.01);
    if (want && canPlay('music')) {
      sessionKey = want;
      startMusic(MUSIC[want as keyof typeof MUSIC]);
    }
  }
  const hush = (current.ambienceOn || sessionSound === 'hush') && !isAppHidden() && !current.muted;
  if (hush) startAmbience();
  else stopAmbience();
  if (sessionSound === 'rain' && !isAppHidden() && !current.muted) startRain();
  else stopRain();
}

let initialised = false;

/** Call once at startup. Audio only actually begins after the first user gesture. */
export function initAudio() {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  settings.subscribe((s) => {
    current = s;
    applyVolumes();
    syncLoops();
  });
  const unlock = () => {
    if (ensure()) {
      if (ctx?.state === 'suspended') void ctx.resume();
      syncLoops();
    }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  // Pause all audio work when the window is hidden or minimised.
  onVisibilityChange(() => {
    if (!ctx) return;
    if (isAppHidden()) {
      stopMusic(0.01);
      stopAmbience();
      void ctx.suspend();
    } else {
      void ctx.resume();
      syncLoops();
    }
  });
}

/** Test hook: forget everything so a fake audio engine can be injected. */
export function __resetAudioForTests() {
  stopMusic(0.01);
  ctx = null;
  master = null;
  reverbIn = null;
  noiseBuf = null;
  rainBuf = null;
  current = null;
  duck = 1;
  initialised = false;
  session = null;
  sessionKey = '';
  ambSrc = null;
  ambLfo = null;
  sessionSound = null;
  rainSrc = null;
  for (const k of Object.keys(buses) as Bus[]) delete buses[k];
}
