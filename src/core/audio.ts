/**
 * Gentle procedural audio (Web Audio). Nothing is downloaded or bundled:
 * every sound is synthesised from soft sine/triangle tones and filtered noise,
 * kept deliberately quiet, with slow attacks and no sharp transients.
 *
 * Buses: master -> music | ambience | effects | painting
 */
import { settings, type Settings } from './settings';
import { isAppHidden, onVisibilityChange } from './visibility';

type Bus = 'music' | 'ambience' | 'effects' | 'painting';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buses: Partial<Record<Bus, GainNode>> = {};
let noiseBuf: AudioBuffer | null = null;
let current: Settings | null = null;

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined;
  if (!AC) return null;
  try {
    ctx = new AC({ latencyHint: 'interactive' });
  } catch {
    return null;
  }
  master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor(); // keeps everything soft even if sounds overlap
  comp.threshold.value = -22;
  comp.ratio.value = 6;
  master.connect(comp).connect(ctx.destination);
  for (const b of ['music', 'ambience', 'effects', 'painting'] as Bus[]) {
    const g = ctx.createGain();
    g.connect(master);
    buses[b] = g;
  }
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    // brownish noise: soft, no hiss
    last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04;
    d[i] = last * 3.2;
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
  buses.music?.gain.setTargetAtTime(s.volumeMusic, t, 0.1);
  buses.ambience?.gain.setTargetAtTime(s.volumeAmbience, t, 0.1);
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

/** A soft enveloped tone. */
function tone(opts: {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  bus?: Bus;
  delay?: number;
  lp?: number;
}) {
  const c = canPlay(opts.bus ?? 'effects');
  if (!c) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.dur);
  const g = c.createGain();
  const peak = opts.gain ?? 0.15;
  const attack = opts.attack ?? 0.012;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  let node: AudioNode = osc;
  if (opts.lp) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = opts.lp;
    osc.connect(f);
    node = f;
  }
  node.connect(g).connect(buses[opts.bus ?? 'effects']!);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

/** A soft burst of filtered noise (splashes, page turns). */
function noise(opts: { dur: number; freq: number; q?: number; gain?: number; sweepTo?: number; bus?: Bus; delay?: number; attack?: number }) {
  const c = canPlay(opts.bus ?? 'effects');
  if (!c || !noiseBuf) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = opts.q ?? 0.9;
  f.frequency.setValueAtTime(opts.freq, t0);
  if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t0 + opts.dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.25, t0 + (opts.attack ?? 0.03));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  src.connect(f).connect(g).connect(buses[opts.bus ?? 'effects']!);
  src.start(t0, Math.random() * 1.5);
  src.stop(t0 + opts.dur + 0.05);
}

let lastClick = 0;

export const sfx = {
  click() {
    const now = performance.now();
    if (now - lastClick < 60) return;
    lastClick = now;
    tone({ freq: 620, to: 520, dur: 0.09, gain: 0.05, attack: 0.008, type: 'sine' });
  },
  pop(pitch = 1) {
    tone({ freq: 520 * pitch, to: 880 * pitch, dur: 0.12, gain: 0.09, attack: 0.006, type: 'sine', lp: 2400 });
  },
  bubble() {
    const p = 0.8 + Math.random() * 0.5;
    tone({ freq: 420 * p, to: 760 * p, dur: 0.14, gain: 0.07, attack: 0.01, type: 'sine', lp: 2000 });
  },
  splash() {
    noise({ dur: 0.38, freq: 900, sweepTo: 420, q: 0.7, gain: 0.22, attack: 0.02 });
    tone({ freq: 300, to: 160, dur: 0.22, gain: 0.07, attack: 0.01, type: 'sine', lp: 900 });
  },
  throw() {
    noise({ dur: 0.22, freq: 500, sweepTo: 1100, q: 1.2, gain: 0.08, attack: 0.05 });
  },
  pageTurn() {
    noise({ dur: 0.3, freq: 1500, sweepTo: 700, q: 0.6, gain: 0.1, attack: 0.08 });
  },
  chime() {
    [523.25, 659.25, 783.99].forEach((f, i) => tone({ freq: f, dur: 1.4, gain: 0.07, attack: 0.02, delay: i * 0.12, type: 'sine', lp: 3000 }));
  },
  thud() {
    tone({ freq: 220, to: 150, dur: 0.1, gain: 0.07, attack: 0.006, type: 'sine', lp: 700 });
  },
  sparkle() {
    tone({ freq: 1320, to: 1760, dur: 0.22, gain: 0.04, attack: 0.01, type: 'sine' });
  },
  fill() {
    noise({ dur: 0.28, freq: 700, sweepTo: 1400, q: 0.8, gain: 0.12, attack: 0.05 });
    tone({ freq: 440, to: 660, dur: 0.18, gain: 0.04, attack: 0.02 });
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
    brushFilter.frequency.value = kind === 'grainy' ? 2200 : 1300;
    brushFilter.Q.value = 0.7;
    brushGain = c.createGain();
    brushGain.gain.value = 0.0001;
    brushSrc.connect(brushFilter).connect(brushGain).connect(buses.painting!);
    brushSrc.start(0, Math.random());
  },
  /** speed in canvas px per ms. */
  move(speed: number) {
    if (!brushGain || !ctx) return;
    const level = Math.min(0.16, speed * 0.09);
    brushGain.gain.setTargetAtTime(level, ctx.currentTime, 0.04);
    if (brushFilter) brushFilter.frequency.setTargetAtTime(900 + Math.min(1400, speed * 900), ctx.currentTime, 0.05);
  },
  end() {
    if (!brushSrc || !brushGain || !ctx) return;
    const s = brushSrc;
    brushGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
    setTimeout(() => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }, 250);
    brushSrc = null;
    brushGain = null;
    brushFilter = null;
  }
};

/* ---------------------- music & ambience (loops) ---------------------- */
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
let musicTimer: ReturnType<typeof setTimeout> | null = null;
let musicStep = 0;

function scheduleMusic() {
  musicTimer = null;
  if (!current?.musicOn || isAppHidden()) return;
  if (canPlay('music')) {
    const base = PENTATONIC[(musicStep * 2 + Math.floor(Math.random() * 3)) % PENTATONIC.length];
    tone({ freq: base, dur: 3.4, gain: 0.07, attack: 0.05, bus: 'music', type: 'sine', lp: 2600 });
    tone({ freq: base * 2, dur: 2.4, gain: 0.018, attack: 0.05, bus: 'music', type: 'sine', delay: 0.02 });
    if (Math.random() < 0.45) tone({ freq: PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] / 2, dur: 4.5, gain: 0.05, attack: 0.4, bus: 'music', type: 'triangle', lp: 900, delay: 0.5 });
    musicStep++;
  }
  musicTimer = setTimeout(scheduleMusic, 2600 + Math.random() * 2600);
}

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
  if (current.musicOn && !musicTimer && !isAppHidden()) {
    if (canPlay('music')) musicTimer = setTimeout(scheduleMusic, 400);
  } else if (!current.musicOn && musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
  if (current.ambienceOn && !isAppHidden()) startAmbience();
  else stopAmbience();
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
      void ctx.suspend();
      if (musicTimer) {
        clearTimeout(musicTimer);
        musicTimer = null;
      }
    } else {
      void ctx.resume();
      syncLoops();
    }
  });
}
