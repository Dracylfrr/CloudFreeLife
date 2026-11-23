/**
 * Reading progress for Cozy Stories and Story Adventures: where you stopped
 * and which endings you have found. One small JSON file in the data folder,
 * written with the same debounced autosave the paint screen uses.
 */
import { get, writable, type Readable } from 'svelte/store';
import { Autosaver } from '../../core/autosave';
import { getStorage } from '../../core/storage';

export const PROGRESS_PATH = 'progress/stories.json';
const SCHEMA = 2;
const MAX_PATH = 400;

export interface StoryPlace {
  /** Chapter index being read. */
  chapter: number;
  /** True once the last chapter has been reached. */
  finished: boolean;
  /** Paragraph within the chapter where reading (or Read Aloud) stopped. Added in 1.3; 0 for older saves. */
  para: number;
  /** When the story was last opened (epoch ms). 0 for saves made before 1.3. */
  opened: number;
}
export interface AdventurePlace {
  /** The passages read so far in the current run. */
  path: string[];
  /** Ids of the ending passages found, over all runs. */
  endings: string[];
  /** When the adventure was last played (epoch ms). 0 for saves made before 1.3. */
  opened: number;
}
export interface Favorites {
  stories: string[];
  adventures: string[];
}
export interface StoryProgress {
  schema: number;
  stories: Record<string, StoryPlace>;
  adventures: Record<string, AdventurePlace>;
  favorites: Favorites;
}

const empty = (): StoryProgress => ({ schema: SCHEMA, stories: {}, adventures: {}, favorites: { stories: [], adventures: [] } });
const stamp = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const idList = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && idKey(x)))].slice(0, 500) : []);

const idKey = (k: string) => /^[a-z0-9_]{1,64}$/.test(k);
const strings = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length <= 64).slice(0, max) : []);

/** Merges untrusted or old data into a valid structure. */
export function sanitizeProgress(raw: unknown): StoryProgress {
  const out = empty();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  if (r.stories && typeof r.stories === 'object') {
    for (const [id, v] of Object.entries(r.stories as Record<string, unknown>)) {
      if (!idKey(id) || !v || typeof v !== 'object') continue;
      const o = v as Record<string, unknown>;
      const chapter = typeof o.chapter === 'number' && Number.isFinite(o.chapter) ? Math.max(0, Math.min(200, Math.floor(o.chapter))) : 0;
      const para = typeof o.para === 'number' && Number.isFinite(o.para) ? Math.max(0, Math.min(2000, Math.floor(o.para))) : 0;
      out.stories[id] = { chapter, finished: o.finished === true, para, opened: stamp(o.opened) };
    }
  }
  if (r.adventures && typeof r.adventures === 'object') {
    for (const [id, v] of Object.entries(r.adventures as Record<string, unknown>)) {
      if (!idKey(id) || !v || typeof v !== 'object') continue;
      const o = v as Record<string, unknown>;
      out.adventures[id] = { path: strings(o.path, MAX_PATH), endings: [...new Set(strings(o.endings, 200))], opened: stamp(o.opened) };
    }
  }
  if (r.favorites && typeof r.favorites === 'object') {
    const f = r.favorites as Record<string, unknown>;
    out.favorites = { stories: idList(f.stories), adventures: idList(f.adventures) };
  }
  return out;
}

const store = writable<StoryProgress>(empty());
export const storyProgress: Readable<StoryProgress> = { subscribe: store.subscribe };

let loaded = false;
const saver = new Autosaver(
  async () => {
    const st = await getStorage();
    await st.writeText(PROGRESS_PATH, JSON.stringify(get(store), null, 2));
  },
  { delay: 800, onStatus: () => {} }
);

export async function loadStoryProgress(): Promise<StoryProgress> {
  try {
    const st = await getStorage();
    const text = await st.readText(PROGRESS_PATH);
    store.set(sanitizeProgress(text ? JSON.parse(text) : null));
  } catch (err) {
    console.warn('Could not read story progress, starting fresh', err);
    store.set(empty());
  }
  loaded = true;
  return get(store);
}

function change(fn: (p: StoryProgress) => void) {
  store.update((p) => {
    const next: StoryProgress = { schema: SCHEMA, stories: { ...p.stories }, adventures: { ...p.adventures }, favorites: { stories: [...p.favorites.stories], adventures: [...p.favorites.adventures] } };
    fn(next);
    return next;
  });
  if (loaded) saver.markDirty();
}

export function saveStoryPlace(id: string, chapter: number, finished: boolean, para = 0) {
  change((p) => {
    const was = p.stories[id];
    p.stories[id] = { chapter, finished: finished || (was?.finished ?? false), para: Math.max(0, para), opened: Date.now() };
  });
}

/** Remembers the paragraph being read; keeps the chapter and finished state as they are. */
export function saveStoryParagraph(id: string, para: number) {
  change((p) => {
    const was = p.stories[id];
    if (!was || was.para === para) return;
    p.stories[id] = { ...was, para: Math.max(0, para) };
  });
}

export function setFavorite(kind: 'story' | 'adventure', id: string, on: boolean) {
  change((p) => {
    const key = kind === 'story' ? 'stories' : 'adventures';
    const list = p.favorites[key].filter((x) => x !== id);
    p.favorites[key] = on ? [...list, id] : list;
  });
}

export function isFavorite(p: StoryProgress, kind: 'story' | 'adventure', id: string): boolean {
  return p.favorites[kind === 'story' ? 'stories' : 'adventures'].includes(id);
}

/** Percent through a story, 0-100: chapters read so far out of the total; 100 once finished. */
export function storyPercent(place: StoryPlace | undefined, chapters: number): number {
  if (!place || chapters <= 0) return 0;
  if (place.finished) return 100;
  return Math.min(99, Math.round((Math.min(place.chapter, chapters - 1) / chapters) * 100));
}

export function saveAdventurePath(id: string, path: string[]) {
  change((p) => {
    p.adventures[id] = { path: path.slice(-MAX_PATH), endings: p.adventures[id]?.endings ?? [], opened: Date.now() };
  });
}

export function recordEnding(id: string, endingId: string) {
  change((p) => {
    const was = p.adventures[id] ?? { path: [], endings: [], opened: Date.now() };
    if (was.endings.includes(endingId)) return;
    p.adventures[id] = { ...was, endings: [...was.endings, endingId] };
  });
}

/** Forgets the reading place of a story or the current run of an adventure (found endings are kept). */
export function clearPlace(kind: 'story' | 'adventure', id: string) {
  change((p) => {
    if (kind === 'story') delete p.stories[id];
    else if (p.adventures[id]) p.adventures[id] = { ...p.adventures[id], path: [] };
  });
}

export const flushStoryProgress = () => saver.flush();

/** Test hook. */
export function __resetStoryProgressForTests() {
  store.set(empty());
  loaded = false;
}
export function __enableStoryProgressForTests() {
  loaded = true;
}
