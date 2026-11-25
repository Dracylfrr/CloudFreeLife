/**
 * Premium content: the licenses the person has, and opening the encrypted packs they cover.
 *
 * A license is a small signed file ending in .dreamlicense. Putting one in the app's own folder (Project
 * D.R.E.A.M, inside AppData) is all it takes, whatever the file is called: the app finds it, checks it,
 * applies it (keeping what it needs inside its own premium folder) and then deletes the file you put there.
 * Choosing a file on the Updates page does the same. A file that is not a valid license is left alone.
 * The checking and unlocking happen in the native side (src-tauri/src/premium.rs); the keys inside a
 * license are never shown or sent anywhere.
 *
 * No license means everything else works as before: premium packs simply stay locked.
 */
import { derived, get, writable } from 'svelte/store';
import { getStorage, isTauri } from '../../core/storage';
import { decodeBase64 } from '../updates/packs';

/** Where an applied license is kept: inside the app's folder, not next to the paintings. */
export const LICENSE_DIR = 'premium';
/** What a license a person drops in is called; what the app keeps is stored as .lic inside LICENSE_DIR. */
export const LICENSE_EXT = '.dreamlicense';
const KEPT_EXT = '.lic';
const MAX_LICENSE_CHARS = 64 * 1024;
const MAX_LICENSE_FILES = 12;

export interface LicenseInfo {
  id: string;
  issued: string;
  expires: string | null;
  packs: string[];
}

export interface FoundLicense {
  /** The file it was found in, inside the app's folder. */
  file: string;
  info: LicenseInfo;
}

export type LicenseState =
  | { status: 'unknown' }
  | { status: 'none' }
  /** One or more good licenses. `info` is what they cover together. */
  | { status: 'ok'; info: LicenseInfo; found: FoundLicense[] }
  | { status: 'bad'; message: string };

export const licenseState = writable<LicenseState>({ status: 'unknown' });

/** Which version of the app this is: "Premium" once a license has been applied, otherwise "Base". */
export type Edition = 'Premium' | 'Base';
export const edition = derived(licenseState, (s): Edition => (s.status === 'ok' ? 'Premium' : 'Base'));

/** The native checks, swappable so tests (and the browser preview) can stand in for them. */
export interface PremiumBackend {
  checkLicense(license: string): Promise<LicenseInfo>;
  openPack(license: string, packId: string, packText: string): Promise<string>;
}

const nativeBackend: PremiumBackend = {
  async checkLicense(license) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<LicenseInfo>('premium_check_license', { license });
  },
  async openPack(license, packId, packText) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string>('premium_open_pack', { license, packId, pack: packText });
  }
};

let backend: PremiumBackend | null = null;
export function setPremiumBackend(b: PremiumBackend | null) {
  backend = b;
}
const active = (): PremiumBackend | null => backend ?? (isTauri() ? nativeBackend : null);

const friendly = (e: unknown, fallback: string) => (typeof e === 'string' && e.length < 160 && !/github|https?:|[\\/]/i.test(e) ? e : fallback);

interface Scanned {
  file: string;
  text: string;
  info: LicenseInfo;
}
let scanned: Scanned[] = [];

const safeName = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'license';

async function listDir(dir: string, ext: string): Promise<string[]> {
  try {
    return (await (await getStorage()).list(dir)).filter((n) => n.toLowerCase().endsWith(ext)).slice(0, MAX_LICENSE_FILES);
  } catch {
    return [];
  }
}

async function readText(path: string): Promise<string | null> {
  try {
    return await (await getStorage()).readText(path);
  } catch {
    return null;
  }
}

/**
 * Every license the app has: the ones it already applied, and any new .dreamlicense file in the app's folder.
 * A new file that is a valid license is applied (kept inside the premium folder) and then deleted. A file
 * that is not valid is left exactly where it is and named in `bad`.
 */
