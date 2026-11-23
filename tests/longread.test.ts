import { describe, expect, it } from 'vitest';
import { validateAdventure, validateStory } from '../src/core/manifests';
import { MAX_BOOKMARKS, MAX_NOTE, __enableStoryProgressForTests, __resetStoryProgressForTests, addBookmark, bookmarksOf, removeBookmark, sanitizeProgress, storyProgress } from '../src/features/stories/progress';
import { BASE_WPM, chapterParts, formatLeft, formatLength, groupSeries, partLabel, readingWpm, timeLeft, wordsIn } from '../src/features/stories/longread';
import type { ReadingEntry } from '../src/features/stories/readingList';
import { get } from 'svelte/store';

function ok<T>(r: { ok: true; value: T } | { ok: false; errors: string[] }): T {
  if (!r.ok) throw new Error(r.errors.join('; '));
  return r.value;
}
const para = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
const story = (extra: Record<string, unknown> = {}, chapters?: unknown[]) => ({
  id: 's1',
  name: 'S',
  description: 'd',
  cover: 'cover.svg',
  version: '1.5.0',
  minAppVersion: '1.5.0',
  chapters: chapters ?? [{ title: 'One', text: ['a b c'] }],
  ...extra
});

describe('story manifests: series, parts and rest markers', () => {
  it('reads a valid series and chapter extras', () => {
    const r = validateStory(story({ series: { id: 'lantern_lane', name: 'Lantern Lane', order: 2 } }, [{ title: 'One', text: ['x'], part: 'Part One', rest: true }, { title: 'Two', text: ['y'] }]));
    expect(r.ok).toBe(true);
    expect(ok(r).series).toEqual({ id: 'lantern_lane', name: 'Lantern Lane', order: 2 });
    expect(ok(r).chapters[0]).toMatchObject({ part: 'Part One', rest: true });
    expect(ok(r).chapters[1].rest).toBeUndefined();
  });
  it('ignores a malformed series instead of rejecting the story', () => {
    for (const bad of [{ id: 'Bad Id', name: 'x', order: 1 }, { id: 'ok', name: '', order: 1 }, { id: 'ok', name: 'x', order: 0 }, { id: 'ok', name: 'x', order: 1.5 }, 'nope', 5]) {
      const r = validateStory(story({ series: bad }));
      expect(r.ok, JSON.stringify(bad)).toBe(true);
      expect(ok(r).series).toBeUndefined();
    }
  });
  it('adventures can belong to a series too', () => {
    const r = validateAdventure({
      id: 'a1', name: 'A', description: 'd', cover: 'c.svg', version: '1.5.0', minAppVersion: '1.5.0', genre: 'Mystery', protagonist: 'girl', start: 'a',
      series: { id: 'harbor', name: 'Harbor Mysteries', order: 1 },
      nodes: {
        a: { text: ['x'], choices: [{ text: 'one', to: 'b' }, { text: 'two', to: 'c' }, { text: 'three', to: 'd' }] },
        b: { text: ['y'], ending: { title: 'End 1', mood: 'happy' } },
        c: { text: ['y'], ending: { title: 'End 2', mood: 'sweet' } },
        d: { text: ['y'], ending: { title: 'End 3', mood: 'cozy' } }
      }
    });
    expect(ok(r).series).toEqual({ id: 'harbor', name: 'Harbor Mysteries', order: 1 });
  });
});

describe('time left', () => {
  const m = { chapters: [{ title: 'a', text: [para(100), para(100)] }, { title: 'b', text: [para(200)] }, { title: 'c', text: [para(400)] }] };
  it('counts words from the paragraph being read onwards', () => {
    expect(wordsIn([para(3), para(4)])).toBe(7);
    const t = timeLeft(m, 0, 0, 100);
    expect(t.chapter).toBeCloseTo(2, 5);
    expect(t.story).toBeCloseTo(8, 5);
    const later = timeLeft(m, 0, 1, 100);
    expect(later.chapter).toBeCloseTo(1, 5);
    expect(later.story).toBeCloseTo(7, 5);
    expect(timeLeft(m, 2, 0, 100).story).toBeCloseTo(4, 5);
  });
  it('is zero when finished and safe with odd input', () => {
    expect(timeLeft(m, 3, 0)).toEqual({ chapter: 0, story: 0 });
    expect(timeLeft(m, -1, 0)).toEqual({ chapter: 0, story: 0 });
    expect(timeLeft(m, 0, 999, 100).chapter).toBe(0);
  });
  it('reads bigger text a little slower, within sane limits', () => {
    expect(readingWpm(1.1)).toBe(BASE_WPM);
    expect(readingWpm(1.7)).toBeLessThan(readingWpm(1.1));
    expect(readingWpm(0.9)).toBeGreaterThan(readingWpm(1.1));
    expect(readingWpm(NaN)).toBe(BASE_WPM);
    expect(readingWpm(100)).toBeGreaterThanOrEqual(140);
  });
  it('says it in plain words', () => {
    expect(formatLeft(0)).toBe('Less than a minute');
    expect(formatLeft(0.4)).toBe('Less than a minute');
    expect(formatLeft(1)).toBe('About 1 minute');
    expect(formatLeft(12.4)).toBe('About 12 minutes');
    expect(formatLeft(60)).toBe('About 1 hour');
    expect(formatLeft(65)).toBe('About 1 hour 5 minutes');
    expect(formatLeft(135)).toBe('About 2 hours 15 minutes');
    expect(formatLength(8)).toBe('8 min');
    expect(formatLength(130)).toBe('2 h 10 min');
    expect(formatLength(120)).toBe('2 h');
  });
});

