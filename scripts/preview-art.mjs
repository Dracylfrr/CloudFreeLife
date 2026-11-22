// Renders a contact sheet of scene pages for quick visual review.
//   node scripts/preview-art.mjs <out.png> <cloud|cosmic|peaceful|splash> [line|color]
import sharp from 'sharp';

const [out, which = 'cloud', mode = 'color'] = process.argv.slice(2);
const mods = {
  cloud: async () => (await import('./art/pages_cloud.mjs')).cloudPages.map((p) => p.scene()),
  cosmic: async () => (await import('./art/pages_cosmic.mjs')).cosmicPages.map((p) => p.scene()),
  peaceful: async () => (await import('./art/pages_peaceful.mjs')).peacefulPages.map((p) => p.scene()),
  splash: async () => (await import('./art/levels_splash.mjs')).splashLevels.map((l) => l.scene)
};
const scenes = await mods[which]();
const W = 640;
const H = 480;
const cols = 2;
const rows = Math.ceil(scenes.length / cols);
const tiles = [];
for (const [i, s] of scenes.entries()) {
  const png = await sharp(Buffer.from(s.svg(mode)), { density: 96 }).resize(W, H).png().toBuffer();
  tiles.push({ input: png, left: (i % cols) * W, top: Math.floor(i / cols) * H });
}
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: '#ffffff' } }).composite(tiles).png().toFile(out);
console.log('wrote', out, scenes.length, 'scenes');
