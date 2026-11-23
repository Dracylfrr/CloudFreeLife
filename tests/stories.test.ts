// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { buildCatalog, type Catalog } from '../src/core/content/registry';
import { InstalledTree } from '../src/core/content/tree';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { analyzeAdventure, validateAdventure, validateStory, type AdventureManifest } from '../src/core/manifests';
import { back, canGoBack, choose, currentId, isEnding, listEndings, restoreRun, startRun } from '../src/features/stories/engine';
import {
  PROGRESS_PATH,
  __enableStoryProgressForTests,
  __resetStoryProgressForTests,
  clearPlace,
  flushStoryProgress,
  loadStoryProgress,
  recordEnding,
  sanitizeProgress,
  saveAdventurePath,
  saveStoryPlace,
  storyProgress
} from '../src/features/stories/progress';
import { installPack, parsePack, validatePackContents } from '../src/features/updates/packs';
import { DiskTree, readAllText } from './helpers/diskTree';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';

const enc = (s: string) => new TextEncoder().encode(s);
let catalog: Catalog;
beforeEach(async () => {
  catalog ??= await buildCatalog([new DiskTree()]);
});

describe('bundled stories', () => {
  it('ships ten cozy stories and the adventures, all valid and compatible', () => {
    expect(catalog.skipped).toEqual([]);
    expect(catalog.stories).toHaveLength(10);
    expect(catalog.adventures.length).toBeGreaterThanOrEqual(6);
  });

  it('every cozy story has several chapters of real text and a cover file', async () => {
    const files = await readAllText();
    for (const s of catalog.stories) {
      expect(s.manifest.chapters.length).toBeGreaterThanOrEqual(2);
      for (const c of s.manifest.chapters) {
        expect(c.title.length).toBeGreaterThan(2);
        expect(c.text.join(' ').split(/\s+/).length).toBeGreaterThan(60);
      }
      expect(['1.2.0', '1.3.0']).toContain(s.manifest.minAppVersion);
      expect(`${s.dir}/${s.manifest.cover}` in files).toBe(true);
    }
  });

  it('adventures offer both a guy and a girl protagonist across several genres', () => {
    const who = new Set(catalog.adventures.map((a) => a.manifest.protagonist));
    expect(who).toEqual(new Set(['guy', 'girl']));
    const genres = new Set(catalog.adventures.map((a) => a.manifest.genre));
    for (const g of ['Adventure', 'Romance', 'Comedy']) expect(genres.has(g)).toBe(true);
    // at least a couple of each, so both filters feel populated
    expect(catalog.adventures.filter((a) => a.manifest.protagonist === 'guy').length).toBeGreaterThanOrEqual(3);
    expect(catalog.adventures.filter((a) => a.manifest.protagonist === 'girl').length).toBeGreaterThanOrEqual(3);
  });

  it('romance adventures have a love interest, and every adventure has many endings', () => {
    for (const a of catalog.adventures) {
      const g = analyzeAdventure(a.manifest);
      expect(g.endings, a.manifest.id).toBeGreaterThanOrEqual(5);
      expect(g.unreachable, a.manifest.id).toEqual([]);
      expect(g.stuck, a.manifest.id).toEqual([]);
      if (a.manifest.genre === 'Romance') expect(a.manifest.interest, a.manifest.id).toBeTruthy();
    }
  });

  it('every adventure ending can actually be reached by following choices from the start', () => {
    for (const a of catalog.adventures) {
      const reachable = new Set<string>();
      const stack = [a.manifest.start];
      while (stack.length) {
        const id = stack.pop()!;
        if (reachable.has(id)) continue;
        reachable.add(id);
        for (const c of a.manifest.nodes[id].choices ?? []) stack.push(c.to);
      }
      for (const e of listEndings(a.manifest)) expect(reachable.has(e.id), `${a.manifest.id}:${e.id}`).toBe(true);
    }
  });

  it('keeps the romance heterosexual: a girl narrator has a boy love interest and vice versa', () => {
    const girlsLove = new Set(['Elliot', 'Felix']);
    const guysLove = new Set(['Clara', 'Elsie']);
    for (const a of catalog.adventures.filter((x) => x.manifest.interest)) {
      expect((a.manifest.protagonist === 'girl' ? girlsLove : guysLove).has(a.manifest.interest!), a.manifest.id).toBe(true);
    }
  });
});

