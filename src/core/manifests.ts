/**
 * Types and validators for every content manifest.
 * Content is data: books, pages, palettes and mini-game levels are described
 * by JSON files and validated here before the app ever uses them.
 */
import { APP_VERSION, isValidVersion, meetsMinVersion } from './version';

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const ID_RE = /^[a-z0-9][a-z0-9_]{0,63}$/;
const FOLDER_RE = /^[a-z0-9][a-z0-9_]{0,63}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}$/;

export interface BackgroundDef {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'stars' | 'clouds';
  colors: string[];
}

export interface BookManifest {
  id: string;
  name: string;
  description: string;
  cover: string;
  version: string;
  minAppVersion: string;
  kind: 'coloring' | 'free_canvas';
  /** Page folder names, in display order (empty for free canvas). */
  pages: string[];
  backgrounds?: BackgroundDef[];
  accent?: string;
  /** Position on the shelf (lower first). Books without one are sorted by name after the ordered ones. */
  order?: number;
}

export interface PageManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  minAppVersion: string;
  thumbnail: string;
  lineArt: string;
  regions: string;
  difficulty?: 'easy' | 'relaxed' | 'detailed';
}

export interface RegionInfo {
  id: string;
  name: string;
  suggested?: string;
}
export interface RegionsFile {
  viewBox: [number, number];
  regions: RegionInfo[];
}

export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
}
export interface PaletteManifest {
  id: string;
  name: string;
  description?: string;
  version: string;
  minAppVersion: string;
  colors: PaletteColor[];
}

export type MiniGameId = 'pastel_breaker' | 'splash_wall' | 'memory_meadow' | 'pastel_puzzle' | (string & {});

/** Card pictures Memory Meadow can draw. A level may only use these. */
export const MEMORY_ICON_IDS = ['cloud', 'star', 'moon', 'sun', 'heart', 'drop', 'flower', 'leaf', 'balloon', 'shell', 'rainbow', 'mushroom', 'fish', 'butterfly', 'planet'] as const;

export interface LevelBase {
  id: string;
  name: string;
  description: string;
  minigame: MiniGameId;
  thumbnail: string;
  version: string;
  minAppVersion: string;
  objective: string;
}

export interface BreakerLevel extends LevelBase {
  minigame: 'pastel_breaker';
  /** Rows of single-character block codes. "." or " " means empty. */
  grid: string[];
  /** Maps a block code to a palette color name/hex. */
  legend: Record<string, string>;
  /** Block codes that need two hits. */
  tough?: string[];
}

export type SplashObjective =
  | { type: 'free' }
  | { type: 'coverage'; target: number }
  | { type: 'regions'; regions: string[] }
  | { type: 'color_match'; targets: Record<string, string> };

export interface SplashLevel extends LevelBase {
  minigame: 'splash_wall';
  wall: string;
  goal: SplashObjective;
  /** Suggested balloon colors for this level. */
  colors?: string[];
}

export interface MemoryLevel extends LevelBase {
  minigame: 'memory_meadow';
  /** Cards per row. Total cards = symbols x 2 and must divide evenly. */
  columns: number;
  cardBack: string;
  symbols: string[];
}

export interface PuzzleLevel extends LevelBase {
  minigame: 'pastel_puzzle';
  /** Picture file in the level folder (SVG or PNG). It is cut into columns x rows tiles. */
  picture: string;
  columns: number;
  rows: number;
}

export type LevelManifest = BreakerLevel | SplashLevel | MemoryLevel | PuzzleLevel | (LevelBase & Record<string, unknown>);

// ---------------------------------------------------------------- helpers

