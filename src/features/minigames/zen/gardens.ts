/**
 * Zen Garden data and saving. A garden is raked lines plus a few placed things (stones, plants,
 * flowers, bushes). It is saved automatically, a little after you stop changing it, as one small
 * JSON file per garden in the data folder (`gardens/<id>.json`). Sizes are capped so a garden can
 * never grow without limit.
 */
import { getStorage } from '../../../core/storage';

export const GARDEN_ROOT = 'gardens';
export const FIELD_W = 900;
export const FIELD_H = 580;
export const MAX_STROKES = 260;
export const MAX_POINTS = 420;
export const MAX_OBJECTS = 120;
export const MAX_GARDENS = 60;

export type ZenKind = 'stone' | 'plant' | 'flower' | 'bush';
export const ZEN_KINDS: ZenKind[] = ['stone', 'plant', 'flower', 'bush'];

export interface Stroke {
  /** Flat x,y,x,y... in garden units, rounded to whole numbers. */
  pts: number[];
}
export interface ZenObject {
  id: number;
  kind: ZenKind;
  x: number;
  y: number;
  /** 0.6 - 1.8 */
  size: number;
  /** 0 - 3: which look of that kind. */
  variant: number;
  /** Radians. */
  rot: number;
}
export interface Garden {
  schema: 1;
  id: string;
  name: string;
  /** Which Zen Garden background (level id). */
  levelId: string;
  createdAt: number;
  updatedAt: number;
  strokes: Stroke[];
  objects: ZenObject[];
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;
const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

export function newGardenId(): string {
  return `garden-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function emptyGarden(levelId: string, name = 'My garden'): Garden {
  const now = Date.now();
  return { schema: 1, id: newGardenId(), name, levelId, createdAt: now, updatedAt: now, strokes: [], objects: [] };
}

/** Accepts anything, returns a valid, size-limited garden (or null when it is not a garden at all). */
export function sanitizeGarden(raw: unknown, folderId?: string): Garden | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' && ID_RE.test(r.id) ? r.id : null;
  if (!id || (folderId && id !== folderId)) return null;
  const strokes: Stroke[] = [];
  if (Array.isArray(r.strokes)) {
    for (const s of r.strokes.slice(-MAX_STROKES)) {
      const pts = s && typeof s === 'object' ? (s as Record<string, unknown>).pts : null;
      if (!Array.isArray(pts) || pts.length < 4) continue;
      const clean: number[] = [];
      for (let i = 0; i + 1 < pts.length && clean.length < MAX_POINTS * 2; i += 2) {
        const x = pts[i];
        const y = pts[i + 1];
        if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) clean.push(Math.round(num(x, 0, FIELD_W, 0)), Math.round(num(y, 0, FIELD_H, 0)));
      }
      if (clean.length >= 4) strokes.push({ pts: clean });
    }
  }
  const objects: ZenObject[] = [];
  if (Array.isArray(r.objects)) {
    let nextId = 1;
    for (const o of r.objects.slice(0, MAX_OBJECTS)) {
      if (!o || typeof o !== 'object') continue;
      const q = o as Record<string, unknown>;
      if (!ZEN_KINDS.includes(q.kind as ZenKind)) continue;
      objects.push({
        id: nextId++,
        kind: q.kind as ZenKind,
        x: num(q.x, 0, FIELD_W, FIELD_W / 2),
        y: num(q.y, 0, FIELD_H, FIELD_H / 2),
        size: num(q.size, 0.6, 1.8, 1),
        variant: Math.round(num(q.variant, 0, 3, 0)),
        rot: num(q.rot, -7, 7, 0)
      });
    }
  }
  const now = Date.now();
  return {
    schema: 1,
    id,
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 40) : 'My garden',
    levelId: typeof r.levelId === 'string' && /^[a-z0-9_]{1,64}$/.test(r.levelId) ? r.levelId : 'warm_sand',
    createdAt: num(r.createdAt, 0, Number.MAX_SAFE_INTEGER, now),
    updatedAt: num(r.updatedAt, 0, Number.MAX_SAFE_INTEGER, now),
    strokes,
    objects
  };
}

const pathOf = (id: string) => `${GARDEN_ROOT}/${id}.json`;

export async function saveGarden(g: Garden): Promise<void> {
  const st = await getStorage();
  g.updatedAt = Date.now();
  await st.writeText(pathOf(g.id), JSON.stringify(g));
}

export async function loadGarden(id: string): Promise<Garden | null> {
  if (!ID_RE.test(id)) return null;
  try {
    const st = await getStorage();
    const text = await st.readText(pathOf(id));
    return text ? sanitizeGarden(JSON.parse(text), id) : null;
  } catch {
    return null;
  }
}

/** Every saved garden, most recently changed first. Damaged files are skipped, never fatal. */
export async function listGardens(): Promise<Garden[]> {
  const st = await getStorage();
  const out: Garden[] = [];
  for (const file of await st.list(GARDEN_ROOT)) {
    if (!file.endsWith('.json')) continue;
    const g = await loadGarden(file.slice(0, -5));
    if (g) out.push(g);
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_GARDENS);
}

export async function deleteGarden(id: string): Promise<void> {
  if (!ID_RE.test(id)) return;
  const st = await getStorage();
  await st.remove(pathOf(id));
}

/** A copy with its own id and the name "<name> copy". */
export function duplicateGarden(g: Garden): Garden {
  const now = Date.now();
  return { ...structuredClone(g), id: newGardenId(), name: `${g.name} copy`.slice(0, 40), createdAt: now, updatedAt: now };
}

/** Appends a point to a stroke unless it is too close to the last one (keeps files small). */
export function addPoint(s: Stroke, x: number, y: number, minGap = 5): boolean {
  const n = s.pts.length;
  if (n >= MAX_POINTS * 2) return false;
  if (n >= 2 && Math.hypot(x - s.pts[n - 2], y - s.pts[n - 1]) < minGap) return false;
  s.pts.push(Math.round(x), Math.round(y));
  return true;
}

/** The object under a point (front-most first), for moving and erasing. */
export function objectAt(g: Garden, x: number, y: number): ZenObject | null {
  for (let i = g.objects.length - 1; i >= 0; i--) {
    const o = g.objects[i];
    if (Math.hypot(o.x - x, o.y - y) <= 30 * o.size) return o;
  }
  return null;
}

/** The raked line nearest a point (within `reach`), for erasing. */
export function strokeAt(g: Garden, x: number, y: number, reach = 16): number {
  for (let i = g.strokes.length - 1; i >= 0; i--) {
    const p = g.strokes[i].pts;
    // distance to each little segment, so a quick stroke with widely spaced points can still be found
    for (let k = 0; k + 3 < p.length; k += 2) {
      const ax = p[k];
      const ay = p[k + 1];
      const dx = p[k + 2] - ax;
      const dy = p[k + 3] - ay;
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
      if (Math.hypot(ax + dx * t - x, ay + dy * t - y) <= reach) return i;
    }
  }
  return -1;
}
