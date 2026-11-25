/**
 * How big the whole app is, and where the space goes. The program itself (what the installer put in its
 * folder) plus everything the app keeps in its data folder, split into the pieces a person can remove
 * and get back: the voices, downloaded content and update leftovers. Nothing here changes anything.
 */
import { getStorage, isTauri } from '../../core/storage';
import { MODEL_FILES, filesOf, modelStatus } from '../voices/model';

export type Remedy = 'content' | 'gallery' | 'update-leftovers' | 'voices-standard' | 'voices-fast' | 'none';

export interface Part {
  id: string;
  label: string;
  note: string;
  bytes: number;
  /** What the person can do about it: where to manage it, or what can be cleared. */
  remedy: Remedy;
}

export interface Footprint {
  /** The program's own folder (null when it cannot be measured, as in a browser). */
  program: number | null;
  /** Everything in the data folder. */
  data: number;
  total: number;
  parts: Part[];
}

/** Size of the folder the installer put the program in. */
export async function programSize(): Promise<number | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const n = await invoke<number>('install_size');
    return typeof n === 'number' && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export async function measureFootprint(program: number | null = null): Promise<Footprint> {
  const st = await getStorage();
  const size = async (dir: string) => {
    try {
      return await st.usage(dir);
    } catch {
      return 0;
    }
  };
  const data = await size('');
  const status = await modelStatus();
  const fileBytes = (parts: ('shared' | 'standard' | 'fast')[]) => parts.flatMap((p) => filesOf(p)).filter((f) => !status.missing.includes(f)).reduce((n, f) => n + f.size, 0);
  const fast = fileBytes(['fast']);
  const standard = fileBytes(['standard']);
  const shared = fileBytes(['shared']);

  const parts: Part[] = [];
  const add = (p: Part) => {
    if (p.bytes > 0 || p.remedy.startsWith('voices')) parts.push(p);
  };
  add({ id: 'art', label: 'Your artwork', note: 'Paintings and drawings you made. Kept when you update or reinstall.', bytes: await size('artworks'), remedy: 'gallery' });
  add({ id: 'avatar', label: 'Your avatar and picture', note: 'Your avatar, your own picture and saved looks.', bytes: await size('avatar'), remedy: 'none' });
  add({ id: 'content', label: 'Downloaded content', note: 'Books, stories and levels downloaded from Updates. Remove or download them again there.', bytes: await size('content'), remedy: 'content' });
  add({ id: 'fast', label: 'Fast voices', note: 'Spoken stories on your graphics chip. Remove it and download it again whenever you like.', bytes: fast, remedy: 'voices-fast' });
  add({ id: 'standard', label: 'Standard voices', note: 'Spoken stories on the processor. Remove it and download it again whenever you like.', bytes: standard, remedy: 'voices-standard' });
  if (shared > 0) add({ id: 'shared', label: 'The nine voices', note: 'Shared by both kinds of voices. Removed with the last speech model.', bytes: shared, remedy: 'none' });
  add({ id: 'update', label: 'Update leftovers', note: 'An installer kept from an earlier update. Safe to clear.', bytes: await size('update'), remedy: 'update-leftovers' });
  add({ id: 'premium', label: 'Premium license', note: 'The license that unlocks premium content.', bytes: await size('premium'), remedy: 'none' });
  const known = parts.reduce((n, p) => n + p.bytes, 0);
  add({ id: 'other', label: 'Settings and reading places', note: 'Your settings, reading progress and everything small.', bytes: Math.max(0, data - known), remedy: 'none' });

  return { program, data, total: (program ?? 0) + data, parts };
}

/** What every removable voice file is called, for tests and for the "what is this" text. */
export const VOICE_FILE_COUNT = MODEL_FILES.length;