class Errs {
  list: string[] = [];
  constructor(private where: string) {}
  add(msg: string) {
    this.list.push(`${this.where}: ${msg}`);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function reqString(o: Record<string, unknown>, key: string, e: Errs, max = 400): string {
  const v = o[key];
  if (typeof v !== 'string' || v.trim() === '') {
    e.add(`"${key}" must be a non-empty string`);
    return '';
  }
  if (v.length > max) e.add(`"${key}" is too long`);
  return v;
}

function reqVersion(o: Record<string, unknown>, key: string, e: Errs): string {
  const v = reqString(o, key, e, 40);
  if (v && !isValidVersion(v)) e.add(`"${key}" must look like 1.2.3 (got "${v}")`);
  return v;
}

function reqFile(o: Record<string, unknown>, key: string, e: Errs): string {
  const v = reqString(o, key, e, 90);
  if (v && !FILE_RE.test(v)) e.add(`"${key}" must be a plain file name (got "${v}")`);
  return v;
}

function reqId(o: Record<string, unknown>, key: string, e: Errs): string {
  const v = reqString(o, key, e, 64);
  if (v && !ID_RE.test(v)) e.add(`"${key}" must be lowercase letters, digits and underscores (got "${v}")`);
  return v;
}

function done<T>(e: Errs, value: T): Result<T> {
  return e.list.length ? { ok: false, errors: e.list } : { ok: true, value };
}

// ---------------------------------------------------------------- books

export function validateBook(raw: unknown, where = 'book_manifest.json'): Result<BookManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const kind = raw.kind === 'free_canvas' ? 'free_canvas' : 'coloring';
  if (raw.kind !== undefined && raw.kind !== 'coloring' && raw.kind !== 'free_canvas') e.add('"kind" must be "coloring" or "free_canvas"');
  const book: BookManifest = {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 60),
    description: reqString(raw, 'description', e, 300),
    cover: reqFile(raw, 'cover', e),
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    kind,
    pages: [],
    accent: typeof raw.accent === 'string' && HEX_RE.test(raw.accent) ? raw.accent : undefined,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : undefined
  };
  if (!Array.isArray(raw.pages)) {
    e.add('"pages" must be an array of page folder names');
  } else {
    const seen = new Set<string>();
    for (const p of raw.pages) {
      if (typeof p !== 'string' || !FOLDER_RE.test(p)) e.add(`invalid page folder name: ${JSON.stringify(p)}`);
      else if (seen.has(p)) e.add(`duplicate page "${p}"`);
      else {
        seen.add(p);
        book.pages.push(p);
      }
    }
    if (kind === 'coloring' && raw.pages.length === 0) e.add('a coloring book needs at least one page');
  }
  if (kind === 'free_canvas') {
    if (!Array.isArray(raw.backgrounds) || raw.backgrounds.length === 0) e.add('a free canvas book needs "backgrounds"');
    else {
      book.backgrounds = [];
      for (const b of raw.backgrounds) {
        if (!isObj(b)) {
          e.add('background entries must be objects');
          continue;
        }
        const be = new Errs(`${where} background`);
        const id = reqId(b, 'id', be);
        const name = reqString(b, 'name', be, 40);
        const type = b.type;
        if (type !== 'solid' && type !== 'gradient' && type !== 'stars' && type !== 'clouds') be.add('"type" must be solid, gradient, stars or clouds');
        const colors = Array.isArray(b.colors) ? b.colors.filter((c): c is string => typeof c === 'string' && HEX_RE.test(c)) : [];
        if (colors.length === 0) be.add('"colors" needs at least one #rrggbb color');
        e.list.push(...be.list);
        if (!be.list.length) book.backgrounds.push({ id, name, type: type as BackgroundDef['type'], colors });
      }
    }
  }
  return done(e, book);
}

// ---------------------------------------------------------------- pages

export function validatePage(raw: unknown, where = 'page_manifest.json'): Result<PageManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const diff = raw.difficulty;
  if (diff !== undefined && diff !== 'easy' && diff !== 'relaxed' && diff !== 'detailed') e.add('"difficulty" must be easy, relaxed or detailed');
  const page: PageManifest = {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 60),
    description: reqString(raw, 'description', e, 300),
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    thumbnail: reqFile(raw, 'thumbnail', e),
    lineArt: reqFile(raw, 'lineArt', e),
    regions: reqFile(raw, 'regions', e),
    difficulty: diff as PageManifest['difficulty']
  };
  return done(e, page);
}

