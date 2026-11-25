// Collects the Windows build into ./release, ready to attach to a GitHub Release:
//   - Cloud-Freelife_<version>_x64-setup.exe   (the installer, under the file name every older version
//                                              looks for when it updates itself: do not rename)
//   - Project-DREAM_<version>_x64-setup.exe    (the very same installer under the app's real name,
//                                              for people downloading by hand)
//   - Project-DREAM_<version>_x64-portable.zip (just the exe; run from anywhere)
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
const PRODUCT = 'Project D.R.E.A.M'; // tauri.conf.json productName: the program and the installer tauri makes
const installerName = `Cloud-Freelife_${v}_x64-setup.exe`; // what older versions download: it MUST keep this name
const friendlyName = `Project-DREAM_${v}_x64-setup.exe`;
const portableName = `Project-DREAM_${v}_x64-portable.zip`;
const installer = resolve(bundle, 'bundle/nsis', `${PRODUCT}_${v}_x64-setup.exe`);
const exe = resolve(bundle, `${PRODUCT}.exe`);

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
await copyFile(installer, resolve(out, friendlyName));
await copyFile(exe, resolve(out, `portable/${PRODUCT}.exe`));
await writeFile(
  resolve(out, 'portable/README.txt'),
  `${PRODUCT} ${v} (portable)\n\nRun ${PRODUCT}.exe from any folder. It needs the Microsoft WebView2 runtime,\nwhich is already part of Windows 11 and up-to-date Windows 10.\n\nYour artwork and settings are stored in %APPDATA%\\${PRODUCT}, never next to the exe.\n`
);
const zip = resolve(out, portableName);
const r = spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${resolve(out, 'portable')}\\*' -DestinationPath '${zip}' -Force`], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);
await rm(resolve(out, 'portable'), { recursive: true, force: true });

const bytes = await readFile(resolve(out, installerName));
const manifest = await loadManifest(out, v);
manifest.release = v;
try {
  const headline = (await readFile(resolve(root, 'docs/RELEASE_HEADLINE.txt'), 'utf8')).trim();
  if (headline) manifest.headline = headline.slice(0, 90); // shown in the update notice
} catch {
  /* optional */
}
// Release notes shown in the Update Center: the CHANGELOG section for this version.
try {
  const log = (await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')).replace(/\r\n/g, '\n'); // Windows checkouts use CRLF
  const start = log.indexOf(`## [${v}]`);
  if (start >= 0) {
    const rest = log.slice(start + 1);
    const next = rest.indexOf('\n## [');
    const body = (next >= 0 ? rest.slice(0, next) : rest).replace(/^#.*\n/, '').replace(/^### .*$/gm, '').replace(/\n{2,}/g, '\n').trim();
    manifest.notes = body.slice(0, 1500);
  }
} catch {
  /* notes are optional */
}
manifest.app = {
  version: v,
  asset: { name: installerName, sha256: sha256(bytes), size: bytes.length, contentType: 'application/octet-stream' }
};
await saveManifest(out, manifest);

const sums = [];
for (const f of [installerName, friendlyName, portableName, 'cloud-freelife-release.json']) sums.push(`${sha256(await readFile(resolve(out, f)))}  ${f}`);
await writeFile(resolve(out, 'SHA256SUMS.txt'), sums.join('\n') + '\n');

console.log(`\nRelease files for v${v} are in ${out}:`);
for (const s of sums) console.log('  ' + s);
console.log(`\nCreate a GitHub Release tagged v${v} and attach every file in that folder.`);
