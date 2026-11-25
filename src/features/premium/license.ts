/**
 * Premium content: the license the person has added, and opening the encrypted packs it covers.
 *
 * A license is a small signed file. The app checks its signature and dates in the native side
 * (src-tauri/src/premium.rs) and only keeps the file in the app's data folder. The keys inside it
 * are never shown or sent anywhere; they are only used, natively, to open the packs the license names.
 * No license means everything else works as before: premium packs simply stay locked.
 */
import { get, writable } from 'svelte/store';
import { getStorage, isTauri } from '../../core/storage';
import { decodeBase64 } from '../updates/packs';

export const LICENSE_PATH = 'license.dreamlicense';
const MAX_LICENSE_CHARS = 64 * 1024;

export interface LicenseInfo {
  id: string;
  issued: string;
  expires: string | null;
  packs: string[];
}

export type LicenseState =
  | { status: 'unknown' }
  | { status: 'none' }
  | { status: 'ok'; info: LicenseInfo }
  | { status: 'bad'; message: string };

export const licenseState = writable<LicenseState>({ status: 'unknown' });

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

async function readStored(): Promise<string | null> {
  try {
    return await (await getStorage()).readText(LICENSE_PATH);
  } catch {
    return null;
  }
}

/** Reads the saved license (if any) and checks it. Safe to call as often as needed. */
export async function loadLicense(): Promise<LicenseState> {
  const text = await readStored();
  let state: LicenseState;
  if (!text) state = { status: 'none' };
  else {
    const b = active();
    if (!b) state = { status: 'none' };
    else {
      try {
        state = { status: 'ok', info: await b.checkLicense(text) };
      } catch (e) {
        state = { status: 'bad', message: friendly(e, 'The saved license could not be checked.') };
      }
    }
  }
  licenseState.set(state);
  return state;
}

/** Checks a license file's text and, only if it is good, keeps it. */
export async function addLicense(text: string): Promise<{ ok: true; info: LicenseInfo } | { ok: false; error: string }> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_LICENSE_CHARS) return { ok: false, error: 'That file is not a valid license.' };
  const b = active();
  if (!b) return { ok: false, error: 'Licenses can be added in the Cloud-Freelife desktop app.' };
  let info: LicenseInfo;
  try {
    info = await b.checkLicense(trimmed);
  } catch (e) {
    return { ok: false, error: friendly(e, 'That file is not a valid license.') };
  }
  try {
    await (await getStorage()).writeText(LICENSE_PATH, trimmed);
  } catch {
    return { ok: false, error: 'The license could not be saved.' };
  }
  licenseState.set({ status: 'ok', info });
  return { ok: true, info };
}

/** Forgets the license. Content that was already installed stays; locked packs stay locked. */
export async function removeLicense(): Promise<void> {
  try {
    await (await getStorage()).remove(LICENSE_PATH);
  } catch {
    /* nothing to remove */
  }
  licenseState.set({ status: 'none' });
}

/** The pack ids the current license opens (empty when there is none or it is not valid). */
export function licensedIds(): ReadonlySet<string> {
  const s = get(licenseState);
  return s.status === 'ok' ? new Set(s.info.packs) : new Set();
}

/** Opens a downloaded encrypted pack with the saved license. Returns the plain pack bytes. */
export async function openEncryptedPack(packId: string, packText: string): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; error: string }> {
  const license = await readStored();
  const b = active();
  if (!license || !b) return { ok: false, error: 'Add your license file on the Updates page to open this content.' };
  try {
    return { ok: true, bytes: decodeBase64(await b.openPack(license, packId, packText)) };
  } catch (e) {
    return { ok: false, error: friendly(e, 'That content could not be opened.') };
  }
}

/** "Valid until 31 Dec 2027" / "No end date". */
export function describeLicense(info: LicenseInfo): string {
  const n = info.packs.length;
  const what = `${n} ${n === 1 ? 'pack' : 'packs'}`;
  return info.expires ? `${what}, valid until ${info.expires}` : `${what}, no end date`;
}
