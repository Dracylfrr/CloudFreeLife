import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ContentTree } from '../../src/core/content/tree';

export const CONTENT_DIR = resolve(__dirname, '../../content');

/** Reads the real /content folder from disk through the same ContentTree interface the app uses. */
export class DiskTree implements ContentTree {
  readonly source = 'bundled' as const;
  constructor(private root = CONTENT_DIR) {}
  private async entries(dir: string) {
    try {
      return await readdir(join(this.root, dir), { withFileTypes: true });
    } catch {
      return [];
    }
  }
  async listDirs(dir: string) {
    return (await this.entries(dir)).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  }
  async listFiles(dir: string) {
    return (await this.entries(dir)).filter((e) => e.isFile()).map((e) => e.name).sort();
  }
  async readText(path: string) {
    try {
      return await readFile(join(this.root, path), 'utf8');
    } catch {
      return null;
    }
  }
  async readJson(path: string) {
    const t = await this.readText(path);
    return t === null ? null : JSON.parse(t);
  }
  async url(path: string) {
    return (await this.readText(path)) === null ? null : `file:${path}`;
  }
}

/** Every file under /content as a path -> text map (binary files are skipped). */
export async function readAllText(root = CONTENT_DIR, prefix = ''): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const e of await readdir(join(root, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) Object.assign(out, await readAllText(root, rel));
    else out[rel] = await readFile(join(root, rel), 'utf8');
  }
  return out;
}
