// Shared helpers for building cloud-freelife-release.json, the manifest that
// every GitHub Release carries so the app can verify what it downloads.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const MANIFEST_NAME = 'cloud-freelife-release.json';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function loadManifest(dir, release) {
  try {
    return JSON.parse(await readFile(resolve(dir, MANIFEST_NAME), 'utf8'));
  } catch {
    return { schema: 1, release, content: [] };
  }
}

export async function saveManifest(dir, manifest) {
  await writeFile(resolve(dir, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

export function upsertContent(manifest, entry) {
  manifest.content = (manifest.content ?? []).filter((c) => c.id !== entry.id);
  manifest.content.push(entry);
  return manifest;
}
