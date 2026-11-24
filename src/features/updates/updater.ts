/**
 * Update orchestration. Talks to the infrastructure that hosts the official
 * Cloud-Freelife releases, never blocks the app, never polls, and treats everything it receives as untrusted.
 */
import { get, writable } from 'svelte/store';
import { GITHUB_API_RELEASES } from '../../core/config';
import { getCatalog, loadCatalog } from '../../core/content/registry';
import { getSettings, updateSettings } from '../../core/settings';
import { getStorage, isTauri } from '../../core/storage';
import { APP_VERSION, compareVersions } from '../../core/version';
import { toast } from '../../core/feedback';
import { BRAND_NAME } from '../../core/brand';
import { navigate, runLeaveGuards } from '../../core/router';
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
  /** Verified installers already saved to Downloads, by update key. */
  installers: Record<string, string>;
}

export const updateState = writable<UpdateState>({ outcome: 'idle', available: [], lastChecked: 0, message: '', busy: [], hidden: [], installers: {} });

let checkedOnStartup = false;
let inFlight: Promise<UpdateState> | null = null;

async function installedVersions(): Promise<InstalledVersions> {
  const out: InstalledVersions = {};
  for (const b of getCatalog().books) out[b.manifest.id] = b.manifest.version;
  for (const p of getCatalog().palettes) out[p.manifest.id] = p.manifest.version;
  for (const l of getCatalog().breakerLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().splashLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().memoryLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().puzzleLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().bubbleLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().catcherLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().zenLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().flowLevels) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().themes) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().meditations) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().movements) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().stories) out[l.manifest.id] = l.manifest.version;
  for (const l of getCatalog().adventures) out[l.manifest.id] = l.manifest.version;
  for (const r of await listInstalledPacks()) out[r.id] = out[r.id] && out[r.id]! > r.version ? out[r.id] : r.version;
  return out;
}

/**
 * A message that is safe to show. Messages from the network layer can contain a web address or the
 * name of the release host; people only ever see plain words about "the update service".
 */
export function plainMessage(raw: unknown, fallback = 'Something went wrong with the update. Please try again later.'): string {
  const text = raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '';
  if (!text || /github|https?:|:\/\/|\.(com|io|org)\b/i.test(text)) return fallback;
  return text;
}

