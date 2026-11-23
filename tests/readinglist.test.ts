// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { buildCatalog, type Catalog } from '../src/core/content/registry';
import { MemoryStorage, setStorage } from '../src/core/storage';
import {
  PROGRESS_PATH,
  __enableStoryProgressForTests,
  __resetStoryProgressForTests,
  flushStoryProgress,
  isFavorite,
  loadStoryProgress,
  recordEnding,
  sanitizeProgress,
  saveAdventurePath,
  saveStoryParagraph,
  saveStoryPlace,
  setFavorite,
  storyPercent,
  storyProgress
} from '../src/features/stories/progress';
import { buildReadingList, groupReadingList, mostRecentUnfinished } from '../src/features/stories/readingList';
import { DiskTree } from './helpers/diskTree';

let catalog: Catalog;
let mem: MemoryStorage;
beforeEach(async () => {
  catalog ??= await buildCatalog([new DiskTree()]);
  mem = new MemoryStorage();
  setStorage(mem);
  __resetStoryProgressForTests();
  await loadStoryProgress();
});
afterEach(() => setStorage(null));

const list = () => buildReadingList(catalog.stories, catalog.adventures, get(storyProgress));
const entry = (id: string) => list().find((e) => e.id === id)!;

describe('reading progress', () => {
  it('opens a v1.2 progress file without losing anything', async () => {
    const v12 = {
      schema: 1,
      stories: { the_whale_who_hummed: { chapter: 2, finished: false }, snow_day_in_mushroom_village: { chapter: 0, finished: true } },
      adventures: { the_lantern_trail: { path: ['start', 'river'], endings: ['end_home'] } }
    };
    await mem.writeText(PROGRESS_PATH, JSON.stringify(v12));
    await loadStoryProgress();
    const p = get(storyProgress);
    expect(p.stories.the_whale_who_hummed).toEqual({ chapter: 2, finished: false, para: 0, opened: 0 });
    expect(p.stories.snow_day_in_mushroom_village.finished).toBe(true);
    expect(p.adventures.the_lantern_trail.path).toEqual(['start', 'river']);
    expect(p.adventures.the_lantern_trail.endings).toEqual(['end_home']);
    expect(p.favorites).toEqual({ stories: [], adventures: [] });
    // and the reading list understands it
    expect(entry('the_whale_who_hummed').group).toBe('continue');
    expect(entry('the_whale_who_hummed').label).toBe('Chapter 3 of 3');
    expect(entry('snow_day_in_mushroom_village').group).toBe('finished');
  });

  it('remembers the chapter, the paragraph and when a story was opened, and saves them to disk', async () => {
    const before = Date.now();
    saveStoryPlace('the_star_gardener', 2, false, 3);
    saveStoryParagraph('the_star_gardener', 5);
    const place = get(storyProgress).stories.the_star_gardener;
    expect(place).toMatchObject({ chapter: 2, para: 5, finished: false });
    expect(place.opened).toBeGreaterThanOrEqual(before);
    await flushStoryProgress();
    const saved = JSON.parse((await mem.readText(PROGRESS_PATH))!);
    expect(saved.schema).toBe(2);
    expect(saved.stories.the_star_gardener).toMatchObject({ chapter: 2, para: 5 });
    __resetStoryProgressForTests();
    await loadStoryProgress();
    expect(get(storyProgress).stories.the_star_gardener).toMatchObject({ chapter: 2, para: 5 });
  });

  it('paragraph position does not invent a place for a story that was never opened', () => {
    saveStoryParagraph('never_opened', 4);
    expect(get(storyProgress).stories.never_opened).toBeUndefined();
  });

  it('bounds paragraph numbers and drops junk', () => {
    const p = sanitizeProgress({ stories: { ok_one: { chapter: 1, para: 9_999_999, opened: 'yesterday' }, neg: { chapter: 0, para: -3 } } });
    expect(p.stories.ok_one.para).toBe(2000);
    expect(p.stories.ok_one.opened).toBe(0);
    expect(p.stories.neg.para).toBe(0);
  });
});

