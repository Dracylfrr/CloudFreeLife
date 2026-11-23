// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetSettingsForTests, sanitizeSettings, updateSettings, DEFAULT_SETTINGS } from '../src/core/settings';
import { MOOD_PROFILES, effectiveMusic, moodProfile } from '../src/core/moods';
import { MUSIC, allPitches } from '../src/core/music';
import { __setMinimizedForTests } from '../src/core/visibility';
import { __resetAudioForTests, initAudio, preview, setNarrating, sfx, wantedMusic } from '../src/core/audio';

// ---- a tiny fake Web Audio engine that records what would be played ----
class Param {
  value = 0;
  peaks: number[] = [];
  targets: number[] = [];
  setValueAtTime(v: number) {
    this.value = v;
    this.peaks.push(v);
  }
  linearRampToValueAtTime(v: number) {
    this.peaks.push(v);
  }
  exponentialRampToValueAtTime(v: number) {
    this.targets.push(v);
  }
  setTargetAtTime(v: number) {
    this.value = v;
    this.targets.push(v);
  }
  cancelScheduledValues() {}
}
class Node {
  connect<T>(n: T): T {
    return n;
  }
  disconnect() {}
}
const log = { oscillators: [] as Osc[], gains: [] as Gain[], sources: 0, stopped: 0, filters: [] as Filter[] };
class Gain extends Node {
  gain = new Param();
  constructor() {
    super();
    log.gains.push(this);
  }
}
class Osc extends Node {
  type = 'sine';
  frequency = new Param();
  detune = new Param();
  started = 0;
  constructor() {
    super();
    log.oscillators.push(this);
  }
  start() {
    this.started++;
  }
  stop() {
    log.stopped++;
  }
}
class Filter extends Node {
  type = '';
  frequency = new Param();
  Q = new Param();
  constructor() {
    super();
    log.filters.push(this);
  }
}
class Src extends Node {
  buffer: unknown = null;
  loop = false;
  constructor() {
    super();
    log.sources++;
  }
  start() {}
  stop() {
    log.stopped++;
  }
}
class FakeCtx {
  currentTime = 0;
  sampleRate = 4000;
  state = 'running';
  destination = new Node();
  createGain = () => new Gain();
  createOscillator = () => new Osc();
  createBiquadFilter = () => new Filter();
  createBufferSource = () => new Src();
  createConvolver = () => Object.assign(new Node(), { buffer: null });
  createDynamicsCompressor = () => Object.assign(new Node(), { threshold: new Param(), ratio: new Param() });
  createBuffer = (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) });
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
}

/** Highest level any gain envelope reached, and the highest tone frequency requested. */
const peakGain = () => Math.max(0, ...log.gains.flatMap((g) => g.gain.peaks.filter((v) => v < 1)));
const topFreq = () => Math.max(0, ...log.oscillators.map((o) => Math.max(...o.frequency.peaks, ...o.frequency.targets)));

const gesture = () => window.dispatchEvent(new Event('pointerdown'));

beforeEach(() => {
  vi.useFakeTimers();
  log.oscillators.length = log.gains.length = log.filters.length = 0;
  log.sources = log.stopped = 0;
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeCtx;
  __resetAudioForTests();
  __resetSettingsForTests();
  __setMinimizedForTests(false);
  updateSettings({ musicOn: false, ambienceOn: false });
  initAudio();
  gesture();
  log.oscillators.length = 0; // ignore set-up nodes (the bus gains stay in the log)
});
afterEach(() => {
  __resetAudioForTests();
  vi.useRealTimers();
});

const ALL_SFX = ['click', 'pop', 'bubble', 'splash', 'throw', 'pageTurn', 'chime', 'thud', 'sparkle', 'fill', 'flip', 'match', 'balloon', 'bowl'] as const;

