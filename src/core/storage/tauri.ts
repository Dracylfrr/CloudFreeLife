import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readFile,
  remove,
  rename,
  writeFile
} from '@tauri-apps/plugin-fs';
import { dataDir } from '@tauri-apps/api/path';
import { DATA_DIR_NAME, LEGACY_DATA_DIR_NAME } from '../config';
import { assertSafeRelativePath, dirname, type StorageAdapter } from './types';

const BASE = BaseDirectory.Data; // %APPDATA% on Windows (Roaming) - never the install folder.

// The folder in use. Normally the new name; if the old folder could not be moved, the old one keeps being used
// so that nothing ever looks lost.
let ROOT = DATA_DIR_NAME;
let migrated: Promise<void> | null = null;

/** Moves the saved data from the old folder name to the new one, once. Never deletes anything. */
function migrate(): Promise<void> {
  return (migrated ??= (async () => {
    try {
      const hasOld = await exists(LEGACY_DATA_DIR_NAME, { baseDir: BASE });
      if (!hasOld) return;
      const hasNew = await exists(DATA_DIR_NAME, { baseDir: BASE });
      if (hasNew) {
        // an empty new folder (made by an earlier start) is stepped aside; one with things in it is left alone
        const inside = await readDir(DATA_DIR_NAME, { baseDir: BASE });
        if (inside.length > 0) return;
        await remove(DATA_DIR_NAME, { baseDir: BASE, recursive: true });
      }
      await rename(LEGACY_DATA_DIR_NAME, DATA_DIR_NAME, { oldPathBaseDir: BASE, newPathBaseDir: BASE });
    } catch {
      // if the move did not work, keep using what is there
      try {
        if ((await exists(LEGACY_DATA_DIR_NAME, { baseDir: BASE })) && !(await exists(DATA_DIR_NAME, { baseDir: BASE }))) ROOT = LEGACY_DATA_DIR_NAME;
      } catch {
        /* nothing more to try */
      }
    }
  })());
}

function full(path: string): string {
  return `${ROOT}/${assertSafeRelativePath(path)}`;
}

export class TauriStorage implements StorageAdapter {
  readonly kind = 'tauri' as const;
  private dec = new TextDecoder();
  private enc = new TextEncoder();
  private madeDirs = new Set<string>();

  private async ensureDir(dir: string) {
    const key = dir || '.';
    if (this.madeDirs.has(key)) return;
    await migrate();
    await mkdir(`${ROOT}${dir ? '/' + dir : ''}`, { baseDir: BASE, recursive: true });
    this.madeDirs.add(key);
  }

  async readBytes(path: string) {
    await migrate();
    const p = full(path);
    if (!(await exists(p, { baseDir: BASE }))) return null;
    return await readFile(p, { baseDir: BASE });
  }
  async readText(path: string) {
    const b = await this.readBytes(path);
    return b ? this.dec.decode(b) : null;
  }
  async writeBytes(path: string, bytes: Uint8Array) {
    const safe = assertSafeRelativePath(path);
    await this.ensureDir(dirname(safe));
    // Write to a temp file first and rename, so a crash never leaves a half-written file.
    const target = full(safe);
    const tmp = target + '.tmp';
    await writeFile(tmp, bytes, { baseDir: BASE });
    await rename(tmp, target, { oldPathBaseDir: BASE, newPathBaseDir: BASE });
  }
  async writeText(path: string, text: string) {
    await this.writeBytes(path, this.enc.encode(text));
  }
  async exists(path: string) {
    await migrate();
    return exists(full(path), { baseDir: BASE });
  }
  async remove(path: string) {
    await migrate();
    const p = full(path);
    if (!(await exists(p, { baseDir: BASE }))) return;
    await remove(p, { baseDir: BASE, recursive: true });
    this.madeDirs.clear();
  }
  async list(dir: string) {
    await migrate();
    const p = dir === '' ? ROOT : full(dir);
    if (!(await exists(p, { baseDir: BASE }))) return [];
    const entries = await readDir(p, { baseDir: BASE });
    return entries.map((e) => e.name).filter((n) => !n.endsWith('.tmp')).sort();
  }
  async describeRoot() {
    await migrate();
    const root = await dataDir();
    return `${root.replace(/[\\/]+$/, '')}\\${ROOT}`;
  }
  async usage(dir = ''): Promise<number> {
    await migrate();
    const walk = async (rel: string): Promise<number> => {
      const p = rel === '' ? ROOT : full(rel);
      if (!(await exists(p, { baseDir: BASE }))) return 0;
      let total = 0;
      for (const e of await readDir(p, { baseDir: BASE })) {
        const child = rel === '' ? e.name : `${rel}/${e.name}`;
        if (e.isDirectory) total += await walk(child);
        else total += (await readFile(full(child), { baseDir: BASE })).byteLength;
      }
      return total;
    };
    return walk(dir);
  }
}
