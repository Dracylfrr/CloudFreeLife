// Generates every piece of bundled content under /content from the scene
// descriptions in scripts/art. Run with:  npm run content:generate
//
// The output is ordinary files (JSON + SVG). You never have to use this
// script: new books/levels can be written by hand (see docs/). It exists so
// the original art can be edited as code and regenerated consistently.
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloudPages } from './art/pages_cloud.mjs';
import { cosmicPages } from './art/pages_cosmic.mjs';
import { peacefulPages } from './art/pages_peaceful.mjs';
import { covers } from './art/covers.mjs';
import { palettes } from './art/palettes.mjs';
import { breakerLevels } from './art/levels_breaker.mjs';
import { splashLevels } from './art/levels_splash.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const content = resolve(root, 'content');
const VERSION = '1.0.0';
const MIN = '1.0.0';

const json = (o) => JSON.stringify(o, null, 2) + '\n';
async function put(rel, text) {
  const p = resolve(content, rel);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, text, 'utf8');
}

const books = [
  {
    id: 'cloud_dreams',
    name: 'Cloud Dreams',
    description: 'Clouds, castles in the sky, floating islands, balloons, rainbows and sunsets.',
    accent: '#8fc7ec',
    pages: cloudPages
  },
  {
    id: 'cosmic_colors',
    name: 'Cosmic Colors',
    description: 'Gentle stars, planets, moons, galaxies, nebulae and comets.',
    accent: '#a698e0',
    pages: cosmicPages
  },
  {
    id: 'peaceful_places',
    name: 'Peaceful Places',
    description: 'Beaches, meadows, mountains, forests, lakes and cozy cottages.',
    accent: '#8ed2b2',
    pages: peacefulPages
  }
];

// start clean so removed pages never linger
await rm(resolve(content, 'books'), { recursive: true, force: true });
await rm(resolve(content, 'palettes'), { recursive: true, force: true });
await rm(resolve(content, 'minigames'), { recursive: true, force: true });

let pageCount = 0;
for (const b of books) {
  await put(`books/${b.id}/cover.svg`, covers[b.id]);
  await put(
    `books/${b.id}/book_manifest.json`,
    json({
      id: b.id,
      name: b.name,
      description: b.description,
      cover: 'cover.svg',
      version: VERSION,
      minAppVersion: MIN,
      kind: 'coloring',
      accent: b.accent,
      pages: b.pages.map((p) => p.folder)
    })
  );
  for (const p of b.pages) {
    const S = p.scene();
    const id = p.folder.replace(/^\d+_/, '');
    const dir = `books/${b.id}/pages/${p.folder}`;
    await put(`${dir}/lineart.svg`, S.svg('line'));
    await put(`${dir}/thumbnail.svg`, S.svg('color'));
    await put(`${dir}/regions.json`, json(S.regionsJson()));
    await put(
      `${dir}/page_manifest.json`,
      json({
        id,
        name: p.name,
        description: p.description,
        version: VERSION,
        minAppVersion: MIN,
        thumbnail: 'thumbnail.svg',
        lineArt: 'lineart.svg',
        regions: 'regions.json',
        difficulty: p.difficulty ?? 'easy'
      })
    );
    pageCount++;
  }
}

// Free Canvas
await put('books/free_canvas/cover.svg', covers.free_canvas);
await put(
  'books/free_canvas/book_manifest.json',
  json({
    id: 'free_canvas',
    name: 'Free Canvas',
    description: 'A blank canvas for drawing anything, on a soft pastel background.',
    cover: 'cover.svg',
    version: VERSION,
    minAppVersion: MIN,
    kind: 'free_canvas',
    accent: '#f49bbd',
    pages: [],
    backgrounds: [
      { id: 'white', name: 'Clean White', type: 'solid', colors: ['#ffffff'] },
      { id: 'warm_cream', name: 'Warm Cream', type: 'solid', colors: ['#fff6e6'] },
      { id: 'cloud_blue', name: 'Cloud Blue', type: 'gradient', colors: ['#d6ecfb', '#eaf5fd'] },
      { id: 'lavender', name: 'Lavender', type: 'gradient', colors: ['#e6dcfa', '#f3eefd'] },
      { id: 'mint', name: 'Mint', type: 'gradient', colors: ['#d4f1e3', '#eaf8f1'] },
      { id: 'pastel_pink', name: 'Pastel Pink', type: 'gradient', colors: ['#ffdce8', '#fff0f5'] },
      { id: 'starry_sky', name: 'Starry Sky', type: 'stars', colors: ['#6f74b8', '#8f88cc', '#b59ad8'] },
      { id: 'soft_clouds', name: 'Soft Clouds', type: 'clouds', colors: ['#a9d6f3', '#d6ecfa', '#f3f9fd'] }
    ]
  })
);

// Palettes
for (const p of palettes) {
  await put(`palettes/${p.id}.json`, json({ ...p, version: VERSION, minAppVersion: MIN }));
}

// Pastel Breaker levels
for (const l of breakerLevels) {
  const dir = `minigames/pastel_breaker/levels/${l.folder}`;
  await put(`${dir}/thumbnail.svg`, l.thumbnail);
  await put(`${dir}/level.json`, json(l.manifest(VERSION, MIN)));
}

// Splash Wall levels
for (const l of splashLevels) {
  const dir = `minigames/splash_wall/levels/${l.folder}`;
  await put(`${dir}/wall.svg`, l.scene.svg('line'));
  await put(`${dir}/thumbnail.svg`, l.scene.svg('color'));
  await put(`${dir}/level.json`, json(l.manifest(VERSION, MIN)));
}

console.log(`Generated ${books.length + 1} books, ${pageCount} coloring pages, ${palettes.length} palettes, ${breakerLevels.length} Pastel Breaker levels, ${splashLevels.length} Splash Wall levels.`);
