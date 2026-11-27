/**
 * Recorded stories: ready-made audio of every story in each voice, made once and downloaded per story or all at
 * once. Nothing is made on this computer, so it starts at once, uses almost no power and works offline.
 *
 * Each voice has its own release on the project's GitHub page (tag `voices_<word>`) holding one file per story
 * (`<word>.<story>.dvp`) and a list, `voicepacks.json`, with every file's size and checksum. A file is only kept
 * when it matches that checksum.
 */
import { GITHUB_REPO } from '../../core/config';
import { getStorage } from '../../core/storage';
import { digestsEqual, sha256Hex } from '../updates/checksum';
import { defaultHttpGet, type HttpGet } from '../updates/http';
import { isTrustedDownloadUrl } from '../updates/release';
import type { Voice } from './casts';
import { parsePack, type Pack } from './packfile';

export const PACK_DIR = 'voicepacks';
export const MANIFEST_ASSET = 'voicepacks.json';
export const MAX_PACK_BYTES = 40 * 1024 * 1024;

export interface PackEntry {
  asset: string;
  sha256: string;
  size: number;
  seconds: number;
}
export interface PackManifest {
  v: 1;
  stories: Record<string, PackEntry>;
}

export const packTag = (v: Pick<Voice, 'pack'>) => `voices_${v.pack}`;
export const packUrl = (v: Pick<Voice, 'pack'>, asset: string) => `https://github.com/${GITHUB_REPO}/releases/download/${packTag(v)}/${asset}`;
const packPath = (v: Pick<Voice, 'pack'>, story: string) => `${PACK_DIR}/${v.pack}/${story}.dvp`;
const indexPath = (v: Pick<Voice, 'pack'>) => `${PACK_DIR}/${v.pack}/index.json`;
const STORY_ID = /^[a-z0-9][a-z0-9_]{0,63}$/;

/** Reads the list of recordings, trusting nothing in it. */
export function parseManifest(raw: unknown): PackManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1 || !r.stories || typeof r.stories !== 'object') return null;
  const stories: Record<string, PackEntry> = {};
  let n = 0;
  for (const [id, e] of Object.entries(r.stories as Record<string, unknown>)) {
    if (!STORY_ID.test(id) || ++n > 400 || !e || typeof e !== 'object') continue;
    const { asset, sha256, size, seconds } = e as Record<string, unknown>;
    if (typeof asset !== 'string' || !/^[a-z0-9_.-]{1,120}\.dvp$/.test(asset)) continue;
    if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sha256)) continue;
    if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > MAX_PACK_BYTES) continue;
    stories[id] = { asset, sha256, size, seconds: typeof seconds === 'number' && Number.isFinite(seconds) ? seconds : 0 };
  }
  return { v: 1, stories };
}

export type ManifestResult = { ok: true; manifest: PackManifest } | { ok: false; reason: 'missing' | 'offline' | 'bad' };