export function validateRegions(raw: unknown, where = 'regions.json'): Result<RegionsFile> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const vb = raw.viewBox;
  if (!Array.isArray(vb) || vb.length !== 2 || !vb.every((n) => typeof n === 'number' && n > 0)) e.add('"viewBox" must be [width, height]');
  const regions: RegionInfo[] = [];
  if (!Array.isArray(raw.regions) || raw.regions.length === 0) e.add('"regions" must list at least one region');
  else {
    const seen = new Set<string>();
    for (const r of raw.regions) {
      if (!isObj(r) || typeof r.id !== 'string' || !ID_RE.test(r.id)) {
        e.add(`invalid region entry ${JSON.stringify(r)}`);
        continue;
      }
      if (seen.has(r.id)) e.add(`duplicate region "${r.id}"`);
      seen.add(r.id);
      regions.push({
        id: r.id,
        name: typeof r.name === 'string' ? r.name : r.id,
        suggested: typeof r.suggested === 'string' && HEX_RE.test(r.suggested) ? r.suggested : undefined
      });
    }
    if (regions.length > 4000) e.add('too many regions');
  }
  return done(e, { viewBox: vb as [number, number], regions });
}

// ---------------------------------------------------------------- palettes

export function validatePalette(raw: unknown, where = 'palette.json'): Result<PaletteManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const pal: PaletteManifest = {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 40),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    colors: []
  };
  if (!Array.isArray(raw.colors) || raw.colors.length < 4) e.add('"colors" needs at least 4 colors');
  else {
    const seen = new Set<string>();
    for (const c of raw.colors) {
      if (!isObj(c) || typeof c.name !== 'string' || typeof c.hex !== 'string' || !HEX_RE.test(c.hex)) {
        e.add(`invalid color ${JSON.stringify(c)}`);
        continue;
      }
      const id = typeof c.id === 'string' && ID_RE.test(c.id) ? c.id : c.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (seen.has(id)) e.add(`duplicate color id "${id}"`);
      seen.add(id);
      pal.colors.push({ id, name: c.name, hex: c.hex.toLowerCase() });
    }
  }
  return done(e, pal);
}

// ---------------------------------------------------------------- levels

function validateLevelBase(raw: Record<string, unknown>, e: Errs): LevelBase {
  return {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 60),
    description: reqString(raw, 'description', e, 300),
    minigame: reqString(raw, 'minigame', e, 40),
    thumbnail: reqFile(raw, 'thumbnail', e),
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    objective: reqString(raw, 'objective', e, 200)
  };
}

export function validateBreakerLevel(raw: unknown, where = 'level.json'): Result<BreakerLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'pastel_breaker') e.add('"minigame" must be "pastel_breaker"');
  const grid: string[] = [];
  if (!Array.isArray(raw.grid) || raw.grid.length === 0 || raw.grid.length > 16) e.add('"grid" must have 1-16 rows');
  else {
    const width = typeof raw.grid[0] === 'string' ? raw.grid[0].length : 0;
    for (const row of raw.grid) {
      if (typeof row !== 'string' || row.length !== width) e.add('every grid row must be a string of the same width');
      else grid.push(row);
    }
    if (width < 3 || width > 20) e.add('grid width must be 3-20 columns');
  }
  const legend: Record<string, string> = {};
  if (!isObj(raw.legend)) e.add('"legend" must map block characters to colors');
  else {
    for (const [k, v] of Object.entries(raw.legend)) {
      if (k.length !== 1 || typeof v !== 'string') e.add(`bad legend entry "${k}"`);
      else legend[k] = v;
    }
    for (const row of grid) {
      for (const ch of row) {
        if (ch !== '.' && ch !== ' ' && !(ch in legend)) e.add(`grid uses "${ch}" which is missing from "legend"`);
      }
    }
  }
  const tough = Array.isArray(raw.tough) ? raw.tough.filter((x): x is string => typeof x === 'string' && x.length === 1) : undefined;
  return done(e, { ...base, minigame: 'pastel_breaker', grid, legend, tough });
}

