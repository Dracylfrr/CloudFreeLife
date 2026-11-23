/**
 * Helpers for long reads: how long is left, how to say it, and how stories in a series are
 * shelved together. Pure functions, no storage and no UI, so the rules are easy to test.
 */
import type { SeriesInfo, StoryManifest } from '../../core/manifests';
import type { ReadingEntry } from './readingList';

/** Words per minute at the normal text size; bigger text is read a little slower. */
export const BASE_WPM = 190;

export function readingWpm(fontScale = 1.1): number {
  const scale = Number.isFinite(fontScale) ? Math.min(1.7, Math.max(0.9, fontScale)) : 1.1;
  return Math.round(Math.min(215, Math.max(140, BASE_WPM / (1 + (scale - 1.1) * 0.5))));
}

export const wordsIn = (paragraphs: string[]): number => paragraphs.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);

export interface TimeLeft {
  /** Minutes left in the chapter being read (a fraction; 0 when finished). */
  chapter: number;
  /** Minutes left in the whole story. */
  story: number;
}

/** Time left from a paragraph of a chapter onwards. `chapter >= chapters.length` means finished. */
export function timeLeft(m: Pick<StoryManifest, 'chapters'>, chapter: number, para: number, wpm = BASE_WPM): TimeLeft {
  const chapters = m.chapters;
  if (chapter >= chapters.length || chapter < 0) return { chapter: 0, story: 0 };
  const here = chapters[chapter].text;
  const from = Math.max(0, Math.min(here.length, para));
  const inChapter = wordsIn(here.slice(from));
  let after = 0;
  for (let i = chapter + 1; i < chapters.length; i++) after += wordsIn(chapters[i].text);
  return { chapter: inChapter / wpm, story: (inChapter + after) / wpm };
}

/** "Less than a minute", "About 1 minute", "About 12 minutes", "About 1 hour 5 minutes". */
export function formatLeft(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0.5) return 'Less than a minute';
  const m = Math.round(minutes);
  if (m < 60) return m === 1 ? 'About 1 minute' : `About ${m} minutes`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  const hours = h === 1 ? '1 hour' : `${h} hours`;
  return r === 0 ? `About ${hours}` : `About ${hours} ${r} ${r === 1 ? 'minute' : 'minutes'}`;
}

/** A length for a card: "8 min", "45 min", "2 h 10 min". */
export function formatLength(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

/** Chapters grouped under their `part` heading, in order. Chapters before any heading share an untitled group. */
export function chapterParts(chapters: { part?: string }[]): { part: string; indexes: number[] }[] {
  const out: { part: string; indexes: number[] }[] = [];
  chapters.forEach((c, i) => {
    const part = c.part ?? out[out.length - 1]?.part ?? '';
    const last = out[out.length - 1];
    if (last && last.part === part) last.indexes.push(i);
    else out.push({ part, indexes: [i] });
  });
  return out;
}

export type ShelfItem = { kind: 'single'; entry: ReadingEntry } | { kind: 'series'; series: Pick<SeriesInfo, 'id' | 'name'>; parts: ReadingEntry[] };

export const seriesOf = (e: ReadingEntry): SeriesInfo | undefined => e.story?.manifest.series ?? e.adventure?.manifest.series;

/**
 * Puts the parts of a series together on one shelf entry, at the place of its first member.
 * A series with only one member showing is just that member, so nothing looks half empty.
 */
export function groupSeries(list: ReadingEntry[]): ShelfItem[] {
  const members = new Map<string, ReadingEntry[]>();
  for (const e of list) {
    const s = seriesOf(e);
    if (s) members.set(s.id, [...(members.get(s.id) ?? []), e]);
  }
  const out: ShelfItem[] = [];
  const placed = new Set<string>();
  for (const e of list) {
    const s = seriesOf(e);
    if (!s || (members.get(s.id)?.length ?? 0) < 2) {
      out.push({ kind: 'single', entry: e });
      continue;
    }
    if (placed.has(s.id)) continue;
    placed.add(s.id);
    const parts = [...(members.get(s.id) ?? [])].sort((a, b) => (seriesOf(a)?.order ?? 0) - (seriesOf(b)?.order ?? 0));
    out.push({ kind: 'series', series: { id: s.id, name: s.name }, parts });
  }
  return out;
}

/** "Part 2 of 3" for a member of a series, or '' when it is not part of one (or alone). */
export function partLabel(e: ReadingEntry, list: ReadingEntry[]): string {
  const s = seriesOf(e);
  if (!s) return '';
  const all = list.filter((x) => seriesOf(x)?.id === s.id);
  return all.length > 1 ? `${s.name}, part ${s.order} of ${all.length}` : '';
}