describe('favorites', () => {
  it('can be added, removed and survive a restart', async () => {
    __enableStoryProgressForTests();
    setFavorite('story', 'the_whale_who_hummed', true);
    setFavorite('adventure', 'the_lantern_trail', true);
    setFavorite('story', 'the_whale_who_hummed', true); // twice: still once
    expect(get(storyProgress).favorites.stories).toEqual(['the_whale_who_hummed']);
    expect(isFavorite(get(storyProgress), 'adventure', 'the_lantern_trail')).toBe(true);
    await flushStoryProgress();
    __resetStoryProgressForTests();
    await loadStoryProgress();
    expect(get(storyProgress).favorites.adventures).toEqual(['the_lantern_trail']);
    setFavorite('story', 'the_whale_who_hummed', false);
    expect(get(storyProgress).favorites.stories).toEqual([]);
  });

  it('a favorite shows up in Favorites whatever its reading state', () => {
    __enableStoryProgressForTests();
    setFavorite('story', 'the_star_gardener', true);
    const g = groupReadingList(list());
    expect(g.favorites.map((e) => e.id)).toEqual(['the_star_gardener']);
    expect(g.notStarted.some((e) => e.id === 'the_star_gardener')).toBe(true);
  });
});

describe('the Reading List groups', () => {
  it('everything starts in Not started, and nothing is mixed up', () => {
    const g = groupReadingList(list());
    expect(g.continue).toEqual([]);
    expect(g.finished).toEqual([]);
    expect(g.notStarted.length).toBe(catalog.stories.length + catalog.adventures.length);
  });

  it('a story moves from Not started to Continue to Finished', () => {
    __enableStoryProgressForTests();
    saveStoryPlace('night_train_to_moonwater', 0, false);
    expect(entry('night_train_to_moonwater').group).toBe('notStarted'); // opened but still at the first line
    saveStoryPlace('night_train_to_moonwater', 2, false);
    const e = entry('night_train_to_moonwater');
    expect(e.group).toBe('continue');
    expect(e.label).toMatch(/^Chapter 3 of \d+$/);
    expect(e.percent).toBeGreaterThan(0);
    expect(e.percent).toBeLessThan(100);
    saveStoryPlace('night_train_to_moonwater', 0, true);
    expect(entry('night_train_to_moonwater').group).toBe('finished');
    expect(entry('night_train_to_moonwater').percent).toBe(100);
  });

  it('an adventure is Continue mid-run, Finished once an ending is found', () => {
    __enableStoryProgressForTests();
    const a = catalog.adventures[0];
    const id = a.manifest.id;
    saveAdventurePath(id, [a.manifest.start, Object.keys(a.manifest.nodes).find((k) => k !== a.manifest.start && !a.manifest.nodes[k].ending)!]);
    expect(entry(id).group).toBe('continue');
    const ending = Object.keys(a.manifest.nodes).find((k) => a.manifest.nodes[k].ending)!;
    recordEnding(id, ending);
    saveAdventurePath(id, [a.manifest.start, ending]);
    const e = entry(id);
    expect(e.group).toBe('finished');
    expect(e.label).toMatch(/1 of \d+ endings found/);
    expect(e.percent).toBeGreaterThan(0);
  });

  it('Continue is ordered with the most recently opened first', async () => {
    __enableStoryProgressForTests();
    saveStoryPlace('the_whale_who_hummed', 1, false);
    await new Promise((r) => setTimeout(r, 5));
    saveStoryPlace('the_star_gardener', 1, false);
    const g = groupReadingList(list());
    expect(g.continue.map((e) => e.id)).toEqual(['the_star_gardener', 'the_whale_who_hummed']);
    expect(mostRecentUnfinished(list())?.id).toBe('the_star_gardener');
  });

  it('percent is bounded and exact for finished and untouched stories', () => {
    expect(storyPercent(undefined, 5)).toBe(0);
    expect(storyPercent({ chapter: 2, finished: false, para: 0, opened: 1 }, 5)).toBe(40);
    expect(storyPercent({ chapter: 4, finished: false, para: 0, opened: 1 }, 5)).toBe(80);
    expect(storyPercent({ chapter: 0, finished: true, para: 0, opened: 1 }, 5)).toBe(100);
    expect(storyPercent({ chapter: 99, finished: false, para: 0, opened: 1 }, 5)).toBe(80);
  });
});