describe('chapter parts', () => {
  it('groups chapters under their heading, carrying it forward', () => {
    const g = chapterParts([{ part: 'Part One' }, {}, { part: 'Part Two' }, {}, {}]);
    expect(g).toEqual([{ part: 'Part One', indexes: [0, 1] }, { part: 'Part Two', indexes: [2, 3, 4] }]);
    expect(chapterParts([{}, {}])).toEqual([{ part: '', indexes: [0, 1] }]);
    expect(chapterParts([])).toEqual([]);
  });
});

describe('series shelves', () => {
  const entry = (id: string, series?: { id: string; name: string; order: number }): ReadingEntry =>
    ({ kind: 'story', id, group: 'notStarted', favorite: false, percent: 0, label: '', opened: 0, minutes: 5, series, story: { manifest: { id, series } } as never }) as ReadingEntry;
  it('puts the parts of a series together, in order, at the first member', () => {
    const list = [entry('x'), entry('p2', { id: 's', name: 'Saga', order: 2 }), entry('y'), entry('p1', { id: 's', name: 'Saga', order: 1 })];
    const g = groupSeries(list);
    expect(g.map((i) => i.kind)).toEqual(['single', 'series', 'single']);
    const s = g[1];
    expect(s.kind === 'series' && s.parts.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(s.kind === 'series' && s.series).toEqual({ id: 's', name: 'Saga' });
  });
  it('a series with only one member showing is just that member', () => {
    const g = groupSeries([entry('only', { id: 's', name: 'Saga', order: 1 }), entry('z')]);
    expect(g.map((i) => i.kind)).toEqual(['single', 'single']);
  });
  it('labels a part, but only when it really has siblings', () => {
    const list = [entry('p1', { id: 's', name: 'Saga', order: 1 }), entry('p2', { id: 's', name: 'Saga', order: 2 }), entry('solo', { id: 't', name: 'Solo', order: 1 })];
    expect(partLabel(list[1], list)).toBe('Saga, part 2 of 2');
    expect(partLabel(list[2], list)).toBe('');
    expect(partLabel(entry('plain'), list)).toBe('');
  });
});

describe('bookmarks', () => {
  it('are kept, ordered, limited and removable', () => {
    __resetStoryProgressForTests();
    __enableStoryProgressForTests();
    expect(addBookmark('s1', 2, 5, '  a lovely line  ')).toBe(true);
    expect(addBookmark('s1', 0, 3)).toBe(true);
    expect(addBookmark('s1', 0, 1, 'start')).toBe(true);
    const list = bookmarksOf(get(storyProgress), 's1');
    expect(list.map((b) => [b.chapter, b.para])).toEqual([[0, 1], [0, 3], [2, 5]]);
    expect(list[2].note).toBe('a lovely line');
    // adding at the same spot updates the note instead of duplicating
    addBookmark('s1', 2, 5, 'new note');
    expect(bookmarksOf(get(storyProgress), 's1')).toHaveLength(3);
    expect(bookmarksOf(get(storyProgress), 's1')[2].note).toBe('new note');
    removeBookmark('s1', 0, 3);
    expect(bookmarksOf(get(storyProgress), 's1')).toHaveLength(2);
    removeBookmark('s1', 0, 1);
    removeBookmark('s1', 2, 5);
    expect(get(storyProgress).bookmarks.s1).toBeUndefined();
  });
  it('stop at the limit without losing the ones already there', () => {
    __resetStoryProgressForTests();
    __enableStoryProgressForTests();
    for (let i = 0; i < MAX_BOOKMARKS; i++) expect(addBookmark('s1', 0, i)).toBe(true);
    expect(addBookmark('s1', 1, 0)).toBe(false);
    expect(bookmarksOf(get(storyProgress), 's1')).toHaveLength(MAX_BOOKMARKS);
  });
  it('survive loading: a clean file round-trips, damaged entries are dropped, old files still load', () => {
    const p = sanitizeProgress({
      schema: 3,
      stories: { s1: { chapter: 1, finished: false, para: 2, opened: 5 } },
      bookmarks: { s1: [{ chapter: 1, para: 2, note: 'x'.repeat(500), at: 9 }, { chapter: 'no', para: 1 }, null, { chapter: -3, para: 1 }], 'Bad Id': [{ chapter: 0, para: 0 }], s2: 'nope' }
    });
    // the bad ones are dropped (not a number, null); a negative number is clamped to 0
    expect(p.bookmarks.s1.map((b) => [b.chapter, b.para])).toEqual([[1, 2], [0, 1]]);
    expect(p.bookmarks.s1[0].note.length).toBe(MAX_NOTE);
    expect(p.bookmarks['Bad Id']).toBeUndefined();
    expect(p.bookmarks.s2).toBeUndefined();
    const old = sanitizeProgress({ schema: 2, stories: { s1: { chapter: 1, finished: false, para: 0, opened: 1 } }, adventures: {}, favorites: { stories: ['s1'], adventures: [] } });
    expect(old.bookmarks).toEqual({});
    expect(old.stories.s1.chapter).toBe(1);
    expect(old.favorites.stories).toEqual(['s1']);
  });
});
