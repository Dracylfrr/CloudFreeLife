/** How the Meditation shelf can be ordered. "suggested" is the order the sessions come in. */
export const SORTS = ['suggested', 'shortest', 'longest'] as const;
export type MeditationSort = (typeof SORTS)[number];

export const SORT_LABEL: Record<MeditationSort, string> = {
  suggested: 'Suggested',
  shortest: 'Shortest first',
  longest: 'Longest first'
};

export const isSort = (v: unknown): v is MeditationSort => typeof v === 'string' && (SORTS as readonly string[]).includes(v);

interface Sortable {
  manifest: { kind?: string; minutes?: number; name?: string };
}

/**
 * Sorts by length. A session where the person chooses the length (the silent timer) has no fixed
 * time, so it always goes last. Equal lengths keep their original order.
 */
export function sortSessions<T extends Sortable>(list: readonly T[], sort: MeditationSort): T[] {
  const indexed = list.map((s, i) => ({ s, i }));
  if (sort === 'suggested') return indexed.map((x) => x.s);
  const fixed = (x: { s: T }) => x.s.manifest.kind !== 'timer' && typeof x.s.manifest.minutes === 'number';
  const dir = sort === 'shortest' ? 1 : -1;
  indexed.sort((a, b) => {
    const fa = fixed(a);
    const fb = fixed(b);
    if (fa !== fb) return fa ? -1 : 1;
    if (!fa) return a.i - b.i;
    const d = (a.s.manifest.minutes! - b.s.manifest.minutes!) * dir;
    return d !== 0 ? d : a.i - b.i;
  });
  return indexed.map((x) => x.s);
}
