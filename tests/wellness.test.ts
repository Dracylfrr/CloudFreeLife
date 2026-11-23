// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { buildCatalog, type Catalog } from '../src/core/content/registry';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { validateMeditation, validateMovement } from '../src/core/manifests14';
import { PHASE_WORDS, breathAt, clock, cueAt, cycleLength, minutesLabel } from '../src/features/meditation/breath';
import { loadMeditationProgress, markFinished, markStarted, meditationProgress, sanitizeMeditation, toggleMeditationFavorite } from '../src/features/meditation/progress';
import { loadMovementProgress, markMovementOpened, movementProgress, sanitizeMovement, toggleMovementFavorite } from '../src/features/movement/progress';
import { installPack, parsePack, validatePackContents } from '../src/features/updates/packs';
import { persisted } from '../src/core/persist';
import { DiskTree, readAllText } from './helpers/diskTree';

let catalog: Catalog;
beforeEach(async () => {
  catalog ??= await buildCatalog([new DiskTree()]);
});

const enc = (s: string) => new TextEncoder().encode(s);
const med = (extra: Record<string, unknown> = {}) => ({ id: 'calm', name: 'Calm', description: 'd', version: '1.4.0', minAppVersion: '1.4.0', cover: 'cover.svg', kind: 'stillness', minutes: 3, cues: [], ...extra });
const mov = (extra: Record<string, unknown> = {}) => ({ id: 'stretch', name: 'Stretch', description: 'd', version: '1.4.0', minAppVersion: '1.4.0', cover: 'cover.svg', minutes: 1, steps: [{ title: 'One', text: 'Go slowly.' }], ...extra });