export function validateSplashLevel(raw: unknown, where = 'level.json'): Result<SplashLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'splash_wall') e.add('"minigame" must be "splash_wall"');
  const wall = reqFile(raw, 'wall', e);
  let goal: SplashObjective = { type: 'free' };
  const g = raw.goal;
  if (!isObj(g)) e.add('"goal" must be an object like {"type":"free"}');
  else if (g.type === 'free') goal = { type: 'free' };
  else if (g.type === 'coverage') {
    if (typeof g.target !== 'number' || g.target <= 0 || g.target > 1) e.add('coverage "target" must be between 0 and 1');
    else goal = { type: 'coverage', target: g.target };
  } else if (g.type === 'regions') {
    if (!Array.isArray(g.regions) || g.regions.length === 0 || !g.regions.every((r) => typeof r === 'string' && ID_RE.test(r))) e.add('regions goal needs a list of region ids');
    else goal = { type: 'regions', regions: g.regions as string[] };
  } else if (g.type === 'color_match') {
    const targets: Record<string, string> = {};
    if (!isObj(g.targets) || Object.keys(g.targets).length === 0) e.add('color_match goal needs "targets": {region: color}');
    else {
      for (const [k, v] of Object.entries(g.targets)) {
        if (!ID_RE.test(k) || typeof v !== 'string' || !HEX_RE.test(v)) e.add(`bad color_match target "${k}"`);
        else targets[k] = v;
      }
      goal = { type: 'color_match', targets };
    }
  } else e.add('unknown goal type');
  const colors = Array.isArray(raw.colors) ? raw.colors.filter((c): c is string => typeof c === 'string' && HEX_RE.test(c)) : undefined;
  return done(e, { ...base, minigame: 'splash_wall', wall, goal, colors });
}

export function validateMemoryLevel(raw: unknown, where = 'level.json'): Result<MemoryLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'memory_meadow') e.add('"minigame" must be "memory_meadow"');
  const symbols: string[] = [];
  if (!Array.isArray(raw.symbols) || raw.symbols.length < 2 || raw.symbols.length > 12) e.add('"symbols" must list 2-12 card pictures');
  else {
    const seen = new Set<string>();
    for (const s of raw.symbols) {
      if (typeof s !== 'string' || !(MEMORY_ICON_IDS as readonly string[]).includes(s)) e.add(`unknown card picture ${JSON.stringify(s)}`);
      else if (seen.has(s)) e.add(`duplicate card picture "${s}"`);
      else {
        seen.add(s);
        symbols.push(s);
      }
    }
  }
  const columns = typeof raw.columns === 'number' && Number.isInteger(raw.columns) ? raw.columns : 0;
  if (columns < 2 || columns > 6) e.add('"columns" must be a whole number from 2 to 6');
  else if (symbols.length && (symbols.length * 2) % columns !== 0) e.add(`${symbols.length * 2} cards do not fill rows of ${columns}`);
  const cardBack = typeof raw.cardBack === 'string' && HEX_RE.test(raw.cardBack) ? raw.cardBack : '#bfe4f7';
  return done(e, { ...base, minigame: 'memory_meadow', columns, cardBack, symbols });
}

export function validatePuzzleLevel(raw: unknown, where = 'level.json'): Result<PuzzleLevel> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const base = validateLevelBase(raw, e);
  if (base.minigame && base.minigame !== 'pastel_puzzle') e.add('"minigame" must be "pastel_puzzle"');
  const picture = reqFile(raw, 'picture', e);
  const columns = typeof raw.columns === 'number' && Number.isInteger(raw.columns) ? raw.columns : 0;
  const rows = typeof raw.rows === 'number' && Number.isInteger(raw.rows) ? raw.rows : 0;
  if (columns < 2 || columns > 8) e.add('"columns" must be a whole number from 2 to 8');
  if (rows < 2 || rows > 8) e.add('"rows" must be a whole number from 2 to 8');
  return done(e, { ...base, minigame: 'pastel_puzzle', picture, columns, rows });
}

/** Generic level validation (any mini-game): checks only the shared fields. */
export function validateLevel(raw: unknown, where = 'level.json'): Result<LevelManifest> {
  if (isObj(raw) && raw.minigame === 'pastel_breaker') return validateBreakerLevel(raw, where);
  if (isObj(raw) && raw.minigame === 'splash_wall') return validateSplashLevel(raw, where);
  if (isObj(raw) && raw.minigame === 'memory_meadow') return validateMemoryLevel(raw, where);
  if (isObj(raw) && raw.minigame === 'pastel_puzzle') return validatePuzzleLevel(raw, where);
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  return done(e, { ...validateLevelBase(raw, e), ...raw } as LevelManifest);
}

