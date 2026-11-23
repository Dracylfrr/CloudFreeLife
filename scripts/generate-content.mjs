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
import { covers as baseCovers } from './art/covers.mjs';
import { covers13 } from './art/covers_v13.mjs';
import { mountainPages, nightPages, farmPages } from './art/pages_v13.mjs';
import { palettes } from './art/palettes.mjs';
import { breakerLevels } from './art/levels_breaker.mjs';
import { splashLevels } from './art/levels_splash.mjs';
import { castlePages } from './art/pages_castle.mjs';
import { oceanPages } from './art/pages_ocean.mjs';
import { memoryLevels } from './art/levels_memory.mjs';
import { treatsPages } from './art/pages_treats.mjs';
import { forestPages } from './art/pages_forest.mjs';
import { puzzleLevels } from './art/levels_puzzle.mjs';
import { extraPages } from './art/pages_extra.mjs';
import { relaxing } from './stories/relaxing.mjs';
import { adventures } from './stories/adventures.mjs';
import { adventuresNew } from './stories/adventures_new.mjs';
import { meditationSessions } from './wellness/meditation.mjs';
import { bubbleLevels, catcherLevels, zenLevels, flowLevels } from './games/relaxing.mjs';
import { movementCards } from './wellness/movement.mjs';
import { storyCovers as oldCovers } from './stories/covers.mjs';
import { relaxingNew } from './stories/relaxing_new.mjs';
import { existing as existingArt } from './stories/art_existing.mjs';
import { newCovers, newIllustrations } from './stories/art_new.mjs';

const storyCovers = { ...oldCovers, ...newCovers };
// 1.3: stories gained pictures; story and chapter pictures are plain SVG next to story.json.
const NEW_VERSION = '1.3.0';

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

// 1.2 added more pages to four existing books; those pages need app 1.2.0.
const withExtra = (id, pages) => [...pages, ...(extraPages[id] ?? []).map((p) => ({ ...p, minApp: '1.2.0' }))];

const covers = { ...baseCovers, ...covers13 };

const books = [
  {
    id: 'cloud_dreams',
    name: 'Cloud Dreams',
    description: 'Clouds, castles in the sky, floating islands, balloons, rainbows and sunsets.',
    accent: '#8fc7ec',
    order: 1,
    pages: cloudPages
  },
  {
    id: 'cosmic_colors',
    name: 'Cosmic Colors',
    description: 'Gentle stars, planets, moons, galaxies, nebulae and comets.',
    accent: '#a698e0',
    order: 2,
    pages: cosmicPages
  },
  {
    id: 'peaceful_places',
    name: 'Peaceful Places',
    description: 'Beaches, meadows, mountains, forests, lakes and cozy cottages.',
    accent: '#8ed2b2',
    order: 3,
    pages: peacefulPages
  },
  {
    id: 'castle_dreams',
    name: 'Castle Dreams',
    description: 'Towers, drawbridges, a very gentle dragon, a unicorn and swans on the moat.',
    accent: '#c9a8e8',
    order: 4,
    minApp: '1.1.0',
    pages: withExtra('castle_dreams', castlePages)
  },
  {
    id: 'ocean_friends',
    name: 'Ocean Friends',
    description: 'Whales, octopuses, turtles, dolphins, jellyfish and fish in a calm blue sea.',
    accent: '#7fcfe0',
    order: 5,
    minApp: '1.1.0',
    pages: withExtra('ocean_friends', oceanPages)
  },
  {
    id: 'sweet_treats',
    name: 'Sweet Treats',
    description: 'Cupcakes, tea parties, a bakery, an ice cream cart, donuts and a birthday cake.',
    accent: '#f49bbd',
    order: 6,
    minApp: '1.1.1',
    pages: withExtra('sweet_treats', treatsPages)
  },
  {
    id: 'forest_friends',
    name: 'Forest Friends',
    description: 'A sleepy bear, a clever fox, a bunny, an owl, a hedgehog, a deer and a squirrel.',
    accent: '#8ed2b2',
    order: 7,
    minApp: '1.1.1',
    pages: withExtra('forest_friends', forestPages)
  },
  {
    id: 'mountain_village',
    name: 'Mountain Village',
    description: 'A cabin, a little train, a hilltop bakery, a snowy path, a quiet lake and a sunset village.',
    accent: '#a9c8ee',
    order: 8,
    minApp: '1.3.0',
    pages: mountainPages
  },
  {
    id: 'night_garden',
    name: 'Night Garden',
    description: 'Moonflowers, fireflies, an owl tree, a lantern path and a starry greenhouse.',
    accent: '#9a95d6',
    order: 9,
    minApp: '1.3.0',
    pages: nightPages
  },
  {
    id: 'happy_farm',
    name: 'Happy Farm',
    description: 'A farmhouse, barn friends, a tractor, a vegetable garden, an orchard and a sunrise.',
    accent: '#f7c78a',
    order: 10,
    minApp: '1.3.0',
    pages: farmPages
  }
];