/** Core check. Pure with respect to the UI: returns what it found. */
export async function runUpdateCheck(appVersion: string = APP_VERSION): Promise<{ items: UpdateItem[]; outcome: CheckOutcome; message: string }> {
  let res;
  try {
    res = await httpGet(GITHUB_API_RELEASES, { accept: 'application/vnd.github+json', maxBytes: 3 * 1024 * 1024 });
  } catch (err) {
    const offline = err instanceof NetworkError ? err.offline : true;
    return { items: [], outcome: offline ? 'offline' : 'error', message: offline ? "Couldn't reach the update service. You can keep using Cloud-Freelife offline." : plainMessage(err, "Couldn't check for updates right now. Please try again later.") };
  }
  if (res.status === 404) return { items: [], outcome: 'up_to_date', message: 'No releases have been published yet.' };
  if (res.status === 403 || res.status === 429) return { items: [], outcome: 'error', message: 'The update service is busy right now. Please try again later.' };
  if (res.status < 200 || res.status >= 300) return { items: [], outcome: 'error', message: `The update service answered with status ${res.status}.` };

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(res.bytes));
  } catch {
    return { items: [], outcome: 'error', message: 'The update service sent a response that could not be read.' };
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
  updateState.update((s) => ({ ...s, outcome: 'checking', message: 'Checking for updates…' }));
  inFlight = (async () => {
    try {
      const r = await runUpdateCheck();
      const now = Date.now();
      updateSettings({ lastUpdateCheck: now });
      updateState.update((s) => ({ ...s, outcome: r.outcome, available: r.items, message: r.message, lastChecked: now }));
    } catch (err) {
      updateState.update((s) => ({ ...s, outcome: 'error', message: plainMessage(err, "Couldn't check for updates right now. Please try again later.") }));
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
      return { ok: false, message: plainMessage(err, 'Download failed.') || 'Download failed.' };
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

/** The file name every Cloud-Freelife installer has, and the version inside it. */
export const INSTALLER_NAME = /^Cloud-Freelife_(\d{1,5})\.(\d{1,5})\.(\d{1,5})_x64-setup\.exe$/;
export function installerVersion(name: string): string | null {
  const m = INSTALLER_NAME.exec(name);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}
/** Installers (by file name) that are not newer than `current`, so are safe to delete. */
export function staleInstallers(names: string[], current: string): string[] {
  return names.filter((n) => {
    const v = installerVersion(n);
    return v !== null && compareVersions(v, current) <= 0;
  });
}

/** Where the quiet update is kept while it installs: the app's own data folder, never Downloads. */
export const UPDATE_DIR = 'update';

/** True when this copy was installed by the installer, so an update can be installed quietly in place. */
export async function canSelfUpdate(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return (await invoke<boolean>('can_self_update')) === true;
  } catch {
    return false;
  }
}

/**
 * The quiet update: download the installer into the app's own folder, check size and SHA-256, save
 * everything, then hand it to the native side, which checks the SHA-256 again, runs it with no
 * windows and closes the app. The installer keeps all your data, installs over the old version
 * and starts Cloud-Freelife again. Nothing is shown in Explorer and nothing asks anything.
 */
export async function installAppQuietly(item: UpdateItem): Promise<{ ok: boolean; message: string }> {
  if (item.kind !== 'app' || !item.asset || !item.downloadUrl) return { ok: false, message: 'No verified installer is attached to this release.' };
  const key = updateKey(item);
  setBusy(key, true);
  let kept = '';
  try {
    let res;
    try {
      res = await httpGet(item.downloadUrl, { accept: 'application/octet-stream', maxBytes: item.asset.size + 4096, timeoutMs: 180000 });
    } catch (err) {
      return { ok: false, message: plainMessage(err, 'Download failed.') || 'Download failed.' };
    }
    if (res.status !== 200) return { ok: false, message: `Download failed (status ${res.status}).` };
    const verified = await verifyDownloadedAsset(item.asset, res.bytes, res.contentType, ALLOWED_APP_TYPES);
    if (!verified.ok) return { ok: false, message: verified.error };
    if (!installerVersion(item.asset.name)) return { ok: false, message: 'The installer has an unexpected name, so it was not run.' };
    const st = await getStorage();
    kept = `${UPDATE_DIR}/${item.asset.name}`;
    await st.writeBytes(kept, res.bytes);
    // everything the app keeps is written before it closes
    await runLeaveGuards();
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('install_update', { fileName: item.asset.name, sha256: item.asset.sha256 });
    return { ok: true, message: `Updating ${BRAND_NAME}. It will reopen in a moment.` };
  } catch (err) {
    if (kept) await (await getStorage()).remove(kept).catch(() => undefined);
    const text = typeof err === 'string' ? err : (err as Error)?.message;
    return { ok: false, message: plainMessage(text, 'The update could not be installed.') };
  } finally {
    setBusy(key, false);
  }
}

/**
 * Tidies up after updates: removes the quiet-update folder and any installer an older version of the
 * app left in Downloads/Cloud-Freelife (only files that are not newer than this version).
 */
export async function cleanUpInstallers(): Promise<void> {
  if (!isTauri()) return;
  try {
    await (await getStorage()).remove(UPDATE_DIR);
  } catch {
    /* the installer may still be finishing; the next start tries again */
  }
  try {
    const { BaseDirectory, exists, readDir, remove } = await import('@tauri-apps/plugin-fs');
    if (!(await exists('Cloud-Freelife', { baseDir: BaseDirectory.Download }))) return;
    const names = (await readDir('Cloud-Freelife', { baseDir: BaseDirectory.Download })).filter((e) => e.isFile).map((e) => e.name);
    for (const n of staleInstallers(names, APP_VERSION)) await remove(`Cloud-Freelife/${n}`, { baseDir: BaseDirectory.Download });
  } catch {
    /* tidying up is a nicety */
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
      return { ok: false, message: plainMessage(err, 'Download failed.') || 'Download failed.' };
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

export async function revealPath(path: string) {
  if (!isTauri()) return;
  const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
  await revealItemInDir(path);
}

/**
 * Does whatever "Install" means for this update: content is downloaded, verified and installed;
 * an app update installs quietly and restarts the app (or, for a copy that cannot update itself,
 * is downloaded, verified and shown in Explorer).
 */
export async function installUpdate(item: UpdateItem): Promise<{ ok: boolean; message: string }> {
  if (item.kind === 'content') return installContentUpdate(item);
  // An installed copy updates itself quietly. A copy that was not put here by the installer
  // (for example one unpacked from the portable zip) cannot, so it gets the installer to run.
  if (await canSelfUpdate()) return installAppQuietly(item);
  const r = await downloadAppInstaller(item);
  if (r.ok && r.path) {
    updateState.update((s) => ({ ...s, installers: { ...s.installers, [updateKey(item)]: r.path! } }));
    try {
      await revealPath(r.path);
    } catch {
      /* showing the folder is a nicety */
    }
    return { ok: true, message: 'Installer downloaded and verified. Open it to finish updating.' };
  }
  return { ok: false, message: r.message };
}

/** The notice's "Install update" button: hide the notice, open the Update Center and start. */
export async function startInstall(item: UpdateItem): Promise<void> {
  hideForNow(item);
  await navigate({ name: 'updates' });
  const r = await installUpdate(item);
  toast(r.message, r.ok ? 'success' : 'error', 5000);
}

export function notifyInstalled(message: string) {
  toast(message, 'success');
}

/** Used by tests to hash arbitrary bytes the same way the app does. */
export const hashBytes = sha256Hex;
export { getStorage };
