// Collects the Windows build into ./release, ready to attach to a GitHub Release:
//   - Cloud-Freelife_<version>_x64-setup.exe   (installer, per-user, no admin needed)
//   - Cloud-Freelife_<version>_x64-portable.zip (just the exe; run from anywhere)
//   - cloud-freelife-release.json              (verified-update manifest)
//   - SHA256SUMS.txt
// Run `npm run tauri build` first.
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifest, saveManifest, sha256 } from './lib/release-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const v = pkg.version;
const out = resolve(root, 'release');
const bundle = resolve(root, 'src-tauri/target/release');
const installerName = `Cloud-Freelife_${v}_x64-setup.exe`;
const installer = resolve(bundle, 'bundle/nsis', installerName);
const exe = resolve(bundle, 'cloud-freelife.exe');

for (const f of [installer, exe]) {
  try {
    await stat(f);
  } catch {
    console.error(`Missing ${f}. Run "npm run tauri build" first.`);
    process.exit(1);
  }
}

await rm(out, { recursive: true, force: true });
await mkdir(resolve(out, 'portable'), { recursive: true });
await copyFile(installer, resolve(out, installerName));
await copyFile(exe, resolve(out, 'portable/Cloud-Freelife.exe'));
await writeFile(
  resolve(out, 'portable/README.txt'),
  `Cloud-Freelife ${v} (portable)\n\nRun Cloud-Freelife.exe from any folder. It needs the Microsoft WebView2 runtime,\nwhich is already part of Windows 11 and up-to-date Windows 10.\n\nYour artwork and settings are stored in %APPDATA%\\Cloud-Freelife, never next to the exe.\n`
);
const zip = resolve(out, `Cloud-Freelife_${v}_x64-portable.zip`);
const r = spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${resolve(out, 'portable')}\\*' -DestinationPath '${zip}' -Force`], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);
await rm(resolve(out, 'portable'), { recursive: true, force: true });

const bytes = await readFile(resolve(out, installerName));
const manifest = await loadManifest(out, v);
manifest.release = v;
manifest.app = {
  version: v,
  asset: { name: installerName, sha256: sha256(bytes), size: bytes.length, contentType: 'application/octet-stream' }
};
await saveManifest(out, manifest);

const sums = [];
for (const f of [installerName, `Cloud-Freelife_${v}_x64-portable.zip`, 'cloud-freelife-release.json']) sums.push(`${sha256(await readFile(resolve(out, f)))}  ${f}`);
await writeFile(resolve(out, 'SHA256SUMS.txt'), sums.join('\n') + '\n');

console.log(`\nRelease files for v${v} are in ${out}:`);
for (const s of sums) console.log('  ' + s);
console.log(`\nCreate a GitHub Release tagged v${v} and attach every file in that folder.`);