// start clean so removed pages never linger
await rm(resolve(content, 'books'), { recursive: true, force: true });
await rm(resolve(content, 'palettes'), { recursive: true, force: true });
await rm(resolve(content, 'minigames'), { recursive: true, force: true });
await rm(resolve(content, 'stories'), { recursive: true, force: true });
await rm(resolve(content, 'meditation'), { recursive: true, force: true });
await rm(resolve(content, 'movement'), { recursive: true, force: true });

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
      minAppVersion: b.minApp ?? MIN,
      kind: 'coloring',
      accent: b.accent,
      order: b.order,
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
        minAppVersion: p.minApp ?? b.minApp ?? MIN,
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
    order: 11,
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
  await put(`palettes/${p.id}.json`, json({ ...p, version: VERSION, minAppVersion: p.minAppVersion ?? MIN }));
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

// Memory Meadow levels
for (const l of memoryLevels) {
  const dir = `minigames/memory_meadow/levels/${l.folder}`;
  await put(`${dir}/thumbnail.svg`, l.thumbnail);
  await put(`${dir}/level.json`, json(l.manifest(VERSION)));
}

// Pastel Puzzle levels
for (const l of puzzleLevels) {
  const dir = `minigames/pastel_puzzle/levels/${l.folder}`;
  await put(`${dir}/picture.svg`, l.picture);
  await put(`${dir}/level.json`, json(l.manifest(VERSION)));
}


// Cozy Stories and Story Adventures (new in 1.2)
const STORY_VERSION = '1.2.0';
const allStories = [...relaxing.map((st) => ({ ...st, isNew: false })), ...relaxingNew.map((st) => ({ ...st, isNew: true }))];
for (const [i, st] of allStories.entries()) {
  const dir = `stories/relaxing/${st.id}`;
  await put(`${dir}/cover.svg`, storyCovers[st.cover]);
  // Pictures: the original six get one per chapter (generated), new stories bring their own.
  const art = st.isNew ? (newIllustrations[st.id] ?? {}) : Object.fromEntries((existingArt[st.id] ?? []).map((a, k) => [`ch${k + 1}.svg`, a.svg]));
  const chapters = st.chapters.map((c, k) => {
    if (st.isNew) {
      if (c.illustration && !art[c.illustration]) throw new Error(`${st.id}: missing art ${c.illustration}`);
      return c;
    }
    const a = (existingArt[st.id] ?? [])[k];
    return a ? { ...c, illustration: `ch${k + 1}.svg`, illustrationAlt: a.alt, illustrationCaption: a.caption } : c;
  });
  for (const [file, svg] of Object.entries(art)) await put(`${dir}/${file}`, svg);
  await put(
    `${dir}/story.json`,
    json({
      id: st.id,
      name: st.name,
      description: st.description,
      version: NEW_VERSION,
      minAppVersion: st.isNew ? NEW_VERSION : STORY_VERSION,
      cover: 'cover.svg',
      accent: st.accent,
      mood: st.mood,
      ...(st.minutes ? { minutes: st.minutes } : {}),
      order: i + 1,
      chapters
    })
  );
}
const allAdventures = [...adventures.map((a) => ({ ...a, isNew: false })), ...adventuresNew.map((a) => ({ ...a, isNew: true }))];
for (const [i, ad] of allAdventures.entries()) {
  const dir = `stories/adventures/${ad.id}`;
  const nodes = {};
  for (const [nid, n] of Object.entries(ad.nodes)) {
    nodes[nid] = n.end ? { text: n.t, ending: { title: n.end[0], mood: n.end[1] } } : { text: n.t, choices: n.c.map(([text, to]) => ({ text, to })) };
  }
  await put(`${dir}/cover.svg`, storyCovers[ad.cover]);
  await put(
    `${dir}/adventure.json`,
    json({
      id: ad.id,
      name: ad.name,
      description: ad.description,
      version: ad.isNew ? NEW_VERSION : STORY_VERSION,
      minAppVersion: ad.isNew ? NEW_VERSION : STORY_VERSION,
      cover: 'cover.svg',
      accent: ad.accent,
      genre: ad.genre,
      protagonist: ad.protagonist,
      ...(ad.interest ? { interest: ad.interest } : {}),
      hero: ad.hero,
      minutes: ad.minutes,
      order: i + 1,
      start: ad.start,
      nodes
    })
  );
}

