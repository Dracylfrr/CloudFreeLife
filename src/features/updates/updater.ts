/**
 * Update orchestration. Talks to the official GitHub Releases page, never
 * blocks the app, never polls, and treats everything it receives as untrusted.
 */
import { get, writable } from 'svelte/store';
import { GITHUB_API_RELEASES, GITHUB_RELEASES_PAGE } from '../../core/config';
import { getCatalog, loadCatalog } from '../../core/content/registry';
import { getSettings, updateSettings } from '../../core/settings';
import { getStorage, isTauri } from '../../core/storage';
import { APP_VERSION } from '../../core/version';
import { toast } from '../../core/feedback';
import { sha256Hex } from './checksum';
import { httpGet, NetworkError } from './http';
import { installPack, listInstalledPacks, packAssetMatches, parsePack, verifyDownloadedAsset } from './packs';
import {
  ALLOWED_APP_TYPES,
  describeUpdate,
  findManifestAsset,
  isTrustedDownloadUrl,
  parseReleaseManifest,
  parseReleases,
  planFromManifest,
  releaseMayMatter,
  updateKey,
  type InstalledVersions,
  type UpdateItem
} from './release';

export type CheckOutcome = 'idle' | 'checking' | 'up_to_date' | 'available' | 'offline' | 'error';

export interface UpdateState {
  outcome: CheckOutcome;
  available: UpdateItem[];
  lastChecked: number;
  message: string;
  /** keys currently being downloaded/installed */
  busy: string[];
  /** Updates the user chose "Later" on during this run (so the toast does not return). */
  hidden: string[];
}

export const updateState = writable<UpdateState>({ outcome: 'idle', available: [], lastChecked: 0, message: '', busy: [], hidden: [] });

let checkedOnStartup = false;
let inFlight: Promise<UpdateState> | null = null;

async function installedVersions(): Promise<InstalledVersions> {
  const out: InstalledVersions = {};
  for (const b of getCatalog().books) out[b.manifest.id] = b.manifest.version;
  for (const p of getCatalog().palettes) out[p.manifest.id] = p.manifest.version;
  for (const l of getCatalog().breakerLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().splashLevels) out[l.manifest.id] = l.manifest.version;
  for (const r of await listInstalledPacks()) out[r.id] = out[r.id] && out[r.id]! > r.version ? out[r.id] : r.version;
  return out;
}

/** Core check. Pure with respect to the UI: returns what it found. */
export async function runUpdateCheck(appVersion: string = APP_VERSION): Promise<{ items: UpdateItem[]; outcome: CheckOutcome; message: string }> {
  let res;
  try {
    res = await httpGet(GITHUB_API_RELEASES, { accept: 'application/vnd.github+json', maxBytes: 3 * 1024 * 1024 });
  } catch (err) {
    const offline = err instanceof NetworkError ? err.offline : true;
    return { items: [], outcome: offline ? 'offline' : 'error', message: offline ? "Couldn't reach GitHub. You can keep using Cloud-Freelife offline." : (err as Error).message };
  }
  if (res.status === 404) return { items: [], outcome: 'up_to_date', message: 'No releases have been published yet.' };
  if (res.status === 403 || res.status === 429) return { items: [], outcome: 'error', message: 'GitHub is limiting requests right now. Please try again later.' };
  if (res.status < 200 || res.status >= 300) return { items: [], outcome: 'error', message: `GitHub answered with status ${res.status}.` };

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(res.bytes));
  } catch {
    return { items: [], outcome: 'error', message: 'GitHub sent a response that could not be read.' };
  }
  const releases = parseReleases(json);
  const installed = await installedVersions();
  const items: UpdateItem[] = [];
  let looked = 0;
  for (const rel of releases) {
    if (!releaseMayMatter(rel, appVersion, installed)) continue;
    if (++looked > 6) break;
    const manifestAsset = findManifestAsset(rel)!;
    if (!isTrustedDownloadUrl(manifestAsset.downloadUrl, rel.tag, manifestAsset.name)) continue;
    try {
      const m = await httpGet(manifestAsset.downloadUrl, { accept: 'application/json', maxBytes: 512 * 1024 });
      if (m.status !== 200) continue;
      const parsed = parseReleaseManifest(JSON.parse(new TextDecoder().decode(m.bytes)));
      if (!parsed.ok) {
        console.warn('Ignoring invalid release manifest', rel.tag, parsed.errors);
        continue;
      }
      items.push(...planFromManifest(parsed.value, rel, appVersion, installed));
    } catch (err) {
      console.warn('Could not read release manifest', rel.tag, err);
    }
  }
  // De-duplicate (newest version of anything wins).
  const seen = new Map<string, UpdateItem>();
  for (const it of items) {
    const k = it.kind === 'app' ? 'app' : `c:${it.id}`;
    const cur = seen.get(k);
    if (!cur || cur.version < it.version) seen.set(k, it);
  }
  const final = [...seen.values()].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'app' ? -1 : 1));
  return {
    items: final,
    outcome: final.length ? 'available' : 'up_to_date',
    message: final.length ? `${final.length} update${final.length === 1 ? '' : 's'} available` : "You're up to date."
  };
}

/** Manual or startup check; concurrent calls share one request. */
export function checkForUpdates(): Promise<UpdateState> {
  if (inFlight) return inFlight;
  updateState.update((s) => ({ ...s, outcome: 'checking', message: 'Checking GitHub…' }));
  inFlight = (async () => {
    try {
      const r = await runUpdateCheck();
      const now = Date.now();
      updateSettings({ lastUpdateCheck: now });
      updateState.update((s) => ({ ...s, outcome: r.outcome, available: r.items, message: r.message, lastChecked: now }));
    } catch (err) {
      updateState.update((s) => ({ ...s, outcome: 'error', message: String((err as Error).message ?? err) }));
    } finally {
      inFlight = null;
    }
    return get(updateState);
  })();
  return inFlight;
}

