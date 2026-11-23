/**
 * Manifests added in 1.4: the four new relaxing mini-games, Meditation sessions and Gentle
 * Movement cards. Same rules as every other manifest: plain data, validated before use, and
 * anything optional that is malformed is dropped rather than allowed to break the app.
 */
import { Errs, HEX_RE, ID_RE, done, isObj, reqFile, reqId, reqString, reqVersion, validateLevelBase, type LevelBase, type Result } from './manifests';

// ================================================================ mini-game levels

export const SCENERIES = ['morning', 'garden', 'ocean', 'evening', 'night', 'sunset'] as const;
export type Scenery = (typeof SCENERIES)[number];

const hexList = (v: unknown, min: number, max: number): string[] | null => {
  if (!Array.isArray(v) || v.length < min || v.length > max) return null;
  return v.every((c) => typeof c === 'string' && HEX_RE.test(c)) ? (v as string[]) : null;
};
const numIn = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const sceneryOf = (v: unknown): Scenery => ((SCENERIES as readonly string[]).includes(v as string) ? (v as Scenery) : 'morning');

// ---- Bubble Garden ----
export interface BubbleLevel extends LevelBase {
  minigame: 'bubble_garden';
  /** Bubble colors (3-8). */
  palette: string[];
  /** New bubbles per second. */
  spawn: number;
  /** Upward drift in pixels per second. */
  speed: number;
  /** Smallest and largest bubble radius. */
  size: [number, number];
  sky: [string, string];
  scenery: Scenery;
  /** Color Match: how many requests make a round (a gentle finish). */
  rounds: number;
}

export function validateBubbleLevel(raw: unknown, where = 'level.json'): Result<BubbleLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'bubble_garden') e.add('"minigame" must be "bubble_garden"');
  const palette = hexList(raw.palette, 3, 8);
  if (!palette) e.add('"palette" must list 3-8 #rrggbb colors');
  const sky = hexList(raw.sky, 2, 2);
  if (!sky) e.add('"sky" must be two #rrggbb colors');
  const lo = numIn(Array.isArray(raw.size) ? raw.size[0] : undefined, 14, 90, 26);
  const hi = numIn(Array.isArray(raw.size) ? raw.size[1] : undefined, lo, 120, Math.max(lo, 52));
  return done(e, {
    ...base,
    minigame: 'bubble_garden',
    palette: palette ?? [],
    spawn: numIn(raw.spawn, 0.2, 3, 0.9),
    speed: numIn(raw.speed, 8, 90, 28),
    size: [lo, hi],
    sky: (sky ?? ['#d6ecfb', '#eaf5fd']) as [string, string],
    scenery: sceneryOf(raw.scenery),
    rounds: Math.round(numIn(raw.rounds, 1, 10, 3))
  });
}

// ---- Cloud Catcher ----
export const CATCHER_KINDS = ['cloud', 'star', 'moon', 'drop', 'petal'] as const;
export type CatcherKind = (typeof CATCHER_KINDS)[number];

export interface CatcherZone {
  id: string;
  label: string;
  color: string;
  /** Pattern/shape zones accept only this kind. */
  kind?: CatcherKind;
}
export interface CatcherLevel extends LevelBase {
  minigame: 'cloud_catcher';
  kinds: CatcherKind[];
  colors: string[];
  zones: CatcherZone[];
  spawn: number;
  speed: number;
  sky: [string, string];
  scenery: Scenery;
  /** Pattern mode: the order in which kinds are wanted, repeated. */
  pattern: CatcherKind[];
}

export function validateCatcherLevel(raw: unknown, where = 'level.json'): Result<CatcherLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'cloud_catcher') e.add('"minigame" must be "cloud_catcher"');
  const kindOk = (k: unknown): k is CatcherKind => (CATCHER_KINDS as readonly string[]).includes(k as string);
  const kinds = Array.isArray(raw.kinds) ? [...new Set(raw.kinds.filter(kindOk))] : [];
  if (kinds.length < 1) e.add('"kinds" must list at least one of cloud, star, moon, drop, petal');
  const colors = hexList(raw.colors, 2, 6);
  if (!colors) e.add('"colors" must list 2-6 #rrggbb colors');
  const zones: CatcherZone[] = [];
  if (!Array.isArray(raw.zones) || raw.zones.length < 1 || raw.zones.length > 4) e.add('"zones" must list 1-4 catching zones');
  else {
    const seen = new Set<string>();
    for (const z of raw.zones) {
      if (!isObj(z) || typeof z.id !== 'string' || !ID_RE.test(z.id) || seen.has(z.id) || typeof z.color !== 'string' || !HEX_RE.test(z.color)) {
        e.add(`bad zone ${JSON.stringify(z)}`);
        continue;
      }
      seen.add(z.id);
      zones.push({ id: z.id, label: typeof z.label === 'string' ? z.label.slice(0, 24) : z.id, color: z.color, kind: kindOk(z.kind) ? z.kind : undefined });
    }
  }
  const sky = hexList(raw.sky, 2, 2);
  if (!sky) e.add('"sky" must be two #rrggbb colors');
  const pattern = Array.isArray(raw.pattern) ? raw.pattern.filter(kindOk).slice(0, 6) : [];
  return done(e, {
    ...base,
    minigame: 'cloud_catcher',
    kinds,
    colors: colors ?? [],
    zones,
    spawn: numIn(raw.spawn, 0.2, 2.5, 0.7),
    speed: numIn(raw.speed, 10, 80, 30),
    sky: (sky ?? ['#d6ecfb', '#eaf5fd']) as [string, string],
    scenery: sceneryOf(raw.scenery),
    pattern: pattern.length >= 2 ? pattern : kinds.slice(0, 3)
  });
}