// ---------------------------------------------------------------- stories

/** Optional picture shown with a story, chapter or scene. All three fields are optional. */
export interface Illustration {
  /** Plain file name next to story.json (.svg, .webp or .png). */
  illustration: string;
  /** Description for screen readers. */
  illustrationAlt?: string;
  /** Short caption shown under the picture. */
  illustrationCaption?: string;
}

/** A picture placed between paragraphs of a long chapter. */
export interface StoryScene extends Illustration {
  /** Shown after this paragraph (1 = after the first paragraph). */
  after: number;
}

export interface StoryChapter extends Partial<Illustration> {
  title: string;
  /** Paragraphs, in reading order. */
  text: string[];
  /** Optional pictures between sections of a long chapter (3 at most). */
  scenes?: StoryScene[];
}

export interface StoryManifest extends Partial<Illustration> {
  id: string;
  name: string;
  description: string;
  cover: string;
  version: string;
  minAppVersion: string;
  accent?: string;
  /** One or two words shown on the card, e.g. "Bedtime" or "Cozy". */
  mood?: string;
  /** Rough reading time. */
  minutes?: number;
  order?: number;
  chapters: StoryChapter[];
}

export const ENDING_MOODS = ['happy', 'sweet', 'funny', 'dreamy', 'cozy'] as const;
export type EndingMood = (typeof ENDING_MOODS)[number];

export interface AdventureChoice {
  text: string;
  to: string;
}
export interface AdventureNode {
  text: string[];
  choices?: AdventureChoice[];
  ending?: { title: string; mood: EndingMood };
}
export type Protagonist = 'guy' | 'girl';

export interface AdventureManifest {
  id: string;
  name: string;
  description: string;
  cover: string;
  version: string;
  minAppVersion: string;
  accent?: string;
  /** e.g. Adventure, Romance, Comedy, Mystery. */
  genre: string;
  /** Whose eyes the story is told through. */
  protagonist: Protagonist;
  /** Name of the love interest in a romance (always the opposite of the protagonist for now). */
  interest?: string;
  /** The narrator's name. */
  hero?: string;
  minutes?: number;
  order?: number;
  start: string;
  nodes: Record<string, AdventureNode>;
}

const NODE_ID_RE = /^[a-z0-9][a-z0-9_]{0,47}$/;
export const MIN_ENDINGS = 3;

export const ILLUSTRATION_EXTS = ['.svg', '.webp', '.png'];
const ILLUSTRATION_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,80}\.(svg|webp|png)$/i;

/**
 * Reads the optional illustration fields. A malformed value is ignored rather than rejected:
 * a story must always stay readable, with or without its pictures.
 */
export function readIllustration(o: Record<string, unknown>): Partial<Illustration> {
  const file = o.illustration;
  if (typeof file !== 'string' || !ILLUSTRATION_RE.test(file)) return {};
  const out: Partial<Illustration> = { illustration: file };
  if (typeof o.illustrationAlt === 'string' && o.illustrationAlt.trim()) out.illustrationAlt = o.illustrationAlt.trim().slice(0, 300);
  if (typeof o.illustrationCaption === 'string' && o.illustrationCaption.trim()) out.illustrationCaption = o.illustrationCaption.trim().slice(0, 160);
  return out;
}

/** Every picture file a story refers to (cover excluded). */
export function storyIllustrationFiles(m: StoryManifest): string[] {
  const out: string[] = [];
  if (m.illustration) out.push(m.illustration);
  for (const c of m.chapters) {
    if (c.illustration) out.push(c.illustration);
    for (const sc of c.scenes ?? []) out.push(sc.illustration);
  }
  return [...new Set(out)];
}

/** Whole words in a story's text, for a reading-time estimate. */
export function storyWordCount(m: StoryManifest): number {
  let n = 0;
  for (const c of m.chapters) for (const p of c.text) n += p.split(/\s+/).filter(Boolean).length;
  return n;
}

/** Minutes to read: the author's value, else about 190 words per minute. */
export function storyMinutes(m: StoryManifest): number {
  return m.minutes ?? Math.max(1, Math.round(storyWordCount(m) / 190));
}