/** Called exactly once after the UI is up. Fire-and-forget; never awaited by startup. */
export function startupUpdateCheck(): void {
  if (checkedOnStartup) return;
  checkedOnStartup = true;
  if (!getSettings().checkUpdatesOnStartup) return;
  const run = () => void checkForUpdates();
  // Let the app paint and settle first.
  setTimeout(run, 2500);
}

/** "Later" / "View": hide the notification for everything currently available (they stay listed in the Update Center). */
export function hideForNow(_item?: UpdateItem) {
  const keys = get(updateState).available.map(updateKey);
  updateState.update((s) => ({ ...s, hidden: [...new Set([...s.hidden, ...keys])] }));
  const dismissed = new Set(getSettings().dismissedUpdates);
  for (const k of keys) dismissed.add(k);
  updateSettings({ dismissedUpdates: [...dismissed] });
}

/** The single update (if any) worth a toast: newest, not dismissed. */
export function toastCandidate(s: UpdateState, dismissed: string[]): UpdateItem | null {
  return s.available.find((u) => !s.hidden.includes(updateKey(u)) && !dismissed.includes(updateKey(u))) ?? null;
}

export { describeUpdate, updateKey };

// ------------------------------------------------------------- installing

function setBusy(key: string, on: boolean) {
  updateState.update((s) => ({ ...s, busy: on ? [...s.busy, key] : s.busy.filter((k) => k !== key) }));
}

export async function installContentUpdate(item: UpdateItem): Promise<{ ok: boolean; message: string }> {
  if (item.kind !== 'content') return { ok: false, message: 'Not a content update' };
  const key = updateKey(item);
  setBusy(key, true);
  try {
    if (!isTrustedDownloadUrl(item.downloadUrl)) return { ok: false, message: 'The download address was not trusted.' };
    let res;
    try {
      res = await httpGet(item.downloadUrl, { accept: 'application/octet-stream', maxBytes: item.asset.size + 1024, timeoutMs: 60000 });
    } catch (err) {
      return { ok: false, message: (err as Error).message || 'Download failed.' };
    }
    if (res.status !== 200) return { ok: false, message: `Download failed (status ${res.status}).` };
    const verified = await verifyDownloadedAsset(item.asset, res.bytes, res.contentType);
    if (!verified.ok) return { ok: false, message: verified.error };
    const parsed = parsePack(res.bytes);
    if (!parsed.ok) return { ok: false, message: parsed.error };
    if (!packAssetMatches(item.asset, parsed.value)) return { ok: false, message: 'The pack does not match the release manifest.' };
    if (parsed.value.id !== item.id || parsed.value.version !== item.version) return { ok: false, message: 'The pack identity does not match the release manifest.' };
    const done = await installPack(parsed.value);
    if (!done.ok) return { ok: false, message: done.error };
    await loadCatalog();
    updateState.update((s) => ({ ...s, available: s.available.filter((u) => updateKey(u) !== key) }));
    return { ok: true, message: `${item.name} is ready.` };
  } finally {
    setBusy(key, false);
  }
}

export interface DownloadedInstaller {
  ok: boolean;
  message: string;
  path?: string;
}

/**
 * Downloads the new installer into Downloads/Cloud-Freelife, verifies size and
 * SHA-256, and stops there. The app never runs a downloaded file: the user opens it.
 */
export async function downloadAppInstaller(item: UpdateItem): Promise<DownloadedInstaller> {
  if (item.kind !== 'app' || !item.asset || !item.downloadUrl) return { ok: false, message: 'No verified installer is attached to this release.' };
  if (!isTauri()) return { ok: false, message: 'Installer downloads are only available in the desktop app.' };
  const key = updateKey(item);
  setBusy(key, true);
  try {
    let res;
    try {
      res = await httpGet(item.downloadUrl, { accept: 'application/octet-stream', maxBytes: item.asset.size + 4096, timeoutMs: 180000 });
    } catch (err) {
      return { ok: false, message: (err as Error).message || 'Download failed.' };
    }
    if (res.status !== 200) return { ok: false, message: `Download failed (status ${res.status}).` };
    const verified = await verifyDownloadedAsset(item.asset, res.bytes, res.contentType, ALLOWED_APP_TYPES);
    if (!verified.ok) return { ok: false, message: verified.error };
    const { BaseDirectory, mkdir, writeFile } = await import('@tauri-apps/plugin-fs');
    const { downloadDir } = await import('@tauri-apps/api/path');
    await mkdir('Cloud-Freelife', { baseDir: BaseDirectory.Download, recursive: true });
    await writeFile(`Cloud-Freelife/${item.asset.name}`, res.bytes, { baseDir: BaseDirectory.Download });
    const dir = (await downloadDir()).replace(/[\\/]+$/, '');
    return { ok: true, message: 'Installer downloaded and verified.', path: `${dir}\\Cloud-Freelife\\${item.asset.name}` };
  } finally {
    setBusy(key, false);
  }
}

export async function openOfficialLink(url: string) {
  const target = url.startsWith('https://github.com/') ? url : GITHUB_RELEASES_PAGE;
  if (isTauri()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(target);
  } else {
    window.open(target, '_blank', 'noopener');
  }
}

export async function revealPath(path: string) {
  if (!isTauri()) return;
  const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
  await revealItemInDir(path);
}

export function notifyInstalled(message: string) {
  toast(message, 'success');
}

/** Used by tests to hash arbitrary bytes the same way the app does. */
export const hashBytes = sha256Hex;
export { getStorage };