describe('sound effects stay soft', () => {
  it('every effect plays without error, quietly, and nothing piercing', () => {
    for (const name of ALL_SFX) {
      log.oscillators.length = log.gains.length = 0;
      vi.advanceTimersByTime(200); // click is rate-limited
      expect(() => sfx[name]()).not.toThrow();
      expect(log.oscillators.length + log.sources, `${name} makes sound`).toBeGreaterThan(0);
      // a single envelope never goes above a gentle level (chimes are layered bells, each quieter still)
      expect(peakGain(), `${name} loudness`).toBeLessThanOrEqual(0.12);
      // no harsh high frequencies: tones top out around the middle of a piano
      expect(topFreq(), `${name} pitch`).toBeLessThanOrEqual(2600);
    }
  });

  it('every effect has a soft attack, never an instant click', () => {
    // attacks are at least 8 ms: the ramp starts from ~0, never from a loud value
    for (const name of ALL_SFX) {
      log.gains.length = 0;
      vi.advanceTimersByTime(200);
      sfx[name]();
      for (const g of log.gains) {
        const first = g.gain.peaks[0];
        if (first !== undefined && g.gain.peaks.length > 1) expect(first, `${name} starts silent`).toBeLessThan(0.001);
      }
    }
  });

  it('the main tones stay in a comfortable range (below 1.3 kHz)', () => {
    for (const name of ['click', 'pop', 'bubble', 'thud', 'splash', 'balloon', 'flip', 'match', 'chime'] as const) {
      log.oscillators.length = 0;
      sfx[name]();
      const fundamentals = log.oscillators.map((o) => o.frequency.peaks[0]);
      expect(Math.min(...fundamentals), name).toBeGreaterThan(60);
      expect(Math.max(...fundamentals.slice(0, 1)), name).toBeLessThanOrEqual(1300);
    }
  });

  it('repeated bubbles walk through a musical scale instead of repeating one note', () => {
    const notes = new Set<number>();
    for (let i = 0; i < 24; i++) {
      log.oscillators.length = 0;
      vi.advanceTimersByTime(100);
      sfx.bubble();
      notes.add(Math.round(log.oscillators[0].frequency.targets[0]));
    }
    expect(notes.size).toBeGreaterThanOrEqual(4);
  });

  it('respects mute and a zero Effects volume', () => {
    updateSettings({ muted: true });
    sfx.chime();
    expect(log.oscillators.length).toBe(0);
    updateSettings({ muted: false, volumeEffects: 0 });
    sfx.chime();
    expect(log.oscillators.length).toBe(0);
    updateSettings({ volumeEffects: 0.6 });
    sfx.chime();
    expect(log.oscillators.length).toBeGreaterThan(0);
  });

  it('calmer moods make effects softer', () => {
    const level = (mood: 'default' | 'chill') => {
      updateSettings({ mood });
      log.gains.length = 0;
      sfx.pop();
      return peakGain();
    };
    const normal = level('default');
    const chill = level('chill');
    expect(chill).toBeLessThan(normal);
    expect(chill / normal).toBeCloseTo(MOOD_PROFILES.chill.softness, 1);
  });

  it('previews for each volume slider make a sound', () => {
    for (const k of ['effects', 'painting', 'music'] as const) {
      log.oscillators.length = 0;
      log.sources = 0;
      preview[k]();
      vi.advanceTimersByTime(1000);
      expect(log.oscillators.length + log.sources, k).toBeGreaterThan(0);
    }
    log.sources = 0;
    preview.ambience();
    expect(log.sources).toBeGreaterThan(0);
    vi.advanceTimersByTime(3000);
    expect(log.stopped).toBeGreaterThan(0); // the preview hush stops by itself
  });
});

