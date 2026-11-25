// The author's tool for premium content. Run it on your own computer, never in the app.
//
//   node scripts/dlc.mjs keygen                              make the license signing key (once) and show its public half
//   node scripts/dlc.mjs pack <sourceDir> --id lantern_lane --version 1.0.0 --name "Lantern Lane" --kind stories \
//        [--description "..."] [--min-app 1.8.0] [--out release]
//                                                            encrypt a folder of content into <id>_v<version>.dreampack
//   node scripts/dlc.mjs license --id friend-01 --packs lantern_lane,sky_post [--expires 2027-12-31] [--out my.dreamlicense]
//   node scripts/dlc.mjs license --id all-2026 --all         a license for every pack you have packed so far
//   node scripts/dlc.mjs verify my.dreamlicense              check a license against your public key
//   node scripts/dlc.mjs list                                packs and keys you hold
//
// Secrets live in your home folder (~/.dream-dlc): the license signing key and one key per pack.
// They are never written into the project folder. Back that folder up; if the signing key is lost,
// no new license can be made for the app that is already out there.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptPack, makeLicense, newKey, publicKeyBytes, rustBytes, verifyLicense } from './dlc/lib.mjs';
import { loadManifest, saveManifest, upsertContent } from './lib/release-manifest.mjs';

const HOME = process.env.DREAM_DLC_HOME ? resolve(process.env.DREAM_DLC_HOME) : join(homedir(), '.dream-dlc');
const PRIVATE = join(HOME, 'license-private.pem');
const PUBLIC = join(HOME, 'license-public.pem');
const KEYS = join(HOME, 'pack-keys.json');

const [cmd, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const fail = (m) => {
  console.error(m);
  process.exit(1);
};
const readKeys = () => (existsSync(KEYS) ? JSON.parse(readFileSync(KEYS, 'utf8')) : {});
const today = () => new Date().toISOString().slice(0, 10);

if (cmd === 'keygen') {
  mkdirSync(HOME, { recursive: true });
  if (existsSync(PRIVATE)) {
    console.log(`A signing key already exists in ${HOME}. Not replacing it.`);
  } else {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    writeFileSync(PRIVATE, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    writeFileSync(PUBLIC, publicKey.export({ type: 'spki', format: 'pem' }));
    if (!existsSync(KEYS)) writeFileSync(KEYS, '{}\n', { mode: 0o600 });
    console.log(`Made a new signing key in ${HOME}. BACK THIS FOLDER UP and never put it in a repository.`);
  }
  const pub = publicKeyBytes(readFileSync(PUBLIC, 'utf8'));
  console.log('Public key (for src-tauri/src/premium.rs):');
  console.log(`const LICENSE_PUBLIC_KEY: [u8; 32] = [${rustBytes(pub)}];`);
} else if (cmd === 'pack') {
  const src = rest[0];
  const id = opt('id');
  const version = opt('version');
  const name = opt('name');
  const kind = opt('kind', 'stories');
  const minApp = opt('min-app', '1.8.0');
  const description = opt('description', '');
  const out = resolve(opt('out', 'release'));
  if (!src || !id || !version || !name) fail('Usage: node scripts/dlc.mjs pack <sourceDir> --id <id> --version <x.y.z> --name "<Name>" --kind <kind>');
  mkdirSync(HOME, { recursive: true });
  // 1. the ordinary pack, built by the ordinary tool into a throwaway folder
  const tmp = mkdtempSync(join(tmpdir(), 'dreampack-'));
  const here = fileURLToPath(new URL('.', import.meta.url));
  const r = spawnSync(process.execPath, [join(here, 'pack-content.mjs'), src, '--id', id, '--version', version, '--name', name, '--kind', kind, '--min-app', minApp, '--description', description, '--out', tmp], { encoding: 'utf8' });
  if (r.status !== 0) {
    rmSync(tmp, { recursive: true, force: true });
    fail(r.stderr || r.stdout || 'pack-content failed');
  }
  const plain = readFileSync(join(tmp, `${id}_v${version}.cfpack`));
  rmSync(tmp, { recursive: true, force: true });
  // 2. one key per pack, made the first time and kept, so older licenses still open newer versions
  const keys = readKeys();
  if (!keys[id]) keys[id] = newKey().toString('base64');
  writeFileSync(KEYS, JSON.stringify(keys, null, 2) + '\n', { mode: 0o600 });
  // 3. encrypt, and add it to the release manifest as a premium pack
  const text = encryptPack(plain, { id, name, kind, version, minAppVersion: minApp, description }, Buffer.from(keys[id], 'base64'));
  const bytes = Buffer.from(text, 'utf8');
  mkdirSync(out, { recursive: true });
  const assetName = `${id}_v${version}.dreampack`;
  writeFileSync(join(out, assetName), bytes);
  const manifest = await loadManifest(out, version);
  upsertContent(manifest, {
    type: kind,
    id,
    name,
    description,
    version,
    minAppVersion: minApp,
    premium: true,
    asset: { name: assetName, sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length, contentType: 'application/octet-stream' }
  });
  await saveManifest(out, manifest);
  console.log(`Encrypted ${assetName} (${bytes.length} bytes). Publish a release tagged ${id}_v${version} with it and cloud-freelife-release.json.`);
} else if (cmd === 'license') {
  if (!existsSync(PRIVATE)) fail('No signing key yet. Run: node scripts/dlc.mjs keygen');
  const keys = readKeys();
  const wanted = rest.includes('--all') ? Object.keys(keys) : (opt('packs', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const id = opt('id');
  if (!id || wanted.length === 0) fail('Usage: node scripts/dlc.mjs license --id <name> (--packs a,b | --all) [--expires 2027-12-31] [--out file]');
  for (const w of wanted) if (!keys[w]) fail(`No key for "${w}". Pack it first.`);
  const lic = makeLicense({ id, issued: today(), expires: opt('expires', null), packs: wanted.map((w) => ({ id: w, key: keys[w] })) }, readFileSync(PRIVATE, 'utf8'));
  const file = resolve(opt('out', `${id}.dreamlicense`));
  writeFileSync(file, JSON.stringify(lic, null, 2) + '\n');
  console.log(`Wrote ${file} for: ${wanted.join(', ')}${lic.expires ? ` (expires ${lic.expires})` : ''}`);
} else if (cmd === 'verify') {
  if (!rest[0]) fail('Usage: node scripts/dlc.mjs verify <file>');
  const lic = JSON.parse(readFileSync(resolve(rest[0]), 'utf8'));
  const ok = verifyLicense(lic, readFileSync(PUBLIC, 'utf8'));
  console.log(ok ? `Valid. ${lic.id}: ${lic.packs.map((p) => p.id).join(', ')}` : 'NOT valid.');
  process.exit(ok ? 0 : 1);
} else if (cmd === 'list') {
  console.log(Object.keys(readKeys()).join('\n') || '(no packs yet)');
} else {
  console.log('Commands: keygen, pack, license, verify, list. See the top of scripts/dlc.mjs.');
  process.exit(cmd ? 1 : 0);
}
