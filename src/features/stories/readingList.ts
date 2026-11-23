/**
 * The Reading List: every story and adventure sorted into simple groups from the saved
 * progress. Pure functions only (no UI, no storage), so the rules are easy to test.
 *
 *   Continue     started and not done
 *   Not started  never opened
 *   Finished     read to the end (story) / reached an ending (adventure) and not mid-replay
 *   Favorites    hearted, whatever state they are in
 */
import { analyzeAdventure, storyMinutes, type SeriesInfo } from '../../core/manifests';
import type { LoadedAdventure, LoadedStory } from '../../core/content/registry';
import { isFavorite, storyPercent, type StoryProgress } from './progress';

export type ReadingKind = 'story' | 'adventure';
export type ReadingGroup = 'continue' | 'notStarted' | 'finished';

export interface ReadingEntry {
  kind: ReadingKind;
  id: string;
  group: ReadingGroup;
  favorite: boolean;
  /** 0-100. For adventures: share of endings found. */
  percent: number;
  /** "Chapter 3 of 5", "2 of 6 endings found", "Not started"... */
  label: string;
  /** Last opened (epoch ms), 0 if never or from an older save. */
  opened: number;
  minutes: number;
  series?: SeriesInfo;
  story?: LoadedStory;
  adventure?: LoadedAdventure;
}

export function storyEntry(s: LoadedStory, p: StoryProgress): ReadingEntry {
  const id = s.manifest.id;
  const place = p.stories[id];
  const chapters = s.manifest.chapters.length;
  let group: ReadingGroup = 'notStarted';
  let label = 'Not started';
  if (place?.finished) {
    group = 'finished';
    label = 'Finished';
  } else if (place && (place.chapter > 0 || place.para > 0)) {
    group = 'continue';
    label = `Chapter ${Math.min(place.chapter + 1, chapters)} of ${chapters}`;
  }
  return {
    kind: 'story',
    id,
    group,
    favorite: isFavorite(p, 'story', id),
    percent: storyPercent(place, chapters),
    label,
    opened: place?.opened ?? 0,
    minutes: storyMinutes(s.manifest),
    series: s.manifest.series,
    story: s
  };
}

export function adventureEntry(a: LoadedAdventure, p: StoryProgress): ReadingEntry {
  const id = a.manifest.id;
  const place = p.adventures[id];
  const total = analyzeAdventure(a.manifest).endings;
  const found = Math.min(place?.endings.length ?? 0, total);
  const path = place?.path ?? [];
  const midRun = path.length > 1 && !a.manifest.nodes[path[path.length - 1]]?.ending;
  let group: ReadingGroup = 'notStarted';
  let label = 'Not started';
  if (midRun) {
    group = 'continue';
    label = found ? `In progress · ${found} of ${total} endings found` : 'In progress';
  } else if (found > 0) {
    group = 'finished';
    label = `${found} of ${total} endings found`;
  }
  return {
    kind: 'adventure',
    id,
    group,
    favorite: isFavorite(p, 'adventure', id),
    percent: total ? Math.round((found / total) * 100) : 0,
    label,
    opened: place?.opened ?? 0,
    minutes: a.manifest.minutes ?? 10,
    series: a.manifest.series,
    adventure: a
  };
}

export function buildReadingList(stories: LoadedStory[], adventures: LoadedAdventure[], p: StoryProgress): ReadingEntry[] {
  return [...stories.map((s) => storyEntry(s, p)), ...adventures.map((a) => adventureEntry(a, p))];
}

/** Most recently opened first; never-opened items keep their catalog order. */
export function byRecent(list: ReadingEntry[]): ReadingEntry[] {
  return [...list].sort((a, b) => b.opened - a.opened);
}

export interface ReadingGroups {
  continue: ReadingEntry[];
  notStarted: ReadingEntry[];
  finished: ReadingEntry[];
  favorites: ReadingEntry[];
}

export function groupReadingList(list: ReadingEntry[]): ReadingGroups {
  return {
    continue: byRecent(list.filter((e) => e.group === 'continue')),
    notStarted: list.filter((e) => e.group === 'notStarted'),
    finished: byRecent(list.filter((e) => e.group === 'finished')),
    favorites: list.filter((e) => e.favorite)
  };
}

/** The single most recent unfinished story or adventure (for the Home "Continue" card). */
export function mostRecentUnfinished(list: ReadingEntry[]): ReadingEntry | null {
  return byRecent(list.filter((e) => e.group === 'continue'))[0] ?? null;
}