describe('bundled meditation sessions', () => {
  it('ships the six requested sessions, all valid', () => {
    expect(catalog.skipped).toEqual([]);
    const by = Object.fromEntries(catalog.meditations.map((s) => [s.manifest.id, s.manifest]));
    expect(Object.keys(by).sort()).toEqual(['cloud_breathing', 'evening_wind_down', 'one_minute_reset', 'quiet_garden', 'rain_pause', 'silent_timer']);
    expect(by.one_minute_reset.minutes).toBe(1);
    expect(by.cloud_breathing.minutes).toBe(3);
    expect(by.quiet_garden.minutes).toBe(5);
    expect(by.evening_wind_down.minutes).toBeGreaterThanOrEqual(5);
    expect(by.evening_wind_down.minutes).toBeLessThanOrEqual(10);
    expect(by.rain_pause.minutes).toBeGreaterThanOrEqual(3);
    expect(by.rain_pause.minutes).toBeLessThanOrEqual(5);
    expect(by.silent_timer.kind).toBe('timer');
    expect(by.silent_timer.durations).toEqual([1, 3, 5, 10, 15, 20]);
    expect(by.rain_pause.ambience).toBe('rain');
  });

  it('every session has a cover file and cues that fit inside its length', async () => {
    const files = await readAllText();
    for (const s of catalog.meditations) {
      expect(`${s.dir}/${s.manifest.cover}` in files, s.manifest.id).toBe(true);
      for (const c of s.manifest.cues) expect(c.at, s.manifest.id).toBeLessThan(s.manifest.minutes * 60);
      if (s.manifest.kind === 'breathing') expect(s.manifest.breath).toBeTruthy();
    }
  });

  it('breathing is slow and gentle: nothing shorter than 2 s in, longer out than in', () => {
    for (const s of catalog.meditations.filter((x) => x.manifest.breath)) {
      const b = s.manifest.breath!;
      expect(b.inhale, s.manifest.id).toBeGreaterThanOrEqual(2);
      expect(b.exhale, s.manifest.id).toBeGreaterThanOrEqual(b.inhale);
      expect(cycleLength(b), s.manifest.id).toBeLessThanOrEqual(20);
    }
  });

  it('never makes medical claims and never gamifies', async () => {
    const files = await readAllText();
    const text = Object.entries(files)
      .filter(([p]) => /^(meditation|movement)\//.test(p) && p.endsWith('.json'))
      .map(([, t]) => t)
      .join('\n');
    expect(text.length).toBeGreaterThan(5000);
    expect(text).not.toMatch(/\b(anxiety|anxious|depress\w*|insomnia|cure[sd]?|therapy|therapeutic|diagnos\w*|disorder|treat(s|ed|ment)?|heal(s|ed|ing)?|medicat\w*|disease|clinical|symptom\w*|panic)\b/i);
    expect(text).not.toMatch(/\b(streak|leaderboard|calorie\w*|burn\w*|weight loss|score|rank|goal weight|fail(ed|ure)?|guilt\w*)\b/i);
  });
});

describe('bundled gentle movement cards', () => {
  it('ships the ten requested cards with steps and a cute picture', async () => {
    const files = await readAllText();
    expect(catalog.movements.map((m) => m.manifest.id).sort()).toEqual(
      ['ankle_circles', 'full_body_reset', 'gentle_back_stretch', 'hand_stretch', 'neck_mobility', 'seated_side_stretch', 'short_desk_break', 'shoulder_rolls', 'standing_reach', 'wrist_break']
    );
    for (const m of catalog.movements) {
      expect(m.manifest.steps.length, m.manifest.id).toBeGreaterThanOrEqual(3);
      expect(`${m.dir}/${m.manifest.cover}` in files, m.manifest.id).toBe(true);
      expect(m.manifest.minutes).toBeGreaterThan(0);
      // careful wording on every card: slow, comfortable, stop if it hurts
      const all = m.manifest.steps.map((s) => s.text).join(' ');
      expect(all, m.manifest.id).toMatch(/comfortable|gentl|slow/i);
    }
    expect(catalog.movements.filter((m) => /stop if anything hurts/i.test(m.manifest.steps.map((s) => s.text).join(' '))).length).toBe(10);
  });

  it('covers are small SVGs with no active content', async () => {
    const files = await readAllText();
    for (const m of catalog.movements) {
      const svg = files[`${m.dir}/${m.manifest.cover}`];
      expect(svg.length).toBeLessThan(40_000);
      expect(svg).not.toMatch(/<script|onload=|href=|<image/i);
    }
  });
});

describe('meditation and movement manifests tolerate mistakes', () => {
  it('accepts a good session and rejects ones that cannot work', () => {
    expect(validateMeditation(med()).ok).toBe(true);
    expect(validateMeditation(med({ kind: 'breathing' })).ok).toBe(false); // needs breath
    expect(validateMeditation(med({ kind: 'breathing', breath: { inhale: 4, exhale: 6 } })).ok).toBe(true);
    expect(validateMeditation(med({ kind: 'timer' })).ok).toBe(false); // needs durations
    expect(validateMeditation(med({ kind: 'timer', durations: [1, 5] })).ok).toBe(true);
    expect(validateMeditation(med({ kind: 'dance' })).ok).toBe(false);
    expect(validateMeditation(med({ minutes: 0 })).ok).toBe(false);
    expect(validateMeditation(med({ id: 'Bad Id' })).ok).toBe(false);
    expect(validateMeditation('nope').ok).toBe(false);
  });

  it('drops malformed optional parts instead of failing', () => {
    const r = validateMeditation(med({ cues: [{ at: 5, text: 'Hello' }, { at: -2, text: 'x' }, { at: 'z', text: 'y' }, { text: 'no time' }, { at: 9, text: '' }, 7], ambience: 'thunder', scene: 'space', accent: 'blue' }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.cues).toEqual([{ at: 5, text: 'Hello' }]);
    expect(r.value.ambience).toBe('none');
    expect(r.value.scene).toBe('cloud');
    expect(r.value.accent).toBeUndefined();
  });

  it('breath values are made gentle even when an author writes extremes', () => {
    const r = validateMeditation(med({ kind: 'breathing', breath: { inhale: 0.2, hold: 99, exhale: 0, rest: -3 } }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.breath!.inhale).toBeGreaterThanOrEqual(2);
      expect(r.value.breath!.exhale).toBeGreaterThanOrEqual(2);
      expect(r.value.breath!.hold).toBeLessThanOrEqual(12);
      expect(r.value.breath!.rest).toBeGreaterThanOrEqual(0);
    }
  });

  it('movement cards need steps and a length', () => {
    expect(validateMovement(mov()).ok).toBe(true);
    expect(validateMovement(mov({ steps: [] })).ok).toBe(false);
    expect(validateMovement(mov({ steps: [{ title: 'x' }] })).ok).toBe(false);
    expect(validateMovement(mov({ minutes: 0 })).ok).toBe(false);
    expect(validateMovement(mov({ steps: Array.from({ length: 13 }, () => ({ title: 'a', text: 'b' })) })).ok).toBe(false);
    const r = validateMovement(mov({ position: 'x'.repeat(100), accent: 'nope' }));
    expect(r.ok && r.value.position!.length).toBe(20);
  });
});

describe('breathing guide', () => {
  const b = { inhale: 4, hold: 2, exhale: 6, rest: 1 };
  it('walks through inhale, hold, exhale and rest, then starts the next breath', () => {
    expect(cycleLength(b)).toBe(13);
    expect(breathAt(0, b)).toMatchObject({ phase: 'inhale', cycle: 0, size: 0 });
    expect(breathAt(2, b).phase).toBe('inhale');
    expect(breathAt(4.5, b)).toMatchObject({ phase: 'hold', size: 1 });
    expect(breathAt(6.5, b).phase).toBe('exhale');
    expect(breathAt(12.5, b)).toMatchObject({ phase: 'rest', size: 0 });
    expect(breathAt(13.2, b)).toMatchObject({ phase: 'inhale', cycle: 1 });
  });
  it('the cloud grows smoothly on the way in and shrinks on the way out', () => {
    let prev = -1;
    for (let t = 0; t <= 4; t += 0.25) {
      const s = breathAt(t, b).size;
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
    expect(breathAt(10, b).size).toBeLessThan(breathAt(6, b).size);
    expect(breathAt(-5, b).size).toBe(0);
  });
  it('skips phases of zero length', () => {
    const simple = { inhale: 4, hold: 0, exhale: 6, rest: 0 };
    expect(breathAt(4.1, simple).phase).toBe('exhale');
    expect(PHASE_WORDS.inhale).toBe('Breathe in');
  });
  it('shows a prompt for a few seconds, then lets it go', () => {
    const cues = [{ at: 0, text: 'Settle in.' }, { at: 20, text: 'Breathe.' }];
    expect(cueAt(2, cues)).toBe('Settle in.');
    expect(cueAt(12, cues)).toBeNull();
    expect(cueAt(21, cues)).toBe('Breathe.');
    expect(cueAt(5, [])).toBeNull();
  });
  it('formats time kindly', () => {
    expect(clock(65)).toBe('1:05');
    expect(clock(0)).toBe('0:00');
    expect(clock(-4)).toBe('0:00');
    expect(clock(59.2)).toBe('1:00');
    expect(minutesLabel(1)).toBe('1 minute');
    expect(minutesLabel(5)).toBe('5 minutes');
  });
});

describe('local progress files', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
    meditationProgress.__reset();
    movementProgress.__reset();
  });
  afterEach(() => setStorage(null));

  it('meditation keeps only the last session, a finished count and favorites (no streaks)', async () => {
    await loadMeditationProgress();
    markStarted('cloud_breathing');
    markFinished('cloud_breathing');
    markFinished('cloud_breathing');
    toggleMeditationFavorite('rain_pause');
    const p = get(meditationProgress);
    expect(p.done.cloud_breathing).toBe(2);
    expect(p.last?.id).toBe('cloud_breathing');
    expect(p.favorites).toEqual(['rain_pause']);
    expect(Object.keys(p).sort()).toEqual(['done', 'favorites', 'last', 'schema']); // nothing else is tracked
    toggleMeditationFavorite('rain_pause');
    expect(get(meditationProgress).favorites).toEqual([]);
  });

  it('saves after a short quiet moment and comes back after a restart', async () => {
    await loadMeditationProgress();
    toggleMeditationFavorite('quiet_garden');
    markFinished('one_minute_reset');
    await meditationProgress.flush();
    const saved = JSON.parse((await mem.readText('progress/meditation.json'))!);
    expect(saved.done.one_minute_reset).toBe(1);
    meditationProgress.__reset();
    await loadMeditationProgress();
    expect(get(meditationProgress).favorites).toEqual(['quiet_garden']);
  });

  it('survives a corrupt file and junk values', async () => {
    await mem.writeText('progress/meditation.json', '{ not json');
    await loadMeditationProgress();
    expect(get(meditationProgress).done).toEqual({});
    const s = sanitizeMeditation({ last: { id: 'Bad Id', at: 5 }, done: { ok_one: 3, 'bad id': 4, neg: -1, text: 'x' }, favorites: ['fine', 3, 'Not Fine'] });
    expect(s.last).toBeNull();
    expect(s.done).toEqual({ ok_one: 3 });
    expect(s.favorites).toEqual(['fine']);
  });

  it('movement remembers favorites and the last card, and nothing about effort', async () => {
    await loadMovementProgress();
    markMovementOpened('shoulder_rolls');
    toggleMovementFavorite('wrist_break');
    await movementProgress.flush();
    expect(Object.keys(get(movementProgress)).sort()).toEqual(['favorites', 'last', 'schema']);
    movementProgress.__reset();
    await loadMovementProgress();
    expect(get(movementProgress).favorites).toEqual(['wrist_break']);
    expect(get(movementProgress).last?.id).toBe('shoulder_rolls');
    expect(sanitizeMovement(42).favorites).toEqual([]);
  });

  it('the shared saver writes once for many quick changes', async () => {
    const calls: string[] = [];
    const w = mem.writeText.bind(mem);
    mem.writeText = async (p, t) => {
      calls.push(p);
      return w(p, t);
    };
    const s = persisted('progress/x.json', () => ({ n: 0 }), (r) => ({ n: typeof (r as { n?: number })?.n === 'number' ? (r as { n: number }).n : 0 }));
    await s.load();
    for (let i = 0; i < 25; i++) s.update((d) => void d.n++);
    expect(calls.length).toBe(0); // nothing is written while still changing
    await s.flush();
    expect(calls).toEqual(['progress/x.json']);
    expect(JSON.parse((await mem.readText('progress/x.json'))!).n).toBe(25);
  });
});

describe('meditation and movement as content packs', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
  });
  afterEach(() => setStorage(null));
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3"/></svg>';

  it('a meditation pack validates and installs', async () => {
    const pack = { format: 1, kind: 'meditation', id: 'extra_calm', name: 'Extra Calm', version: '1.4.0', minAppVersion: '1.4.0', files: {
      'meditation/extra_calm/session.json': { encoding: 'utf8', data: JSON.stringify(med({ id: 'extra_calm' })) },
      'meditation/extra_calm/cover.svg': { encoding: 'utf8', data: svg }
    } };
    const parsed = parsePack(enc(JSON.stringify(pack)));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect((await validatePackContents(parsed.value)).ok).toBe(true);
    expect((await installPack(parsed.value)).ok).toBe(true);
  });

  it('a pack that points at a missing cover is refused', async () => {
    const pack = { format: 1, kind: 'movement', id: 'x_card', name: 'X', version: '1.4.0', minAppVersion: '1.4.0', files: { 'movement/stretch/card.json': { encoding: 'utf8', data: JSON.stringify(mov()) } } };
    const parsed = parsePack(enc(JSON.stringify(pack)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect((await validatePackContents(parsed.value)).ok).toBe(false);
  });
});
