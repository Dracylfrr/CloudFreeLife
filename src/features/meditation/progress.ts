/**
 * What Meditation remembers, kept deliberately small and kind: your favorites, when you last
 * took a quiet moment, and how many times you finished each session. There are no streaks,
 * no goals and nothing to fall behind on. It lives in one small file on this computer and is
 * never uploaded.
 */
import { persisted } from '../../core/persist';

export interface MeditationProgress {
  schema: number;
  /** The most recent session (started or finished). */
  last: { id: string; at: number } | null;
  /** Sessions finished, by id. */
  done: Record<string, number>;
  favorites: string[];
}

const empty = (): MeditationProgress => ({ schema: 1, last: null, done: {}, favorites: [] });
const idOk = (k: string) => /^[a-z0-9_]{1,64}$/.test(k);

export function sanitizeMeditation(raw: unknown): MeditationProgress {
  const out = empty();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  const l = r.last as Record<string, unknown> | null | undefined;
  if (l && typeof l.id === 'string' && idOk(l.id) && typeof l.at === 'number' && Number.isFinite(l.at) && l.at > 0) out.last = { id: l.id, at: Math.floor(l.at) };
  if (r.done && typeof r.done === 'object') {
    for (const [k, v] of Object.entries(r.done as Record<string, unknown>)) {
      if (idOk(k) && typeof v === 'number' && Number.isFinite(v) && v > 0) out.done[k] = Math.min(100000, Math.floor(v));
    }
  }
  if (Array.isArray(r.favorites)) out.favorites = [...new Set(r.favorites.filter((x): x is string => typeof x === 'string' && idOk(x)))].slice(0, 100);
  return out;
}

export const meditationProgress = persisted<MeditationProgress>('progress/meditation.json', empty, sanitizeMeditation);
export const loadMeditationProgress = () => meditationProgress.load();

export function markStarted(id: string) {
  meditationProgress.update((p) => {
    p.last = { id, at: Date.now() };
  });
}
export function markFinished(id: string) {
  meditationProgress.update((p) => {
    p.done[id] = (p.done[id] ?? 0) + 1;
    p.last = { id, at: Date.now() };
  });
}
export function toggleMeditationFavorite(id: string) {
  meditationProgress.update((p) => {
    p.favorites = p.favorites.includes(id) ? p.favorites.filter((x) => x !== id) : [...p.favorites, id];
  });
}
