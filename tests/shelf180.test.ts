// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildCatalog, type Catalog } from '../src/core/content/registry';
import { validateAdventure } from '../src/core/manifests';
import { DiskTree } from './helpers/diskTree';
import { buildReadingList } from '../src/features/stories/readingList';
import { groupSeries, partLabel } from '../src/features/stories/longread';
import { sanitizeProgress } from '../src/features/stories/progress';

let catalog: Catalog;
beforeEach(async () => {
  catalog ??= await buildCatalog([new DiskTree()]);
});
const read = (f: string) => readFileSync(f, 'utf8');

describe('Cards show only the title; the summary waits in a window', () => {
  it('a card has the picture and the name, and no summary text', () => {
    const card = read('src/features/stories/ReadingCard.svelte');
    expect(card).not.toContain('m.description');
    expect(card).not.toContain('Choose your path');
    expect(card).toContain('<h3>{m.name}</h3>');
    expect(card).toContain('onpreview(entry)');
  });
  it('the summary window shows the description, the length and one clear button', () => {
    const win = read('src/features/stories/ReadingPreview.svelte');
    expect(win).toContain('{m.description}');
    expect(win).toContain('role="dialog"');
    expect(win).toContain("'Resume'");
    expect(win).toContain("'Begin the adventure'");
    expect(win).toContain("'Start reading'");
    expect(win).toContain("e.key === 'Escape'");
  });
  it('a started book has a Resume button on its card that skips the window', () => {
    const card = read('src/features/stories/ReadingCard.svelte');
    expect(card).toContain("entry.group === 'continue'");
    expect(card).toContain('Resume');
    expect(card).toContain("navigate({ name: 'story', storyId: entry.id })");
    expect(card).toContain("navigate({ name: 'adventure', adventureId: entry.id })");
  });
  it('the shelf opens the window from a card and keeps five columns', () => {
    const shelf = read('src/features/stories/Stories.svelte');
    expect(shelf).toContain('<ReadingPreview');
    expect(shelf).toContain('onpreview=');
    expect(shelf).toContain('repeat(5, minmax(0, 1fr))');
  });
});

describe('Hero adventures, told as you', () => {
  const base = {
    id: 'hero_test', name: 'Hero', description: 'd', cover: 'c.svg', version: '1.8.0', minAppVersion: '1.8.0', genre: 'Fantasy', protagonist: 'hero', start: 'a',
    nodes: {
      a: { text: ['x'], choices: [{ text: 'one', to: 'e1' }, { text: 'two', to: 'e2' }, { text: 'three', to: 'e3' }] },
      e1: { text: ['x'], ending: { title: 'One', mood: 'happy' } },
      e2: { text: ['x'], ending: { title: 'Two', mood: 'sweet' } },
      e3: { text: ['x'], ending: { title: 'Three', mood: 'cozy' } }
    }
  };
  it('accepts "hero" as the protagonist, and still rejects nonsense', () => {
    const ok = validateAdventure(base);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.protagonist).toBe('hero');
    const bad = validateAdventure({ ...base, protagonist: 'robot' });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.join(' ')).toContain('"hero"');
  });
  it('"Playing as you" only shows when the shelf has hero adventures, and the player shows your avatar only for them', () => {
    const shelf = read('src/features/stories/Stories.svelte');
    expect(shelf).toContain("manifest.protagonist === 'hero'");
    expect(shelf).toContain('{#if showPlayer}');
    expect(shelf).toContain("{#if heroCount > 0}<button class:on={who === 'hero'}");
    expect(shelf).toContain('Play as you');
    const player = read('src/features/stories/AdventurePlayer.svelte');
    expect(player).toContain("{#if adv.protagonist === 'hero'}");
    // no hero adventure is bundled yet, so the chip stays hidden for now
    expect(catalog.adventures.filter((a) => a.manifest.protagonist === 'hero')).toHaveLength(0);
  });
});

describe('The free starter series', () => {
  it('The Night Train has three parts in order, and Lantern Lane is ready for more', () => {
    const night = catalog.stories.filter((s) => s.manifest.series?.id === 'night_train');
    expect(night.map((s) => s.manifest.series!.order).sort()).toEqual([1, 2, 3]);
    expect(night.every((s) => s.manifest.series!.name === 'The Night Train')).toBe(true);
    expect(catalog.stories.find((s) => s.manifest.id === 'library_on_lantern_lane')?.manifest.series).toEqual({ id: 'lantern_lane', name: 'Lantern Lane', order: 1 });
  });
  it('the three parts sit together on the shelf and say which part they are', () => {
    const list = buildReadingList(catalog.stories, catalog.adventures, sanitizeProgress({}));
    const mine = list.filter((e) => e.kind === 'story');
    const shelf = groupSeries(mine);
    const series = shelf.find((i) => i.kind === 'series' && i.series.id === 'night_train');
    expect(series && series.kind === 'series' ? series.parts.map((p) => p.id) : []).toEqual(['night_train_to_moonwater', 'tilly_and_the_snowbound_express', 'tilly_and_the_midsummer_run']);
    const second = mine.find((e) => e.id === 'tilly_and_the_snowbound_express')!;
    expect(partLabel(second, mine)).toBe('The Night Train, part 2 of 3');
  });
  it('the new parts are real stories with real chapters and no dashes', () => {
    for (const id of ['tilly_and_the_snowbound_express', 'tilly_and_the_midsummer_run']) {
      const s = catalog.stories.find((x) => x.manifest.id === id)!;
      expect(s.manifest.chapters.length).toBeGreaterThanOrEqual(5);
      const words = s.manifest.chapters.flatMap((c) => c.text).join(' ');
      expect(words.split(/\s+/).length).toBeGreaterThan(800);
      expect(words).not.toMatch(/[\u2013\u2014]/);
    }
  });
});