function textList(v: unknown, e: Errs, label: string): string[] {
  if (!Array.isArray(v) || v.length === 0) {
    e.add(`${label}: "text" must be a list of paragraphs`);
    return [];
  }
  const out: string[] = [];
  for (const t of v) {
    if (typeof t !== 'string' || t.trim() === '') e.add(`${label}: paragraphs must be non-empty text`);
    else if (t.length > 3000) e.add(`${label}: a paragraph is too long`);
    else out.push(t);
  }
  return out;
}

export function validateStory(raw: unknown, where = 'story.json'): Result<StoryManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const story: StoryManifest = {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 80),
    description: reqString(raw, 'description', e, 300),
    cover: reqFile(raw, 'cover', e),
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    accent: typeof raw.accent === 'string' && HEX_RE.test(raw.accent) ? raw.accent : undefined,
    mood: typeof raw.mood === 'string' && raw.mood.length <= 24 ? raw.mood : undefined,
    minutes: typeof raw.minutes === 'number' && raw.minutes > 0 && raw.minutes < 600 ? Math.round(raw.minutes) : undefined,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : undefined,
    ...readIllustration(raw),
    chapters: []
  };
  if (!Array.isArray(raw.chapters) || raw.chapters.length === 0) e.add('"chapters" must be a non-empty list');
  else if (raw.chapters.length > 120) e.add('too many chapters (120 at most)');
  else {
    for (const [i, c] of raw.chapters.entries()) {
      if (!isObj(c)) {
        e.add(`chapter ${i + 1} must be an object`);
        continue;
      }
      const title = reqString(c, 'title', e, 80);
      const text = textList(c.text, e, `chapter ${i + 1}`);
      const chapter: StoryChapter = { title, text, ...readIllustration(c) };
      if (Array.isArray(c.scenes)) {
        const scenes: StoryScene[] = [];
        for (const sc of c.scenes.slice(0, 3)) {
          if (!isObj(sc)) continue;
          const ill = readIllustration(sc);
          const after = typeof sc.after === 'number' && Number.isInteger(sc.after) ? sc.after : 0;
          if (ill.illustration && after >= 1 && after < text.length) scenes.push({ after, ...(ill as Illustration) });
        }
        if (scenes.length) chapter.scenes = scenes.sort((a, b) => a.after - b.after);
      }
      story.chapters.push(chapter);
    }
  }
  return done(e, story);
}