// ---- Zen Garden ----
export const ZEN_SCENERIES = ['sand', 'lavender', 'moon', 'garden', 'sea'] as const;
export type ZenScenery = (typeof ZEN_SCENERIES)[number];

export interface ZenLevel extends LevelBase {
  minigame: 'zen_garden';
  /** Ground gradient, top and bottom. */
  ground: [string, string];
  /** Color of raked grooves. */
  groove: string;
  /** Soft light color for the lines' highlight. */
  light: string;
  scenery: ZenScenery;
}

export function validateZenLevel(raw: unknown, where = 'level.json'): Result<ZenLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'zen_garden') e.add('"minigame" must be "zen_garden"');
  const ground = hexList(raw.ground, 2, 2);
  if (!ground) e.add('"ground" must be two #rrggbb colors');
  const groove = typeof raw.groove === 'string' && HEX_RE.test(raw.groove) ? raw.groove : '#d8c49e';
  const light = typeof raw.light === 'string' && HEX_RE.test(raw.light) ? raw.light : '#fff6df';
  const scenery = (ZEN_SCENERIES as readonly string[]).includes(raw.scenery as string) ? (raw.scenery as ZenScenery) : 'sand';
  return done(e, { ...base, minigame: 'zen_garden', ground: (ground ?? ['#f1e2c0', '#e6d2a6']) as [string, string], groove, light, scenery });
}

// ---- Paint Flow ----
export type Cell = [number, number];
export interface FlowPair {
  color: string;
  a: Cell;
  b: Cell;
}
export interface FlowLevel extends LevelBase {
  minigame: 'paint_flow';
  size: number;
  pairs: FlowPair[];
  /** One path per pair (same order), used by Hint. Optional. */
  solution?: Cell[][];
}

const isCell = (v: unknown, size: number): v is Cell => Array.isArray(v) && v.length === 2 && v.every((n) => Number.isInteger(n) && n >= 0 && n < size);
const adjacent = (p: Cell, q: Cell) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) === 1;

export function validateFlowLevel(raw: unknown, where = 'level.json'): Result<FlowLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'paint_flow') e.add('"minigame" must be "paint_flow"');
  const size = typeof raw.size === 'number' && Number.isInteger(raw.size) ? raw.size : 0;
  if (size < 3 || size > 9) e.add('"size" must be a whole number from 3 to 9');
  const pairs: FlowPair[] = [];
  const used = new Set<string>();
  if (!Array.isArray(raw.pairs) || raw.pairs.length < 2 || raw.pairs.length > 9) e.add('"pairs" must list 2-9 color pairs');
  else {
    for (const p of raw.pairs) {
      if (!isObj(p) || typeof p.color !== 'string' || !HEX_RE.test(p.color) || !isCell(p.a, size) || !isCell(p.b, size)) {
        e.add(`bad pair ${JSON.stringify(p)}`);
        continue;
      }
      const ka = p.a.join(',');
      const kb = p.b.join(',');
      if (ka === kb || used.has(ka) || used.has(kb)) {
        e.add(`pair ${p.color} shares or repeats a cell`);
        continue;
      }
      used.add(ka);
      used.add(kb);
      pairs.push({ color: p.color, a: p.a, b: p.b });
    }
  }
  let solution: Cell[][] | undefined;
  if (Array.isArray(raw.solution)) {
    const paths: Cell[][] = [];
    const seen = new Set<string>();
    let good = raw.solution.length === pairs.length;
    for (const [i, path] of raw.solution.entries()) {
      if (!good) break;
      if (!Array.isArray(path) || path.length < 2 || !path.every((c) => isCell(c, size))) {
        good = false;
        break;
      }
      const cells = path as Cell[];
      const pr = pairs[i];
      const ends = [cells[0].join(','), cells[cells.length - 1].join(',')];
      if (!pr || !ends.includes(pr.a.join(',')) || !ends.includes(pr.b.join(','))) good = false;
      for (let k = 0; k < cells.length && good; k++) {
        if (k > 0 && !adjacent(cells[k - 1], cells[k])) good = false;
        const key = cells[k].join(',');
        if (seen.has(key)) good = false;
        seen.add(key);
      }
      paths.push(cells);
    }
    // A bad hint must never block a board: the board is playable without it.
    if (good) solution = paths;
  }
  return done(e, { ...base, minigame: 'paint_flow', size, pairs, solution });
}

// ================================================================ meditation