describe('adventure validation', () => {
  const base = (): Record<string, unknown> => ({
    id: 'tiny',
    name: 'Tiny',
    description: 'x',
    cover: 'cover.svg',
    version: '1.0.0',
    minAppVersion: '1.2.0',
    genre: 'Adventure',
    protagonist: 'girl',
    start: 'a',
    nodes: {
      a: { text: ['Start.'], choices: [{ text: 'left', to: 'e1' }, { text: 'right', to: 'b' }] },
      b: { text: ['Fork.'], choices: [{ text: 'up', to: 'e2' }, { text: 'down', to: 'e3' }] },
      e1: { text: ['One.'], ending: { title: 'One', mood: 'happy' } },
      e2: { text: ['Two.'], ending: { title: 'Two', mood: 'sweet' } },
      e3: { text: ['Three.'], ending: { title: 'Three', mood: 'funny' } }
    }
  });

  it('accepts a minimal valid adventure', () => {
    expect(validateAdventure(base()).ok).toBe(true);
  });

  it('rejects choices that point nowhere', () => {
    const a = base();
    (a.nodes as any).a.choices[0].to = 'missing';
    const r = validateAdventure(a);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/does not exist/);
  });

  it('rejects an adventure with fewer than three endings', () => {
    const a = base();
    (a.nodes as any).b.choices = [{ text: 'up', to: 'e2' }];
    delete (a.nodes as any).e3;
    expect(validateAdventure(a).ok).toBe(false);
  });

  it('rejects passages that can never be reached and loops that never end', () => {
    const orphan = base();
    (orphan.nodes as any).lost = { text: ['Nobody comes here.'], ending: { title: 'Lost', mood: 'dreamy' } };
    const o = validateAdventure(orphan);
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.errors.join(' ')).toMatch(/never be reached/);

    const loop = base();
    (loop.nodes as any).b.choices = [{ text: 'again', to: 'c' }];
    (loop.nodes as any).c = { text: ['Round.'], choices: [{ text: 'again', to: 'b' }] };
    delete (loop.nodes as any).e2;
    delete (loop.nodes as any).e3;
    (loop.nodes as any).a.choices.push({ text: 'x', to: 'e1' });
    const l = validateAdventure(loop);
    expect(l.ok).toBe(false);
  });

  it('requires a guy or girl protagonist, one of choices/ending per passage, and 1 to 4 choices', () => {
    const p = base();
    p.protagonist = 'robot';
    expect(validateAdventure(p).ok).toBe(false);
    const both = base();
    (both.nodes as any).e1.choices = [{ text: 'x', to: 'a' }];
    expect(validateAdventure(both).ok).toBe(false);
    const many = base();
    (many.nodes as any).a.choices = ['1', '2', '3', '4', '5'].map((t) => ({ text: t, to: 'e1' }));
    expect(validateAdventure(many).ok).toBe(false);
  });

  it('validates stories: needs chapters with text', () => {
    const ok = { id: 's', name: 'S', description: 'd', cover: 'cover.svg', version: '1.0.0', minAppVersion: '1.2.0', chapters: [{ title: 'One', text: ['Hello.'] }] };
    expect(validateStory(ok).ok).toBe(true);
    expect(validateStory({ ...ok, chapters: [] }).ok).toBe(false);
    expect(validateStory({ ...ok, chapters: [{ title: 'One', text: [] }] }).ok).toBe(false);
  });
});