export async function fetchManifest(voice: Pick<Voice, 'pack'>, get: HttpGet = defaultHttpGet): Promise<ManifestResult> {
  const url = packUrl(voice, MANIFEST_ASSET);
  if (!isTrustedDownloadUrl(url, packTag(voice), MANIFEST_ASSET)) return { ok: false, reason: 'bad' };
  try {
    const res = await get(url, { accept: 'application/json', maxBytes: 512 * 1024, timeoutMs: 15000 });
    if (res.status === 404) return { ok: false, reason: 'missing' };
    if (res.status !== 200) return { ok: false, reason: 'offline' };
    const manifest = parseManifest(JSON.parse(new TextDecoder().decode(res.bytes)));
    return manifest ? { ok: true, manifest } : { ok: false, reason: 'bad' };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}

// ------------------------------------------------------------------ what is on this computer

type Index = Record<string, string>; // story -> checksum of the file kept

async function readIndex(voice: Pick<Voice, 'pack'>): Promise<Index> {
  try {
    const text = await (await getStorage()).readText(indexPath(voice));
    const raw = text ? JSON.parse(text) : {};
    const out: Index = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (STORY_ID.test(k) && typeof v === 'string' && /^[0-9a-f]{64}$/.test(v)) out[k] = v;
    return out;
  } catch {
    return {};
  }
}
async function writeIndex(voice: Pick<Voice, 'pack'>, index: Index) {
  await (await getStorage()).writeText(indexPath(voice), JSON.stringify(index));
}

/** The stories recorded in this voice that are on this computer, with the checksum of each. */
export async function installedPacks(voice: Pick<Voice, 'pack'>): Promise<Index> {
  const st = await getStorage();
  const index = await readIndex(voice);
  const out: Index = {};
  for (const story of Object.keys(index)) if (await st.exists(packPath(voice, story))) out[story] = index[story];
  return out;
}

export async function hasPack(voice: Pick<Voice, 'pack'>, story: string): Promise<boolean> {
  if (!STORY_ID.test(story)) return false;
  try {
    return await (await getStorage()).exists(packPath(voice, story));
  } catch {
    return false;
  }
}

const cache = new Map<string, Pack>();

/** A story's recording, ready to play (null when it is not here or the file is damaged). */
export async function loadPack(voice: Pick<Voice, 'pack'>, story: string): Promise<Pack | null> {
  if (!STORY_ID.test(story)) return null;
  const key = `${voice.pack}/${story}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const bytes = await (await getStorage()).readBytes(packPath(voice, story));
    const pack = bytes ? parsePack(bytes) : null;
    if (!pack || pack.header.story !== story) return null;
    if (cache.size >= 4) cache.delete(cache.keys().next().value as string);
    cache.set(key, pack);
    return pack;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ downloading and removing

export type PackResult = { ok: true; count: number } | { ok: false; message: string };

async function fetchOne(voice: Voice, story: string, e: PackEntry, get: HttpGet, onBytes: (n: number) => void): Promise<string | null> {
  const url = packUrl(voice, e.asset);
  if (!isTrustedDownloadUrl(url, packTag(voice), e.asset)) return 'The download address was not trusted.';
  let res;
  try {
    res = await get(url, { accept: 'application/octet-stream', maxBytes: e.size + 1024, timeoutMs: 10 * 60 * 1000, onProgress: (d) => onBytes(d) });
  } catch {
    return 'The recordings could not be downloaded. Check your connection and try again; what was already downloaded is kept.';
  }
  if (res.status === 404) return 'This recording is not available to download yet.';
  if (res.status !== 200) return `The download failed (status ${res.status}).`;
  if (res.bytes.byteLength !== e.size) return 'A downloaded file was the wrong size and was thrown away.';
  if (!digestsEqual(await sha256Hex(res.bytes), e.sha256)) return 'A downloaded file did not match its checksum and was thrown away.';
  const pack = parsePack(res.bytes);
  if (!pack || pack.header.story !== story) return 'A downloaded file could not be read and was thrown away.';
  try {
    await (await getStorage()).writeBytes(packPath(voice, story), res.bytes);
  } catch {
    return 'The recording could not be saved.';
  }
  cache.delete(`${voice.pack}/${story}`);
  return null;
}

/**
 * Downloads some stories (the ones named, or all in the list) that are not here yet or have a newer recording,
 * one at a time. Safe to run again after a failure: what is already in place is not fetched twice.
 */
export async function downloadPacks(voice: Voice, manifest: PackManifest, only?: string[], onProgress: (doneBytes: number, totalBytes: number) => void = () => {}, get: HttpGet = defaultHttpGet): Promise<PackResult> {
  const have = await readIndex(voice);
  const wanted = (only ?? Object.keys(manifest.stories)).filter((s) => manifest.stories[s]);
  const todo: string[] = [];
  for (const s of wanted) if (have[s] !== manifest.stories[s].sha256 || !(await hasPack(voice, s))) todo.push(s);
  const total = todo.reduce((n, s) => n + manifest.stories[s].size, 0);
  let done = 0;
  onProgress(0, total);
  for (const s of todo) {
    const e = manifest.stories[s];
    const base = done;
    const err = await fetchOne(voice, s, e, get, (d) => onProgress(Math.min(total, base + d), total));
    if (err) return { ok: false, message: err };
    have[s] = e.sha256;
    await writeIndex(voice, have);
    done = base + e.size;
    onProgress(done, total);
  }
  return { ok: true, count: todo.length };
}

/** Removes one story's recording, or (with no story) every recording of the voice. */
export async function removePacks(voice: Pick<Voice, 'pack'>, story?: string): Promise<void> {
  const st = await getStorage();
  if (!story) {
    await st.remove(`${PACK_DIR}/${voice.pack}`);
    for (const k of [...cache.keys()]) if (k.startsWith(`${voice.pack}/`)) cache.delete(k);
    return;
  }
  if (!STORY_ID.test(story)) return;
  await st.remove(packPath(voice, story));
  cache.delete(`${voice.pack}/${story}`);
  const index = await readIndex(voice);
  delete index[story];
  await writeIndex(voice, index);
}

export const totalBytes = (m: PackManifest, stories?: string[]) => (stories ?? Object.keys(m.stories)).reduce((n, s) => n + (m.stories[s]?.size ?? 0), 0);