export const MEDITATION_KINDS = ['breathing', 'stillness', 'timer'] as const;
export type MeditationKind = (typeof MEDITATION_KINDS)[number];
export const MEDITATION_AMBIENCE = ['none', 'rain', 'hush', 'garden'] as const;
export type MeditationAmbience = (typeof MEDITATION_AMBIENCE)[number];
export const MEDITATION_SCENES = ['cloud', 'garden', 'rain', 'evening', 'dots'] as const;
export type MeditationScene = (typeof MEDITATION_SCENES)[number];

export interface MeditationBreath {
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
}
export interface MeditationCue {
  /** Seconds from the start. */
  at: number;
  text: string;
}
export interface MeditationManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  minAppVersion: string;
  cover: string;
  accent?: string;
  order?: number;
  kind: MeditationKind;
  /** Length in minutes (the Silent Timer lets you choose, see `durations`). */
  minutes: number;
  durations?: number[];
  breath?: MeditationBreath;
  cues: MeditationCue[];
  ambience: MeditationAmbience;
  scene: MeditationScene;
}

export function validateMeditation(raw: unknown, where = 'session.json'): Result<MeditationManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const kind = (MEDITATION_KINDS as readonly string[]).includes(raw.kind as string) ? (raw.kind as MeditationKind) : null;
  if (!kind) e.add('"kind" must be breathing, stillness or timer');
  const minutes = typeof raw.minutes === 'number' && raw.minutes > 0 && raw.minutes <= 60 ? raw.minutes : 0;
  if (!minutes) e.add('"minutes" must be a number from 1 to 60');
  let breath: MeditationBreath | undefined;
  if (isObj(raw.breath)) {
    const b = raw.breath;
    const sec = (v: unknown, d: number) => numIn(v, 0, 12, d);
    breath = { inhale: Math.max(2, sec(b.inhale, 4)), hold: sec(b.hold, 0), exhale: Math.max(2, sec(b.exhale, 6)), rest: sec(b.rest, 0) };
  }
  if (kind === 'breathing' && !breath) e.add('a breathing session needs "breath": {inhale, hold, exhale, rest}');
  const cues: MeditationCue[] = [];
  if (Array.isArray(raw.cues)) {
    for (const c of raw.cues.slice(0, 80)) {
      if (isObj(c) && typeof c.at === 'number' && c.at >= 0 && c.at <= 3600 && typeof c.text === 'string' && c.text.trim() && c.text.length <= 140) cues.push({ at: c.at, text: c.text.trim() });
    }
    cues.sort((a, b) => a.at - b.at);
  }
  const durations = Array.isArray(raw.durations) ? raw.durations.filter((d): d is number => typeof d === 'number' && d >= 1 && d <= 60).slice(0, 8) : undefined;
  if (kind === 'timer' && (!durations || durations.length === 0)) e.add('a timer session needs "durations": [1, 3, 5, ...]');
  return done(e, {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 60),
    description: reqString(raw, 'description', e, 300),
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    cover: reqFile(raw, 'cover', e),
    accent: typeof raw.accent === 'string' && HEX_RE.test(raw.accent) ? raw.accent : undefined,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : undefined,
    kind: kind ?? 'stillness',
    minutes,
    durations,
    breath,
    cues,
    ambience: (MEDITATION_AMBIENCE as readonly string[]).includes(raw.ambience as string) ? (raw.ambience as MeditationAmbience) : 'none',
    scene: (MEDITATION_SCENES as readonly string[]).includes(raw.scene as string) ? (raw.scene as MeditationScene) : 'cloud'
  });
}

// ================================================================ gentle movement

export interface MovementStep {
  title: string;
  text: string;
}
export interface MovementManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  minAppVersion: string;
  /** Illustration file (SVG or WebP) in the card folder. */
  cover: string;
  accent?: string;
  order?: number;
  /** Rough length in minutes, for the optional timer. */
  minutes: number;
  /** "Seated", "Standing"... shown as a small tag. */
  position?: string;
  steps: MovementStep[];
}

export function validateMovement(raw: unknown, where = 'card.json'): Result<MovementManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const steps: MovementStep[] = [];
  if (!Array.isArray(raw.steps) || raw.steps.length < 1 || raw.steps.length > 12) e.add('"steps" must list 1-12 steps');
  else {
    for (const [i, s] of raw.steps.entries()) {
      if (!isObj(s) || typeof s.title !== 'string' || !s.title.trim() || typeof s.text !== 'string' || !s.text.trim() || s.text.length > 400) e.add(`step ${i + 1} needs a "title" and short "text"`);
      else steps.push({ title: s.title.trim().slice(0, 60), text: s.text.trim() });
    }
  }
  const minutes = typeof raw.minutes === 'number' && raw.minutes > 0 && raw.minutes <= 30 ? raw.minutes : 0;
  if (!minutes) e.add('"minutes" must be a number from 1 to 30');
  return done(e, {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 60),
    description: reqString(raw, 'description', e, 300),
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    cover: reqFile(raw, 'cover', e),
    accent: typeof raw.accent === 'string' && HEX_RE.test(raw.accent) ? raw.accent : undefined,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : undefined,
    minutes,
    position: typeof raw.position === 'string' ? raw.position.slice(0, 20) : undefined,
    steps
  });
}
