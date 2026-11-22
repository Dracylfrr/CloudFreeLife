// Renders the master icon SVG to PNG and lets the Tauri CLI produce every
// platform icon (ico, png sizes) from it.
//   npm run icons
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(resolve(root, 'assets/icons/cloud-freelife.svg'));

await mkdir(resolve(root, 'assets/icons'), { recursive: true });
const png = resolve(root, 'assets/icons/icon-1024.png');
await sharp(svg, { density: 384 }).resize(1024, 1024).png().toFile(png);
await sharp(svg, { density: 96 }).resize(64, 64).png().toFile(resolve(root, 'public/favicon.png'));
console.log('rendered', png);

const r = spawnSync('npx', ['tauri', 'icon', png, '-o', resolve(root, 'src-tauri/icons')], {
  cwd: root,
  stdio: 'inherit',
  shell: true
});
process.exit(r.status ?? 0);