async function scan(): Promise<{ good: Scanned[]; bad: { file: string; message: string }[] }> {
  const good: Scanned[] = [];
  const bad: { file: string; message: string }[] = [];
  const b = active();
  const seen = new Set<string>();
  const st = await getStorage().catch(() => null);
  if (!st) return { good, bad };

  // 1. what was applied before
  for (const name of await listDir(LICENSE_DIR, KEPT_EXT)) {
    const text = await readText(`${LICENSE_DIR}/${name}`);
    if (!text || !b) continue;
    try {
      const info = await b.checkLicense(text.trim());
      if (!seen.has(info.id)) {
        seen.add(info.id);
        good.push({ file: name, text: text.trim(), info });
      }
    } catch (e) {
      bad.push({ file: name, message: friendly(e, 'That license could not be used.') });
    }
  }

  // 2. new files put in the folder: apply the good ones, then remove them
  for (const file of await listDir('', LICENSE_EXT)) {
    const text = await readText(file);
    if (!text) continue;
    if (!b || text.length > MAX_LICENSE_CHARS) {
      if (b) bad.push({ file, message: 'That file is not a valid license.' });
      continue;
    }
    try {
      const info = await b.checkLicense(text.trim());
      const kept = `${safeName(info.id)}${KEPT_EXT}`;
      await st.writeText(`${LICENSE_DIR}/${kept}`, text.trim());
      await st.remove(file); // the file has done its job
      if (!seen.has(info.id)) {
        seen.add(info.id);
        good.push({ file: kept, text: text.trim(), info });
      }
    } catch (e) {
      bad.push({ file, message: friendly(e, 'That file is not a valid license.') });
    }
  }
  return { good, bad };
}

/** What several licenses cover together. */
function combine(list: Scanned[]): LicenseInfo {
  const packs = [...new Set(list.flatMap((l) => l.info.packs))];
  if (list.length === 1) return { ...list[0].info, packs };
  return { id: `${list.length} licenses`, issued: list.map((l) => l.info.issued).sort()[0], expires: null, packs };
}

/**
 * Looks in the app's folder for license files and checks them. Safe to call as often as needed:
 * on the Updates page, before every update check and after a license is added or removed.
 */
export async function loadLicense(): Promise<LicenseState> {
  const { good, bad } = await scan();
  scanned = good;
  let state: LicenseState;
  if (good.length) state = { status: 'ok', info: combine(good), found: good.map((g) => ({ file: g.file, info: g.info })) };
  else if (bad.length) state = { status: 'bad', message: bad[0].message };
  else state = { status: 'none' };
  licenseState.set(state);
  return state;
}

/** Checks a license file's text and, only if it is good, applies it (the same as putting the file in the folder). */
export async function addLicense(text: string): Promise<{ ok: true; info: LicenseInfo } | { ok: false; error: string }> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_LICENSE_CHARS) return { ok: false, error: 'That file is not a valid license.' };
  const b = active();
  if (!b) return { ok: false, error: 'Licenses can be added in the Project D.R.E.A.M desktop app.' };
  let info: LicenseInfo;
  try {
    info = await b.checkLicense(trimmed);
  } catch (e) {
    return { ok: false, error: friendly(e, 'That file is not a valid license.') };
  }
  try {
    await (await getStorage()).writeText(`${LICENSE_DIR}/${safeName(info.id)}${KEPT_EXT}`, trimmed);
  } catch {
    return { ok: false, error: 'The license could not be saved.' };
  }
  await loadLicense();
  return { ok: true, info };
}

/** Forgets every license. Content that was already installed stays; locked packs stay locked. */
export async function removeLicense(): Promise<void> {
  try {
    const st = await getStorage();
    await st.remove(LICENSE_DIR);
    for (const n of await listDir('', LICENSE_EXT)) await st.remove(n);
  } catch {
    /* nothing to remove */
  }
  await loadLicense();
}

/** The pack ids the licenses open (empty when there are none or none is valid). */
export function licensedIds(): ReadonlySet<string> {
  const s = get(licenseState);
  return s.status === 'ok' ? new Set(s.info.packs) : new Set();
}

/** Opens a downloaded encrypted pack with whichever license covers it. Returns the plain pack bytes. */
export async function openEncryptedPack(packId: string, packText: string): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; error: string }> {
  const b = active();
  if (!b) return { ok: false, error: 'Add your license file on the Updates page to open this content.' };
  // look again every time: a license file may have been added or taken away since the last look
  await loadLicense();
  const candidates = scanned.filter((s) => s.info.packs.includes(packId));
  if (!candidates.length) return { ok: false, error: 'Add your license file on the Updates page to open this content.' };
  let last = 'That content could not be opened.';
  for (const c of candidates) {
    try {
      return { ok: true, bytes: decodeBase64(await b.openPack(c.text, packId, packText)) };
    } catch (e) {
      last = friendly(e, 'That content could not be opened.');
    }
  }
  return { ok: false, error: last };
}

/** "2 packs, valid until 2027-12-31" / "3 packs, no end date". */
export function describeLicense(info: LicenseInfo): string {
  const n = info.packs.length;
  const what = `${n} ${n === 1 ? 'pack' : 'packs'}`;
  return info.expires ? `${what}, valid until ${info.expires}` : `${what}, no end date`;
}