// The four relaxing mini-games (new in 1.4)
const V14 = '1.4.0';
const gameLevel = async (game, key, l, extra) => {
  const dir = `minigames/${game}/levels/${l.folder}`;
  await put(`${dir}/thumbnail.svg`, l.thumbnail);
  await put(`${dir}/level.json`, json({ id: l.id, name: l.name, description: l.description, minigame: key, thumbnail: 'thumbnail.svg', version: V14, minAppVersion: V14, objective: l.objective, ...extra(l) }));
};
for (const l of bubbleLevels) await gameLevel('bubble_garden', 'bubble_garden', l, (x) => ({ palette: x.palette, sky: x.sky, scenery: x.scenery, spawn: x.spawn, speed: x.speed, size: x.size, rounds: x.rounds }));
for (const l of catcherLevels) await gameLevel('cloud_catcher', 'cloud_catcher', l, (x) => ({ kinds: x.kinds, colors: x.colors, zones: x.zones, spawn: x.spawn, speed: x.speed, sky: x.sky, scenery: x.scenery, pattern: x.pattern }));
for (const l of zenLevels) await gameLevel('zen_garden', 'zen_garden', l, (x) => ({ ground: x.ground, groove: x.groove, light: x.light, scenery: x.scenery }));
for (const l of flowLevels) await gameLevel('paint_flow', 'paint_flow', l, (x) => ({ size: x.size, pairs: x.pairs, solution: x.solution }));

// Meditation sessions and Gentle Movement cards (new in 1.4)
for (const m of meditationSessions) {
  const dir = `meditation/${m.id}`;
  await put(`${dir}/cover.svg`, m.cover);
  const { cover, ...rest } = m;
  await put(`${dir}/session.json`, json({ ...rest, version: V14, minAppVersion: V14, cover: 'cover.svg' }));
}
for (const c of movementCards) {
  const dir = `movement/${c.id}`;
  await put(`${dir}/cover.svg`, c.cover);
  const { cover, ...rest } = c;
  await put(`${dir}/card.json`, json({ ...rest, version: V14, minAppVersion: V14, cover: 'cover.svg' }));
}

console.log(`Generated ${books.length + 1} books, ${pageCount} coloring pages, ${palettes.length} palettes, ${breakerLevels.length} Pastel Breaker levels, ${splashLevels.length} Splash Wall levels, ${memoryLevels.length} Memory Meadow levels, ${puzzleLevels.length} Pastel Puzzle levels, ${allStories.length} cozy stories and ${allAdventures.length} story adventures, ${meditationSessions.length} meditation sessions and ${movementCards.length} movement cards, plus ${bubbleLevels.length} Bubble Garden, ${catcherLevels.length} Cloud Catcher, ${zenLevels.length} Zen Garden and ${flowLevels.length} Paint Flow levels.`);
