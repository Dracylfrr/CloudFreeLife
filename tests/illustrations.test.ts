// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCatalog, asset } from '../src/core/content/registry';
import { MapTree } from '../src/core/content/tree';
import { readIllustration, storyIllustrationFiles, storyMinutes, storyWordCount, validateStory } from '../src/core/manifests';
import { parsePack, validatePackContents } from '../src/features/updates/packs';
import { DiskTree, readAllText } from './helpers/diskTree';

const enc = (s: string) => new TextEncoder().encode(s);
const base = { id: 's', name: 'S', description: 'd', cover: 'cover.svg', version: '1.3.0', minAppVersion: '1.2.0' };
const ch = (extra = {}) => ({ title: 'One', text: ['A short paragraph of calm words for testing.', 'Another one follows right after it.'], ...extra });

describe('story illustration manifests', () => {
  it('a v1.2 story without any picture fields still validates and renders as before', () => {
    const r = validateStory({ ...base, chapters: [ch(), ch({ title: 'Two' })] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.illustration).toBeUndefined();
    expect(r.value.chapters.every((c) => c.illustration === undefined && c.scenes === undefined)).toBe(true);
    expect(storyIllustrationFiles(r.value)).toEqual([]);
  });

  it('reads picture, alt text and caption at story, chapter and scene level', () => {
    const r = validateStory({
      ...base,
      illustration: 'opening.svg',
      illustrationAlt: 'A quiet hill at dawn.',
      illustrationCaption: 'Dawn',
      chapters: [
        ch({ illustration: 'ch1.webp', illustrationAlt: 'A cloud.', scenes: [{ after: 1, illustration: 'scene1.png', illustrationCaption: 'Between' }] }),
        ch({ title: 'Two' })
      ]
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.illustration).toBe('opening.svg');
    expect(r.value.illustrationAlt).toBe('A quiet hill at dawn.');
    expect(r.value.chapters[0].illustration).toBe('ch1.webp');
    expect(r.value.chapters[0].scenes).toEqual([{ after: 1, illustration: 'scene1.png', illustrationCaption: 'Between' }]);
    expect(storyIllustrationFiles(r.value).sort()).toEqual(['ch1.webp', 'opening.svg', 'scene1.png']);
  });

  it('ignores malformed picture fields instead of rejecting the story', () => {
    const bad = [
      '../../secret.svg',
      'http://example.com/x.svg',
      'C:\\\\x.svg',
      'picture.exe',
      'noextension',
      '',
      42,
      null,
      { x: 1 }
    ];
    for (const b of bad) {
      const r = validateStory({ ...base, illustration: b, chapters: [ch({ illustration: b })] });
      expect(r.ok, `value ${JSON.stringify(b)}`).toBe(true);
      if (r.ok) {
        expect(r.value.illustration).toBeUndefined();
        expect(r.value.chapters[0].illustration).toBeUndefined();
      }
    }
  });

  it('drops scenes that point outside the chapter, and keeps at most three', () => {
    const scenes = [
      { after: 0, illustration: 'a.svg' },
      { after: 1, illustration: 'b.svg' },
      { after: 5, illustration: 'c.svg' },
      { after: 'x', illustration: 'd.svg' },
      { after: 1, illustration: 'e.svg' },
      { after: 1, illustration: 'f.svg' },
      { after: 1, illustration: 'g.svg' }
    ];
    const r = validateStory({ ...base, chapters: [ch({ scenes })] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const got = r.value.chapters[0].scenes ?? [];
    expect(got.length).toBeLessThanOrEqual(3);
    expect(got.every((s) => s.after >= 1 && s.after < 2)).toBe(true);
  });

  it('trims and caps alt text and captions', () => {
    const ill = readIllustration({ illustration: 'a.svg', illustrationAlt: '  hi  ', illustrationCaption: 'x'.repeat(500) });
    expect(ill.illustrationAlt).toBe('hi');
    expect(ill.illustrationCaption!.length).toBe(160);
  });

  it('estimates reading time from the words when the author gives none', () => {
    const para = Array.from({ length: 100 }, () => 'calm').join(' ');
    const r = validateStory({ ...base, chapters: [{ title: 'Long', text: Array.from({ length: 19 }, () => para) }] });
    if (!r.ok) throw new Error('invalid');
    expect(storyWordCount(r.value)).toBe(1900);
    expect(storyMinutes(r.value)).toBe(10);
    expect(storyMinutes({ ...r.value, minutes: 4 })).toBe(4);
  });
});

describe('bundled illustrated stories', () => {
  it('every story picture exists on disk, is small, and has alt text', async () => {
    const catalog = await buildCatalog([new DiskTree()]);
    expect(catalog.skipped).toEqual([]);
    const files = await readAllText();
    let total = 0;
    let count = 0;
    for (const s of catalog.stories) {
      for (const f of storyIllustrationFiles(s.manifest)) {
        const rel = `${s.dir}/${f}`;
        expect(rel in files, `${rel} exists`).toBe(true);
        const size = statSync(resolve('content', rel)).size;
        expect(size, `${rel} stays small`).toBeLessThan(40_000);
        total += size;
        count++;
      }
      for (const c of s.manifest.chapters) if (c.illustration) expect((c.illustrationAlt ?? '').length, `${s.manifest.id} alt text`).toBeGreaterThan(10);
    }
    expect(count).toBeGreaterThanOrEqual(30);
    expect(total).toBeLessThan(400_000); // the whole illustration set stays under 400 KB
  });

  it('each of the six original stories gained pictures, and each new story has several', async () => {
    const catalog = await buildCatalog([new DiskTree()]);
    const by = Object.fromEntries(catalog.stories.map((s) => [s.manifest.id, storyIllustrationFiles(s.manifest).length]));
    for (const id of ['cloud_who_lost_its_rain', 'lantern_for_the_little_owl', 'tea_shop_at_the_rainbows_end', 'moss_and_the_midnight_garden', 'the_whale_who_hummed', 'snow_day_in_mushroom_village']) {
      expect(by[id], id).toBeGreaterThanOrEqual(2);
      expect(by[id], id).toBeLessThanOrEqual(4);
    }
    for (const id of ['night_train_to_moonwater', 'library_on_lantern_lane', 'where_the_rain_keeps_its_umbrellas', 'the_star_gardener']) {
      expect(by[id], id).toBeGreaterThanOrEqual(3);
    }
  });

  it('no story puts a picture after every paragraph (storybook, not image overload)', async () => {
    const catalog = await buildCatalog([new DiskTree()]);
    for (const s of catalog.stories) {
      const paragraphs = s.manifest.chapters.reduce((n, c) => n + c.text.length, 0);
      expect(storyIllustrationFiles(s.manifest).length, s.manifest.id).toBeLessThan(paragraphs / 2);
    }
  });

  it('new stories are properly long, multi-chapter and Read Aloud friendly (short paragraphs)', async () => {
    const catalog = await buildCatalog([new DiskTree()]);
    for (const id of ['night_train_to_moonwater', 'library_on_lantern_lane', 'where_the_rain_keeps_its_umbrellas', 'the_star_gardener']) {
      const s = catalog.stories.find((x) => x.manifest.id === id)!;
      expect(s.manifest.chapters.length).toBeGreaterThanOrEqual(4);
      expect(storyWordCount(s.manifest)).toBeGreaterThan(1500);
      for (const c of s.manifest.chapters) for (const p of c.text) expect(p.split(/\s+/).length, `${id}/${c.title}`).toBeLessThan(140);
    }
  });
});

describe('missing or broken pictures never block reading', () => {
  it('a picture that is not in the content tree resolves to null, and the story still loads', async () => {
    const tree = new MapTree('installed', {
      'stories/relaxing/lonely/story.json': JSON.stringify({ ...base, id: 'lonely', illustration: 'gone.svg', chapters: [ch({ illustration: 'also_gone.webp' })] }),
      'stories/relaxing/lonely/cover.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>'
    });
    const cat = await buildCatalog([tree]);
    expect(cat.skipped).toEqual([]);
    expect(cat.stories).toHaveLength(1);
    const s = cat.stories[0];
    expect(await asset(s.tree, s.dir, 'gone.svg').url()).toBeNull();
    expect(s.manifest.chapters[0].text.length).toBe(2);
  });
});

describe('story packs with pictures', () => {
  const pack = (files: Record<string, { encoding: 'utf8' | 'base64'; data: string }>) => ({ format: 1, kind: 'stories', id: 'p', name: 'P', version: '1.3.0', minAppVersion: '1.2.0', files });
  const story = (extra = {}) => JSON.stringify({ ...base, id: 'p', illustration: 'pic.webp', chapters: [ch()], ...extra });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect width="4" height="3"/></svg>';

  it('accepts a pack whose pictures are all present (WebP travels as base64)', async () => {
    const p = pack({
      'stories/relaxing/p/story.json': { encoding: 'utf8', data: story() },
      'stories/relaxing/p/cover.svg': { encoding: 'utf8', data: svg },
      'stories/relaxing/p/pic.webp': { encoding: 'base64', data: Buffer.from('RIFFxxxxWEBP').toString('base64') }
    });
    const parsed = parsePack(enc(JSON.stringify(p)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect((await validatePackContents(parsed.value)).ok).toBe(true);
  });

  it('refuses a pack that points at a picture it does not contain', async () => {
    const p = pack({
      'stories/relaxing/p/story.json': { encoding: 'utf8', data: story() },
      'stories/relaxing/p/cover.svg': { encoding: 'utf8', data: svg }
    });
    const parsed = parsePack(enc(JSON.stringify(p)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const r = await validatePackContents(parsed.value);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain('pic.webp');
    }
  });

  it('refuses images that are not base64, and active SVG pictures', () => {
    const textWebp = pack({ 'stories/relaxing/p/pic.webp': { encoding: 'utf8', data: 'RIFF' } });
    expect(parsePack(enc(JSON.stringify(textWebp))).ok).toBe(false);
    const evil = pack({ 'stories/relaxing/p/pic.svg': { encoding: 'utf8', data: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' } });
    expect(parsePack(enc(JSON.stringify(evil))).ok).toBe(false);
  });
});

describe('content hygiene', () => {
  it('no story illustration SVG is active or references an outside file', () => {
    const dir = resolve('content/stories/relaxing');
    for (const id of ['the_star_gardener', 'night_train_to_moonwater']) {
      const f = resolve(dir, id, 'ch1.svg');
      expect(existsSync(f)).toBe(true);
      const text = readFileSync(f, 'utf8');
      expect(text).not.toMatch(/<script|onload=|href=|xlink:|<image|<foreignObject/i);
    }
  });
});
