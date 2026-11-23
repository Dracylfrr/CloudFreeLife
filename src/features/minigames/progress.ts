/**
 * What the relaxing games remember, kept small: which Paint Flow boards you have connected,
 * how many times a level was played, and the last game you played (for the Home "Continue" card).
 * There are no scores, ranks or streaks. One small file on this computer, never uploaded.
 */
import { persisted } from '../../core/persist';

export interface GamesProgress {
  schema: number;
  /** Times a level was played to a gentle finish, by game then level id. */
  played: Record<string, Record<string, number>>;
  /** Paint Flow boards that have been connected. */
  flowSolved: string[];
  last: { game: string; levelId: string; at: number } | null;
}

const empty = (): GamesProgress => ({ schema: 1, played: {}, flowSolved: [], last: null });
const idOk = (k: string) => /^[a-z0-9_]{1,64}$/.test(k);

export function sanitizeGames(raw: unknown): GamesProgress {
  const out = empty();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  if (r.played && typeof r.played === 'object') {
    for (const [g, levels] of Object.entries(r.played as Record<string, unknown>)) {
      if (!idOk(g) || !levels || typeof levels !== 'object') continue;
      const m: Record<string, number> = {};
      for (const [id, n] of Object.entries(levels as Record<string, unknown>)) if (idOk(id) && typeof n === 'number' && n > 0 && Number.isFinite(n)) m[id] = Math.min(100000, Math.floor(n));
      out.played[g] = m;
    }
  }
  if (Array.isArray(r.flowSolved)) out.flowSolved = [...new Set(r.flowSolved.filter((x): x is string => typeof x === 'string' && idOk(x)))].slice(0, 200);
  const l = r.last as Record<string, unknown> | null | undefined;
  if (l && typeof l.game === 'string' && idOk(l.game) && typeof l.levelId === 'string' && idOk(l.levelId) && typeof l.at === 'number' && l.at > 0) out.last = { game: l.game, levelId: l.levelId, at: Math.floor(l.at) };
  return out;
}

export const gamesProgress = persisted<GamesProgress>('progress/games.json', empty, sanitizeGames);
export const loadGamesProgress = () => gamesProgress.load();

/** Remember that a level was played to a gentle finish (and make it the "last played"). */
export function recordPlayed(game: string, levelId: string) {
  gamesProgress.update((p) => {
    p.played[game] = { ...(p.played[game] ?? {}), [levelId]: (p.played[game]?.[levelId] ?? 0) + 1 };
    p.last = { game, levelId, at: Date.now() };
  });
}
export function recordOpened(game: string, levelId: string) {
  gamesProgress.update((p) => {
    p.last = { game, levelId, at: Date.now() };
  });
}
export function recordFlowSolved(levelId: string) {
  gamesProgress.update((p) => {
    if (!p.flowSolved.includes(levelId)) p.flowSolved = [...p.flowSolved, levelId];
  });
  recordPlayed('flow', levelId);
}
