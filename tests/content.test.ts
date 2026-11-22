// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../src/core/content/registry';
import { MapTree } from '../src/core/content/tree';
import { luminance, saturation } from '../src/core/util';
import { validateBook, validateBreakerLevel, validatePage, validatePalette, validateRegions, validateSplashLevel } from '../src/core/manifests';
import { extractRegions } from '../src/features/painting/regionMap';
import { DiskTree, readAllText } from './helpers/diskTree';

const catalogP = buildCatalog([new DiskTree()]);

describe('bundled content', () => {
  it('loads with nothing skipped', async () => {
    const cat = await catalogP;
    expect(cat.skipped).toEqual([]);
    expect(cat.books.map((b) => b.manifest.id).sort()).toEqual(['cloud_dreams', 'cosmic_colors', 'free_canvas', 'peaceful_places']);
  });

  it('ships at least 6 pages in each of the three coloring books (18 total)', async () => {
    const cat = await catalogP;
    for (const id of ['cloud_dreams', 'cosmic_colors', 'peaceful_places']) {
      expect(cat.books.find((b) => b.manifest.id === id)!.pages.length).toBeGreaterThanOrEqual(6);
    }
    expect(cat.books.reduce((n, b) => n + b.pages.length, 0)).toBeGreaterThanOrEqual(18);
  });

  it('keeps human-readable folder names (no generated ids)', async () => {
    const files = Object.keys(await readAllText());
    for (const f of files) {
      for (const seg of f.split('/').slice(0, -1)) expect(seg).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('book manifests: pages exist, covers exist, ids match folders', async () => {
    const cat = await catalogP;
    const files = await readAllText();
    for (const b of cat.books) {
      expect(`books/${b.manifest.id}/book_manifest.json` in files).toBe(true);
      expect(`${b.dir}/${b.manifest.cover}` in files).toBe(true);
      expect(b.dir).toBe(`books/${b.manifest.id}`);
      for (const p of b.pages) {
        expect(`${p.dir}/page_manifest.json` in files).toBe(true);
      }
    }
  });

  it('page manifests: every referenced file exists and region ids match the line art', async () => {
    const cat = await catalogP;
    const files = await readAllText();
    for (const b of cat.books) {
      for (const p of b.pages) {
        for (const f of [p.manifest.thumbnail, p.manifest.lineArt, p.manifest.regions]) expect(`${p.dir}/${f}` in files, `${p.dir}/${f}`).toBe(true);
        const svgIds = extractRegions(files[`${p.dir}/${p.manifest.lineArt}`]).map((r) => r.id);
        const jsonIds = p.regions.regions.map((r) => r.id);
        expect(svgIds, p.dir).toEqual(jsonIds);
        expect(jsonIds.length).toBeGreaterThanOrEqual(8);
        // art must be passive: no scripts or external references
        expect(files[`${p.dir}/${p.manifest.lineArt}`]).not.toMatch(/<script|onload=|href=/i);
      }
    }
  });

  it('free canvas offers the eight required backgrounds', async () => {
    const fc = (await catalogP).books.find((b) => b.manifest.id === 'free_canvas')!;
    expect(fc.manifest.kind).toBe('free_canvas');
    expect(fc.manifest.backgrounds!.map((b) => b.id)).toEqual(['white', 'warm_cream', 'cloud_blue', 'lavender', 'mint', 'pastel_pink', 'starry_sky', 'soft_clouds']);
  });

  it('palettes: ten palettes with friendly names and soft colors', async () => {
    const cat = await catalogP;
    expect(cat.palettes.length).toBeGreaterThanOrEqual(10);
    const required = ['Cloud Morning', 'Cotton Candy', 'Lavender Dream', 'Mint Garden', 'Peach Sunset', 'Soft Rainbow', 'Galaxy Pastel', 'Beach Breeze', 'Meadow Calm', 'Moonlight'];
    expect(cat.palettes.map((p) => p.manifest.name)).toEqual(expect.arrayContaining(required));
    const names = new Set(cat.palettes.flatMap((p) => p.manifest.colors.map((c) => c.name)));
    for (const n of ['Cloud Blue', 'Lilac Mist', 'Peach Cream', 'Rose Milk', 'Mint Leaf', 'Butter Glow']) expect(names.has(n), n).toBe(true);
    for (const p of cat.palettes) {
      expect(p.manifest.colors.length).toBeGreaterThanOrEqual(8);
      expect(new Set(p.manifest.colors.map((c) => c.id)).size).toBe(p.manifest.colors.length);
      for (const c of p.manifest.colors) {
        expect(luminance(c.hex), `${p.manifest.name}/${c.name} too dark`).toBeGreaterThan(0.45); // no harsh black
        expect(saturation(c.hex), `${p.manifest.name}/${c.name} too vivid`).toBeLessThan(0.62); // no neon
      }
    }
  });

  it('Pastel Breaker has six handcrafted levels with the required folder names', async () => {
    const cat = await catalogP;
    expect(cat.breakerLevels.map((l) => l.folder)).toEqual(['01_cloud_wall', '02_rainbow_arch', '03_castle_blocks', '04_star_field', '05_garden_blocks', '06_ocean_bubbles']);
    for (const l of cat.breakerLevels) {
      expect(l.manifest.grid.join('').replace(/[. ]/g, '').length).toBeGreaterThan(20);
      expect(l.manifest.minigame).toBe('pastel_breaker');
    }
  });

  it('Splash Wall has the ten required levels and valid goals', async () => {
    const cat = await catalogP;
    expect(cat.splashLevels.map((l) => l.folder)).toEqual([
      '01_blank_car', '02_cloud_castle_wall', '03_rainbow_target', '04_beach_mural', '05_star_constellation',
      '06_flower_wall', '07_space_planets', '08_grassland_scene', '09_color_match', '10_free_splash'
    ]);
    const files = await readAllText();
    for (const l of cat.splashLevels) {
      const svg = files[`${l.dir}/${l.manifest.wall}`];
      expect(svg, l.dir).toBeTruthy();
      expect(`${l.dir}/${l.manifest.thumbnail}` in files).toBe(true);
      const ids = new Set(extractRegions(svg).map((r) => r.id));
      const g = l.manifest.goal;
      if (g.type === 'regions') for (const r of g.regions) expect(ids.has(r), `${l.dir}: ${r}`).toBe(true);
      if (g.type === 'color_match') for (const r of Object.keys(g.targets)) expect(ids.has(r), `${l.dir}: ${r}`).toBe(true);
    }
  });
});

describe('manifest validators', () => {
  const book = { id: 'castle_dreams', name: 'Castle Dreams', description: 'x', cover: 'cover.svg', version: '1.0.0', minAppVersion: '1.0.0', pages: ['01_a'] };
  it('accepts a valid book', () => expect(validateBook(book).ok).toBe(true));
  it.each([
    ['bad id', { ...book, id: 'Castle Dreams' }],
    ['no pages', { ...book, pages: [] }],
    ['bad version', { ...book, version: '1' }],
    ['path in cover', { ...book, cover: '../cover.svg' }],
    ['duplicate pages', { ...book, pages: ['01_a', '01_a'] }]
  ])('rejects book: %s', (_n, raw) => {
    const r = validateBook(raw);
    expect(r.ok).toBe(false);
  });

  it('page + regions validators', () => {
    const page = { id: 'castle', name: 'Castle', description: 'x', version: '1.0.0', minAppVersion: '1.0.0', thumbnail: 't.svg', lineArt: 'l.svg', regions: 'r.json' };
    expect(validatePage(page).ok).toBe(true);
    expect(validatePage({ ...page, lineArt: '../x.svg' }).ok).toBe(false);
    expect(validateRegions({ viewBox: [1000, 750], regions: [{ id: 'sky', name: 'Sky' }] }).ok).toBe(true);
    expect(validateRegions({ viewBox: [1000, 750], regions: [{ id: 'sky' }, { id: 'sky' }] }).ok).toBe(false);
  });

  it('palette validator', () => {
    const pal = { id: 'p', name: 'P', version: '1.0.0', minAppVersion: '1.0.0', colors: [1, 2, 3, 4].map((i) => ({ name: `C${i}`, hex: '#aabbcc' })) };
    expect(validatePalette({ ...pal, colors: [...pal.colors, { name: 'C1', hex: '#ffffff' }] }).ok).toBe(false); // duplicate color id
    expect(validatePalette(pal).ok).toBe(true);
    expect(validatePalette({ ...pal, colors: [{ name: 'x', hex: 'red' }, ...pal.colors] }).ok).toBe(false);
  });

  it('level validators check grid shape and legend', () => {
    const base = { id: 'l1', name: 'L', description: 'x', minigame: 'pastel_breaker', thumbnail: 't.svg', version: '1.0.0', minAppVersion: '1.0.0', objective: 'o' };
    expect(validateBreakerLevel({ ...base, grid: ['aab', 'aab'], legend: { a: '#ffffff', b: '#eeeeee' } }).ok).toBe(true);
    expect(validateBreakerLevel({ ...base, grid: ['aab', 'aa'], legend: { a: '#fff', b: '#eee' } }).ok).toBe(false);
    expect(validateBreakerLevel({ ...base, grid: ['aaz'], legend: { a: '#ffffff' } }).ok).toBe(false);
    const sw = { ...base, minigame: 'splash_wall', wall: 'wall.svg', goal: { type: 'coverage', target: 0.5 } };
    expect(validateSplashLevel(sw).ok).toBe(true);
    expect(validateSplashLevel({ ...sw, goal: { type: 'coverage', target: 5 } }).ok).toBe(false);
    expect(validateSplashLevel({ ...sw, goal: { type: 'nonsense' } }).ok).toBe(false);
  });
});

describe('content compatibility', () => {
  it('hides content that needs a newer app, and reports why', async () => {
    const book = { id: 'future_book', name: 'Future', description: 'x', cover: 'cover.svg', version: '1.0.0', minAppVersion: '9.0.0', pages: ['01_a'] };
    const tree = new MapTree('installed', { 'books/future_book/book_manifest.json': JSON.stringify(book) });
    const cat = await buildCatalog([tree], '1.0.0');
    expect(cat.books).toHaveLength(0);
    expect(cat.skipped[0].reason).toMatch(/9\.0\.0/);
    const ok = await buildCatalog([tree], '9.0.0');
    expect(ok.skipped.some((s) => /Missing page/.test(s.reason))).toBe(true); // visible now, but its page files are missing
  });

  it('prefers the newer version when bundled and installed copies share an id', async () => {
    const files = await readAllText();
    const bundled = new MapTree('bundled', files);
    const m = JSON.parse(files['books/cloud_dreams/book_manifest.json']);
    const newer: Record<string, string> = {};
    for (const [k, v] of Object.entries(files)) if (k.startsWith('books/cloud_dreams/')) newer[k] = v;
    newer['books/cloud_dreams/book_manifest.json'] = JSON.stringify({ ...m, version: '1.1.0', name: 'Cloud Dreams Deluxe' });
    const installed = new MapTree('installed', newer);
    const cat = await buildCatalog([bundled, installed]);
    expect(cat.books.find((b) => b.manifest.id === 'cloud_dreams')!.manifest.name).toBe('Cloud Dreams Deluxe');
  });
});

describe('documentation templates', () => {
  const load = async (f: string) => JSON.parse(await (await import('node:fs/promises')).readFile(`docs/templates/${f}`, 'utf8'));

  it('every template validates with the real validators', async () => {
    expect(validateBook(await load('book_manifest.json')).ok).toBe(true);
    expect(validatePage(await load('page_manifest.json')).ok).toBe(true);
    expect(validateRegions(await load('regions.json')).ok).toBe(true);
    expect(validatePalette(await load('palette.json')).ok).toBe(true);
    expect(validateBreakerLevel(await load('breaker_level.json')).ok).toBe(true);
    expect(validateSplashLevel(await load('splash_level.json')).ok).toBe(true);
  });

  it('the template line art lists exactly the regions in regions.json', async () => {
    const fs = await import('node:fs/promises');
    const svg = await fs.readFile('docs/templates/lineart.svg', 'utf8');
    const regions = await load('regions.json');
    expect(extractRegions(svg).map((r) => r.id)).toEqual(regions.regions.map((r: { id: string }) => r.id));
  });

  it('the release manifest example parses once placeholders are replaced', async () => {
    const { parseReleaseManifest } = await import('../src/features/updates/release');
    const text = (await (await import('node:fs/promises')).readFile('docs/templates/release-manifest.example.json', 'utf8')).replace(/<64 hex characters>/g, 'a'.repeat(64));
    expect(parseReleaseManifest(JSON.parse(text)).ok).toBe(true);
  });
});

describe('bundled asset loading', () => {
  it('reads small assets that the bundler inlined as data: URLs without using fetch (CSP safe)', async () => {
    const { BundledTree } = await import('../src/core/content/tree');
    const tree = new BundledTree({}, { '/content/a/plain.svg': "data:image/svg+xml,%3Csvg%20a='1'/%3E", '/content/a/b64.svg': `data:image/svg+xml;base64,${btoa('<svg b="2"/>')}` });
    expect(await tree.readText('a/plain.svg')).toBe("<svg a='1'/>");
    expect(await tree.readText('a/b64.svg')).toBe('<svg b="2"/>');
    expect(await tree.readText('a/missing.svg')).toBeNull();
  });

  it('keeps the production build from inlining art', async () => {
    const cfg = (await import('node:fs/promises')).readFile('vite.config.ts', 'utf8');
    expect(await cfg).toMatch(/assetsInlineLimit:\s*0/);
  });
});