describe('background music', () => {
  it('is on by default for a new install, at a low volume', () => {
    expect(DEFAULT_SETTINGS.musicOn).toBe(true);
    expect(DEFAULT_SETTINGS.volumeMusic).toBeLessThanOrEqual(0.5);
  });

  it('starts when switched on, then moves through the chords and keeps playing quietly', () => {
    updateSettings({ musicOn: true, musicMood: 'morning' });
    expect(log.oscillators.length).toBeGreaterThan(4); // pad notes of the first chord
    const first = log.oscillators.length;
    vi.advanceTimersByTime(MUSIC.morning.chordSeconds * 1000);
    expect(log.oscillators.length).toBeGreaterThan(first); // the next chord was scheduled
    expect(peakGain()).toBeLessThan(0.1);
  });

  it('fades out and stops scheduling when switched off', () => {
    updateSettings({ musicOn: true });
    vi.advanceTimersByTime(1000);
    updateSettings({ musicOn: false });
    vi.advanceTimersByTime(5000);
    const count = log.oscillators.length;
    vi.advanceTimersByTime(60_000);
    expect(log.oscillators.length).toBe(count); // no new notes after it was turned off
    expect(vi.getTimerCount()).toBe(0); // and no timer is left running
  });

  it('stops while the app is minimized and comes back afterwards', () => {
    updateSettings({ musicOn: true });
    __setMinimizedForTests(true);
    vi.advanceTimersByTime(1000);
    const count = log.oscillators.length;
    vi.advanceTimersByTime(60_000);
    expect(log.oscillators.length).toBe(count);
    __setMinimizedForTests(false);
    expect(log.oscillators.length).toBeGreaterThan(count);
  });

  it('a mood picks its own track, and changing mood swaps the track', () => {
    updateSettings({ musicOn: true, musicMood: 'morning', mood: 'default' });
    expect(wantedMusic()).toBe('morning');
    updateSettings({ mood: 'chill' });
    expect(wantedMusic()).toBe('rain');
    const before = log.oscillators.length;
    updateSettings({ mood: 'dreamy' });
    expect(wantedMusic()).toBe('night');
    expect(log.oscillators.length).toBeGreaterThan(before);
    expect(effectiveMusic('cozy', 'morning')).toBe('garden');
    expect(effectiveMusic('default', 'night')).toBe('night');
  });

  it('the rain track adds a soft rain layer', () => {
    updateSettings({ musicOn: true, musicMood: 'rain' });
    expect(log.sources).toBeGreaterThan(0);
  });

  it('stays quiet and does nothing when muted', () => {
    updateSettings({ musicOn: true, muted: true });
    expect(log.oscillators.length).toBe(0);
  });

  it('every track uses safe, gentle pitches and levels', () => {
    for (const def of Object.values(MUSIC)) {
      const hz = allPitches(def);
      expect(Math.min(...hz), def.id).toBeGreaterThan(70);
      expect(Math.max(...hz), def.id).toBeLessThan(1700);
      expect(def.pad, def.id).toBeLessThanOrEqual(0.06);
      expect(def.bell, def.id).toBeLessThanOrEqual(0.06);
      expect(def.padCutoff, def.id).toBeLessThanOrEqual(1000);
      expect(def.chords.length, def.id).toBeGreaterThanOrEqual(4);
      expect(def.chordSeconds, def.id).toBeGreaterThanOrEqual(10); // slow
    }
  });

  it('narration lowers the music so the voice stays clear, and restores it afterwards', () => {
    updateSettings({ musicOn: true });
    const music = log.gains.find((g) => Math.abs(g.gain.value - DEFAULT_SETTINGS.volumeMusic) < 1e-6);
    expect(music).toBeTruthy();
    setNarrating(true);
    expect(music!.gain.value).toBeCloseTo(DEFAULT_SETTINGS.volumeMusic * 0.3, 3);
    setNarrating(false);
    expect(music!.gain.value).toBeCloseTo(DEFAULT_SETTINGS.volumeMusic, 3);
  });
});

describe('mood presets and audio settings persistence', () => {
  it('all moods have sensible, gentle profiles', () => {
    for (const m of Object.values(MOOD_PROFILES)) {
      expect(m.softness).toBeGreaterThan(0.5);
      expect(m.softness).toBeLessThanOrEqual(1);
      expect(m.ambientSpeed).toBeGreaterThan(0.2);
      expect(m.ambientSpeed).toBeLessThanOrEqual(1);
    }
    expect(moodProfile('default').softness).toBe(1);
    expect(moodProfile('nonsense' as never).id).toBe('default');
  });

  it('saves and restores volumes, music style, mood and mute; ignores junk', () => {
    const s = sanitizeSettings({ volumeMaster: 0.4, volumeMusic: 0.2, volumeAmbience: 0.1, volumeEffects: 0.5, volumePainting: 0.3, musicOn: false, musicMood: 'rain', mood: 'cozy', muted: true });
    expect(s).toMatchObject({ volumeMaster: 0.4, volumeMusic: 0.2, volumeAmbience: 0.1, volumeEffects: 0.5, volumePainting: 0.3, musicOn: false, musicMood: 'rain', mood: 'cozy', muted: true });
    const bad = sanitizeSettings({ volumeMaster: 7, volumeMusic: -2, musicMood: 'heavy_metal', mood: 'angry' });
    expect(bad.volumeMaster).toBe(1);
    expect(bad.volumeMusic).toBe(0);
    expect(bad.musicMood).toBe('morning');
    expect(bad.mood).toBe('default');
  });

  it('upgrading a v1.2 settings file turns the new background music on once, keeping everything else', () => {
    const up = sanitizeSettings({ schema: 1, musicOn: false, ambienceOn: true, volumeMusic: 0.35, volumeMaster: 0.5 });
    expect(up).toMatchObject({ musicOn: true, ambienceOn: true, volumeMusic: 0.35, volumeMaster: 0.5, musicMood: 'morning' });
    // once the file is a 1.3 file, the person's choice is respected forever
    expect(sanitizeSettings({ ...up, musicOn: false }).musicOn).toBe(false);
    expect(sanitizeSettings({ schema: 2, musicOn: false }).musicOn).toBe(false);
  });
});
