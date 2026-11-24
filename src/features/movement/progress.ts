/**
 * Exercise only remembers your favorites and the last card you opened, so the screen
 * can say "Last time". No counts, no streaks, no goals. One small file, never uploaded.
 */
import { persisted } from '../../core/persist';

export interface MovementProgress {
  schema: number;
  last: { id: string; at: number } | null;
  favorites: string[];
}

const empty = (): MovementProgress => ({ schema: 1, last: null, favorites: [] });
const idOk = (k: string) => /^[a-z0-9_]{1,64}$/.test(k);

export function sanitizeMovement(raw: unknown): MovementProgress {
  const out = empty();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  const l = r.last as Record<string, unknown> | null | undefined;
  if (l && typeof l.id === 'string' && idOk(l.id) && typeof l.at === 'number' && Number.isFinite(l.at) && l.at > 0) out.last = { id: l.id, at: Math.floor(l.at) };
  if (Array.isArray(r.favorites)) out.favorites = [...new Set(r.favorites.filter((x): x is string => typeof x === 'string' && idOk(x)))].slice(0, 100);
  return out;
}

export const movementProgress = persisted<MovementProgress>('progress/movement.json', empty, sanitizeMovement);
export const loadMovementProgress = () => movementProgress.load();

export function markMovementOpened(id: string) {
  movementProgress.update((p) => {
    p.last = { id, at: Date.now() };
  });
}
export function toggleMovementFavorite(id: string) {
  movementProgress.update((p) => {
    p.favorites = p.favorites.includes(id) ? p.favorites.filter((x) => x !== id) : [...p.favorites, id];
  });
}
