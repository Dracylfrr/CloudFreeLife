// Packs a folder of content into a .cfpack file and adds it to the release manifest.
//
//   node scripts/pack-content.mjs <sourceDir> --id castle_dreams --version 1.0.0 \
//        --name "Castle Dreams" --kind book [--description "..."] [--min-app 1.0.0] [--out release]
//
// <sourceDir> has the same layout as the app's content/ folder, for example:
//   <sourceDir>/books/castle_dreams/book_manifest.json
//   <sourceDir>/books/castle_dreams/pages/01_gate/...
//
// Output: <out>/<id>_v<version>.cfpack and <out>/cloud-freelife-release.json
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { loadManifest, saveManifest, sha256, upsertContent } from './lib/release-manifest.mjs';

const args = process.argv.slice(2);
const src = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
if (!src || args.includes('--help')) {
  console.log('Usage: node scripts/pack-content.mjs <sourceDir> --id <id> --version <x.y.z> --name "<Name>" --kind <book|palettes|breaker_levels|splash_levels|memory_levels|puzzle_levels|stories|adventures> [--description "..."] [--min-app 1.0.0] [--out release]');
  process.exit(src ? 0 : 1);
}

const id = opt('id');
const version = opt('version');
const name = opt('name');
const kind = opt('kind', 'book');
const minApp = opt('min-app', '1.0.0');
const description = opt('description', '');
const out = resolve(opt('out', 'release'));
if (!id || !version || !name) {
  console.error('--id, --version and --name are required');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9_]*$/.test(id)) throw new Error('--id must be lowercase letters, digits and underscores');
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('--version must look like 1.0.0');

const allowed = [/^books\/[a-z0-9_]+\//, /^palettes\/[a-z0-9_]+\.json$/, /^minigames\/(pastel_breaker|splash_wall|memory_meadow|pastel_puzzle)\/levels\/[a-z0-9_]+\//, /^stories\/(relaxing|adventures)\/[a-z0-9_]+\//];
const exts = ['.json', '.svg', '.png', '.webp'];

async function walk(dir) {
  const files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

const root = resolve(src);
const files = {};
for (const file of await walk(root)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (!exts.some((x) => rel.endsWith(x))) {
    console.warn(`skipping ${rel} (only .json, .svg, .png and .webp are allowed)`);
    continue;
  }
  if (!allowed.some((re) => re.test(rel))) throw new Error(`"${rel}" is outside the content folders a pack may contain`);
  const bytes = await readFile(file);
  files[rel] = (rel.endsWith('.png') || rel.endsWith('.webp')) ? { encoding: 'base64', data: bytes.toString('base64') } : { encoding: 'utf8', data: bytes.toString('utf8') };
}
if (!Object.keys(files).length) throw new Error('No files found to pack');

const pack = { format: 1, kind, id, name, version, minAppVersion: minApp, files };
const bytes = Buffer.from(JSON.stringify(pack), 'utf8');
const assetName = `${id}_v${version}.cfpack`;
await mkdir(out, { recursive: true });
await writeFile(resolve(out, assetName), bytes);

const manifest = await loadManifest(out, version);
upsertContent(manifest, {
  type: kind,
  id,
  name,
  description,
  version,
  minAppVersion: minApp,
  asset: { name: assetName, sha256: sha256(bytes), size: bytes.length, contentType: 'application/octet-stream' }
});
await saveManifest(out, manifest);

console.log(`Packed ${Object.keys(files).length} files into ${resolve(out, assetName)}`);
console.log(`  size   ${bytes.length} bytes`);
console.log(`  sha256 ${sha256(bytes)}`);
console.log(`Release manifest updated: ${resolve(out, 'cloud-freelife-release.json')}`);
console.log(`Publish with a GitHub Release tagged ${id}_v${version} and attach BOTH files.`);
void dirname;