export function validateAdventure(raw: unknown, where = 'adventure.json'): Result<AdventureManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  if (raw.protagonist !== 'guy' && raw.protagonist !== 'girl') e.add('"protagonist" must be "guy" or "girl"');
  const adv: AdventureManifest = {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 80),
    description: reqString(raw, 'description', e, 300),
    cover: reqFile(raw, 'cover', e),
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    accent: typeof raw.accent === 'string' && HEX_RE.test(raw.accent) ? raw.accent : undefined,
    genre: reqString(raw, 'genre', e, 24),
    protagonist: raw.protagonist === 'girl' ? 'girl' : 'guy',
    interest: typeof raw.interest === 'string' && raw.interest.length <= 40 ? raw.interest : undefined,
    hero: typeof raw.hero === 'string' && raw.hero.length <= 40 ? raw.hero : undefined,
    minutes: typeof raw.minutes === 'number' && raw.minutes > 0 && raw.minutes < 600 ? Math.round(raw.minutes) : undefined,
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : undefined,
    start: reqString(raw, 'start', e, 48),
    nodes: {}
  };
  if (!isObj(raw.nodes) || Object.keys(raw.nodes).length === 0) {
    e.add('"nodes" must be an object of story passages');
    return done(e, adv);
  }
  const rawNodes = raw.nodes;
  const ids = Object.keys(rawNodes);
  if (ids.length > 400) e.add('too many passages (400 at most)');
  for (const id of ids) {
    const n = rawNodes[id];
    const label = `passage "${id}"`;
    if (!NODE_ID_RE.test(id)) {
      e.add(`${label}: ids use lowercase letters, digits and underscores`);
      continue;
    }
    if (!isObj(n)) {
      e.add(`${label} must be an object`);
      continue;
    }
    const node: AdventureNode = { text: textList(n.text, e, label) };
    const hasChoices = n.choices !== undefined;
    const hasEnding = n.ending !== undefined;
    if (hasChoices === hasEnding) e.add(`${label}: needs either "choices" or "ending" (not both, not neither)`);
    if (hasChoices) {
      if (!Array.isArray(n.choices) || n.choices.length < 1 || n.choices.length > 4) e.add(`${label}: "choices" must list 1 to 4 options`);
      else {
        node.choices = [];
        for (const c of n.choices) {
          if (!isObj(c) || typeof c.text !== 'string' || c.text.trim() === '' || c.text.length > 160 || typeof c.to !== 'string') {
            e.add(`${label}: every choice needs "text" and "to"`);
            continue;
          }
          if (!(c.to in rawNodes)) e.add(`${label}: choice leads to "${c.to}", which does not exist`);
          node.choices.push({ text: c.text, to: c.to });
        }
      }
    }
    if (hasEnding) {
      const en = n.ending;
      if (!isObj(en) || typeof en.title !== 'string' || en.title.trim() === '' || en.title.length > 60) e.add(`${label}: "ending" needs a "title"`);
      else {
        if (en.mood !== undefined && !ENDING_MOODS.includes(en.mood as EndingMood)) e.add(`${label}: ending "mood" must be one of ${ENDING_MOODS.join(', ')}`);
        node.ending = { title: en.title, mood: ENDING_MOODS.includes(en.mood as EndingMood) ? (en.mood as EndingMood) : 'happy' };
      }
    }
    adv.nodes[id] = node;
  }
  if (e.list.length) return done(e, adv);
  if (!(adv.start in adv.nodes)) e.add(`"start" points to "${adv.start}", which does not exist`);
  else {
    const g = analyzeAdventure(adv);
    if (g.endings < MIN_ENDINGS) e.add(`needs at least ${MIN_ENDINGS} different endings (has ${g.endings})`);
    if (g.unreachable.length) e.add(`passages that can never be reached: ${g.unreachable.slice(0, 5).join(', ')}`);
    if (g.stuck.length) e.add(`passages from which no ending can be reached: ${g.stuck.slice(0, 5).join(', ')}`);
  }
  return done(e, adv);
}

export interface AdventureGraphInfo {
  endings: number;
  unreachable: string[];
  stuck: string[];
}

/** Structural facts about an adventure: ending count, dead passages and passages that trap the reader. */
export function analyzeAdventure(adv: Pick<AdventureManifest, 'start' | 'nodes'>): AdventureGraphInfo {
  const ids = Object.keys(adv.nodes);
  const seen = new Set<string>();
  const stack = [adv.start];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || !(id in adv.nodes)) continue;
    seen.add(id);
    for (const c of adv.nodes[id].choices ?? []) stack.push(c.to);
  }
  // Which passages can reach an ending? Iterate to a fixed point.
  const canEnd = new Set(ids.filter((id) => adv.nodes[id].ending));
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of ids) {
      if (canEnd.has(id)) continue;
      if ((adv.nodes[id].choices ?? []).some((c) => canEnd.has(c.to))) {
        canEnd.add(id);
        grew = true;
      }
    }
  }
  return {
    endings: ids.filter((id) => adv.nodes[id].ending).length,
    unreachable: ids.filter((id) => !seen.has(id)),
    stuck: ids.filter((id) => seen.has(id) && !canEnd.has(id))
  };
}

// ---------------------------------------------------------------- compatibility

export interface Compat {
  ok: boolean;
  reason?: string;
}

/** Content whose minAppVersion is newer than this app is kept but not shown. */
export function checkCompatibility(item: { minAppVersion: string }, appVersion: string = APP_VERSION): Compat {
  if (!isValidVersion(item.minAppVersion)) return { ok: false, reason: 'Invalid minimum app version' };
  if (!meetsMinVersion(item.minAppVersion, appVersion)) {
    return { ok: false, reason: `Requires Cloud-Freelife ${item.minAppVersion} or newer` };
  }
  return { ok: true };
}
