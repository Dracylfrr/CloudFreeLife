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
import { DATA_DIR_NAME } from '../config';
import { assertSafeRelativePath, dirname, type StorageAdapter } from './types';

const BASE = BaseDirectory.Data; // %APPDATA% on Windows (Roaming) - never the install folder.

function full(path: string): string {
  return `${DATA_DIR_NAME}/${assertSafeRelativePath(path)}`;
}

export class TauriStorage implements StorageAdapter {
  readonly kind = 'tauri' as const;
  private dec = new TextDecoder();
  private enc = new TextEncoder();
  private madeDirs = new Set<string>();

  private async ensureDir(dir: string) {
    const key = dir || '.';
    if (this.madeDirs.has(key)) return;
    await mkdir(`${DATA_DIR_NAME}${dir ? '/' + dir : ''}`, { baseDir: BASE, recursive: true });
    this.madeDirs.add(key);
  }

  async readBytes(path: string) {
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
    return exists(full(path), { baseDir: BASE });
  }
  async remove(path: string) {
    const p = full(path);
    if (!(await exists(p, { baseDir: BASE }))) return;
    await remove(p, { baseDir: BASE, recursive: true });
    this.madeDirs.clear();
  }
  async list(dir: string) {
    const p = dir === '' ? DATA_DIR_NAME : full(dir);
    if (!(await exists(p, { baseDir: BASE }))) return [];
    const entries = await readDir(p, { baseDir: BASE });
    return entries.map((e) => e.name).filter((n) => !n.endsWith('.tmp')).sort();
  }
  async describeRoot() {
    const root = await dataDir();
    return `${root.replace(/[\\/]+$/, '')}\\${DATA_DIR_NAME}`;
  }
  async usage(dir = ''): Promise<number> {
    const walk = async (rel: string): Promise<number> => {
      const p = rel === '' ? DATA_DIR_NAME : full(rel);
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
