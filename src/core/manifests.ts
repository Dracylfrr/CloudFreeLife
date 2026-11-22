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

export type MiniGameId = 'pastel_breaker' | 'splash_wall' | 'memory_meadow' | (string & {});

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

export type LevelManifest = BreakerLevel | SplashLevel | MemoryLevel | (LevelBase & Record<string, unknown>);

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

/** Generic level validation (any mini-game): checks only the shared fields. */
export function validateLevel(raw: unknown, where = 'level.json'): Result<LevelManifest> {
  if (isObj(raw) && raw.minigame === 'pastel_breaker') return validateBreakerLevel(raw, where);
  if (isObj(raw) && raw.minigame === 'splash_wall') return validateSplashLevel(raw, where);
  if (isObj(raw) && raw.minigame === 'memory_meadow') return validateMemoryLevel(raw, where);
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  return done(e, { ...validateLevelBase(raw, e), ...raw } as LevelManifest);
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
