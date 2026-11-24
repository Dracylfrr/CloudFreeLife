import { readFileSync } from 'node:fs';
import { get } from 'svelte/store';
import { describe, expect, it } from 'vitest';
import { FRAMES } from '../src/features/avatar/frames';
import { KIND_LABEL, countProgress, frameStatus, unlockedFrameIds, type Counts } from '../src/features/avatar/unlocks';
import { openAvatarEditor, avatarEditorOpen, avatarEditorTab } from '../src/features/avatar/state';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';
import { sanitizeProgress } from '../src/features/stories/progress';
import { sanitizeGames } from '../src/features/minigames/progress';

const none: Counts = { stories: 0, endings: 0, levels: 0 };
const earned = FRAMES.filter((f) => f.unlock);

describe('Counting what has been done', () => {
  it('counts finished stories, found endings and completed game levels', () => {
    const s = sanitizeProgress({
      stories: { a: { chapter: 2, finished: true }, b: { chapter: 1, finished: false }, c: { chapter: 3, finished: true } },
      adventures: { x: { path: [], endings: ['e1', 'e2', 'e2'] }, y: { path: [], endings: ['e1'] } }
    });
    const g = sanitizeGames({ played: { memory: { l1: 2, l2: 1 }, breaker: { l1: 1 }, flow: { l1: 4 } } });
    expect(countProgress(s, g)).toEqual({ stories: 2, endings: 3, levels: 4 });
  });
  it('counts a level once however many times it was played', () => {
    const g = sanitizeGames({ played: { memory: { first_pairs: 50 } } });
    expect(countProgress(sanitizeProgress({}), g).levels).toBe(1);
  });
  it('starts at zero', () => {
    expect(countProgress(sanitizeProgress({}), sanitizeGames({}))).toEqual(none);
  });
});

describe('Earned frames', () => {
  it('cover stories, adventure endings and game levels, with steps that grow', () => {
    for (const kind of ['stories', 'endings', 'levels'] as const) {
      const needs = earned.filter((f) => f.unlock!.kind === kind).map((f) => f.unlock!.need);
      expect(needs.length, kind).toBeGreaterThanOrEqual(3);
      expect([...needs].sort((a, b) => a - b), kind).toEqual(needs);
      expect(new Set(needs).size, kind).toBe(needs.length);
    }
  });
  it('are locked at the start, with a counter and a plain task', () => {
    const snow = FRAMES.find((f) => f.id === 'snow')!;
    const st = frameStatus(snow, none);
    expect(st.unlocked).toBe(false);
    expect(st.task).toBe('Finish 6 stories');
    expect(st.counter).toBe('0 of 6 stories');
    expect(st.percent).toBe(0);
  });
  it('show how far along they are, and unlock at exactly the right number', () => {
    const bubbles = FRAMES.find((f) => f.id === 'bubbles')!;
    expect(frameStatus(bubbles, { ...none, levels: 3 })).toMatchObject({ unlocked: false, have: 3, counter: '3 of 5 levels', percent: 60 });
    expect(frameStatus(bubbles, { ...none, levels: 5 })).toMatchObject({ unlocked: true, have: 5 });
    expect(frameStatus(bubbles, { ...none, levels: 400 })).toMatchObject({ unlocked: true, have: 5, percent: 100 });
    const ending = FRAMES.find((f) => f.id === 'butterflies')!;
    expect(frameStatus(ending, { ...none, endings: 2 }).task).toBe('Find 3 adventure endings');
  });
  it('are never unlocked by the wrong kind of progress', () => {
    const night = FRAMES.find((f) => f.id === 'night')!;
    expect(frameStatus(night, { stories: 0, endings: 99, levels: 99 }).unlocked).toBe(false);
    expect(frameStatus(night, { ...none, stories: 1 }).unlocked).toBe(true);
  });
  it('leave the plain and soft frames open from the start', () => {
    const open = unlockedFrameIds(none);
    for (const f of FRAMES.filter((x) => x.group !== 'Earned')) expect(open).toContain(f.id);
    for (const f of earned) expect(open).not.toContain(f.id);
    expect(frameStatus(FRAMES[0], none).unlocked).toBe(true);
  });
  it('are all open once everything has been done', () => {
    expect(unlockedFrameIds({ stories: 999, endings: 999, levels: 999 })).toHaveLength(FRAMES.length);
  });
  it('word the tasks in the singular too', () => {
    expect(KIND_LABEL.stories.task(1)).toBe('Finish 1 story');
    expect(KIND_LABEL.endings.task(1)).toBe('Find 1 adventure ending');
    expect(KIND_LABEL.levels.task(1)).toBe('Complete 1 game level');
  });
});

describe('Telling the person about new frames', () => {
  it('remembers which earned frames it has already announced', () => {
    expect(DEFAULT_SETTINGS.avatarFramesSeen).toBeNull();
    expect(sanitizeSettings({ avatarFramesSeen: ['night', 'night', 'bogus', 5] }).avatarFramesSeen).toEqual(['night']);
    expect(sanitizeSettings({ avatarFramesSeen: 'x' }).avatarFramesSeen).toBeNull();
  });
  it('can open the editor straight on the frames', () => {
    openAvatarEditor('frame');
    expect(get(avatarEditorOpen)).toBe(true);
    expect(get(avatarEditorTab)).toBe('frame');
    // used as a click handler, an event is not a tab
    openAvatarEditor({ type: 'click' });
    expect(get(avatarEditorTab)).toBeNull();
    avatarEditorOpen.set(false);
  });
});

describe('Levels finished in every game are recorded', () => {
  const files: [string, RegExp][] = [
    ['breaker/BreakerScreen', /recordPlayed\('breaker'/],
    ['splash/SplashScreen', /recordPlayed\('splash'/],
    ['memory/MemoryScreen', /recordPlayed\('memory'/],
    ['puzzle/PuzzleScreen', /recordPlayed\('puzzle'/],
    ['bubbles/BubbleScreen', /recordPlayed\('bubbles'/],
    ['catcher/CatcherScreen', /recordPlayed\('catcher'/],
    ['flow/FlowScreen', /recordFlowSolved/]
  ];
  for (const [f, re] of files) {
    it(`${f.split('/')[1]} counts a finished level`, () => {
      expect(readFileSync(`src/features/minigames/${f}.svelte`, 'utf8')).toMatch(re);
    });
  }
  it('endless rounds are not counted as levels', () => {
    const memory = readFileSync('src/features/minigames/memory/MemoryScreen.svelte', 'utf8');
    expect(memory).toContain("mode === 'levels' && level");
    const breaker = readFileSync('src/features/minigames/breaker/BreakerScreen.svelte', 'utf8');
    expect(breaker).toContain("mode === 'endless' ? undefined");
  });
});

describe('The frame tab', () => {
  it('shows a counter and a progress bar for every locked frame', () => {
    const src = readFileSync('src/features/avatar/AvatarEditor.svelte', 'utf8');
    expect(src).toContain('st.counter');
    expect(src).toContain('role="progressbar"');
    expect(src).toContain('Earned themes');
    expect(src).not.toContain('Ornate');
  });
});