describe('adventure engine', () => {
  const adv = (): AdventureManifest => {
    const r = validateAdventure({
      id: 'tiny',
      name: 'Tiny',
      description: 'x',
      cover: 'cover.svg',
      version: '1.0.0',
      minAppVersion: '1.2.0',
      genre: 'Adventure',
      protagonist: 'guy',
      start: 'a',
      nodes: {
        a: { text: ['Start.'], choices: [{ text: 'left', to: 'e1' }, { text: 'right', to: 'b' }] },
        b: { text: ['Fork.'], choices: [{ text: 'up', to: 'e2' }, { text: 'down', to: 'e3' }] },
        e1: { text: ['One.'], ending: { title: 'One', mood: 'happy' } },
        e2: { text: ['Two.'], ending: { title: 'Two', mood: 'sweet' } },
        e3: { text: ['Three.'], ending: { title: 'Three', mood: 'funny' } }
      }
    });
    if (!r.ok) throw new Error(r.errors.join(','));
    return r.value;
  };

  it('follows choices, detects endings and goes back', () => {
    const a = adv();
    let run = startRun(a);
    expect(currentId(run)).toBe('a');
    expect(canGoBack(run)).toBe(false);
    run = choose(a, run, 1);
    expect(currentId(run)).toBe('b');
    run = choose(a, run, 0);
    expect(currentId(run)).toBe('e2');
    expect(isEnding(a, run)).toBe(true);
    expect(choose(a, run, 0)).toBe(run); // nothing to choose at an ending
    run = back(run);
    expect(currentId(run)).toBe('b');
    expect(back(back(run)).path).toEqual(['a']);
    expect(back(startRun(a)).path).toEqual(['a']);
  });

  it('ignores choices that do not exist', () => {
    const a = adv();
    const run = startRun(a);
    expect(choose(a, run, 7)).toBe(run);
    expect(choose(a, run, -1)).toBe(run);
  });

  it('restores a saved path and repairs a stale one', () => {
    const a = adv();
    expect(restoreRun(a, ['a', 'b']).path).toEqual(['a', 'b']);
    expect(restoreRun(a, ['a', 'e3', 'zzz']).path).toEqual(['a']); // e3 is not a choice from a
    expect(restoreRun(a, ['a', 'b', 'gone']).path).toEqual(['a', 'b']);
    expect(restoreRun(a, ['b']).path).toEqual(['a']);
    expect(restoreRun(a, 'nonsense').path).toEqual(['a']);
    expect(restoreRun(a, undefined).path).toEqual(['a']);
  });

  it('lists every ending and plays every bundled adventure to an ending by always taking the first choice', () => {
    for (const l of catalog.adventures) {
      let run = startRun(l.manifest);
      for (let i = 0; i < 200 && !isEnding(l.manifest, run); i++) run = choose(l.manifest, run, 0);
      expect(isEnding(l.manifest, run), l.manifest.id).toBe(true);
      expect(listEndings(l.manifest).length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('story progress', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
    __resetStoryProgressForTests();
  });
  afterEach(() => setStorage(null));

  it('sanitizes bad data', () => {
    const p = sanitizeProgress({
      stories: { good_one: { chapter: 2.7, finished: true }, 'Bad Id': { chapter: 1 }, worse: 'x' },
      adventures: { adv: { path: ['a', 5, 'b'], endings: ['e', 'e', 7] } },
      junk: true
    });
    // A v1.2 save has no paragraph / last-opened fields: they default, nothing is lost.
    expect(p.stories).toEqual({ good_one: { chapter: 2, finished: true, para: 0, opened: 0 } });
    expect(p.adventures.adv).toEqual({ path: ['a', 'b'], endings: ['e'], opened: 0 });
    expect(p.favorites).toEqual({ stories: [], adventures: [] });
    expect(sanitizeProgress(null).stories).toEqual({});
    expect(sanitizeProgress('x').adventures).toEqual({});
  });

  it('saves reading places and endings, and loads them back', async () => {
    await loadStoryProgress();
    saveStoryPlace('moon_story', 2, false);
    saveAdventurePath('the_lantern_trail', ['start', 'river']);
    recordEnding('the_lantern_trail', 'end_home');
    recordEnding('the_lantern_trail', 'end_home'); // no duplicates
    await flushStoryProgress();
    const saved = JSON.parse((await mem.readText(PROGRESS_PATH))!);
    expect(saved.stories.moon_story.chapter).toBe(2);
    expect(saved.adventures.the_lantern_trail.endings).toEqual(['end_home']);

    __resetStoryProgressForTests();
    expect(get(storyProgress).stories).toEqual({});
    await loadStoryProgress();
    expect(get(storyProgress).adventures.the_lantern_trail.path).toEqual(['start', 'river']);
  });

  it('keeps "finished" once earned and keeps found endings when a run is cleared', async () => {
    await loadStoryProgress();
    saveStoryPlace('s', 0, true);
    saveStoryPlace('s', 1, false);
    expect(get(storyProgress).stories.s).toMatchObject({ chapter: 1, finished: true, para: 0 });
    recordEnding('a', 'e1');
    saveAdventurePath('a', ['start', 'x']);
    clearPlace('adventure', 'a');
    expect(get(storyProgress).adventures.a).toMatchObject({ path: [], endings: ['e1'] });
    clearPlace('story', 's');
    expect(get(storyProgress).stories.s).toBeUndefined();
  });

  it('recovers from a corrupt progress file', async () => {
    await mem.writeText(PROGRESS_PATH, '{ not json');
    await loadStoryProgress();
    expect(get(storyProgress)).toMatchObject({ stories: {}, adventures: {} });
    __enableStoryProgressForTests();
  });
});

describe('story packs and settings', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
  });
  afterEach(() => setStorage(null));

  async function storyPack() {
    const files = await readAllText();
    const src = 'stories/relaxing/cloud_who_lost_its_rain';
    const out: Record<string, { encoding: 'utf8'; data: string }> = {};
    const have = Object.keys(files).filter((p) => p.startsWith(src + '/')).map((p) => p.slice(src.length + 1));
    for (const f of have) out[`${src}/${f}`] = { encoding: 'utf8', data: files[`${src}/${f}`] };
    return { format: 1, kind: 'stories', id: 'cloud_who_lost_its_rain', name: 'The Cloud Who Lost Its Rain', version: '1.3.0', minAppVersion: '1.2.0', files: out };
  }

  it('installs a story pack and the story shows up', async () => {
    const parsed = parsePack(enc(JSON.stringify(await storyPack())));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect((await validatePackContents(parsed.value)).ok).toBe(true);
    expect((await installPack(parsed.value)).ok).toBe(true);
    const cat = await buildCatalog([new InstalledTree()]);
    expect(cat.stories.map((s) => s.manifest.id)).toEqual(['cloud_who_lost_its_rain']);
  });

  it('refuses a story pack whose cover is missing, and unsafe paths', async () => {
    const p = await storyPack();
    delete (p.files as any)['stories/relaxing/cloud_who_lost_its_rain/cover.svg'];
    const parsed = parsePack(enc(JSON.stringify(p)));
    if (parsed.ok) expect((await validatePackContents(parsed.value)).ok).toBe(false);
    const bad = await storyPack();
    (bad.files as any)['stories/relaxing/../../evil.json'] = { encoding: 'utf8', data: '{}' };
    expect(parsePack(enc(JSON.stringify(bad))).ok).toBe(false);
  });

  it('has a reading-size setting that is clamped', () => {
    expect(DEFAULT_SETTINGS.storyFontScale).toBeGreaterThan(0.9);
    expect(sanitizeSettings({ storyFontScale: 9 }).storyFontScale).toBe(1.7);
    expect(sanitizeSettings({ storyFontScale: 0.1 }).storyFontScale).toBe(0.9);
    expect(sanitizeSettings({ storyFontScale: 'big' }).storyFontScale).toBe(DEFAULT_SETTINGS.storyFontScale);
  });
});
