/**
 * A ContentTree is a read-only virtual file tree rooted at "content/".
 * Bundled content (shipped inside the app) and installed content packs
 * (stored in the user's data folder) expose the same interface, so the
 * registry loads both with identical code.
 */
import { getStorage } from '../storage';

export interface ContentTree {
  readonly source: 'bundled' | 'installed';
  /** Names of sub-folders directly below `dir` (e.g. "books/cloud_dreams"). */
  listDirs(dir: string): Promise<string[]>;
  /** Names of files directly below `dir`. */
  listFiles(dir: string): Promise<string[]>;
  readJson(path: string): Promise<unknown | null>;
  readText(path: string): Promise<string | null>;
  /** URL usable in <img src> or fetch(). */
  url(path: string): Promise<string | null>;
}

// ------------------------------------------------------------- bundled

const jsonModules = import.meta.glob('/content/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const urlModules = import.meta.glob('/content/**/*.{svg,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export class BundledTree implements ContentTree {
  readonly source = 'bundled' as const;
  private paths: string[];
  constructor(
    private json: Record<string, unknown> = jsonModules,
    private urls: Record<string, string> = urlModules
  ) {
    this.paths = [...Object.keys(json), ...Object.keys(urls)].map((p) => p.replace(/^\/content\//, ''));
  }
  private children(dir: string) {
    const prefix = dir === '' ? '' : dir.replace(/\/$/, '') + '/';
    const dirs = new Set<string>();
    const files = new Set<string>();
    for (const p of this.paths) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      const i = rest.indexOf('/');
      if (i < 0) files.add(rest);
      else dirs.add(rest.slice(0, i));
    }
    return { dirs: [...dirs].sort(), files: [...files].sort() };
  }
  async listDirs(dir: string) {
    return this.children(dir).dirs;
  }
  async listFiles(dir: string) {
    return this.children(dir).files;
  }
  async readJson(path: string) {
    return this.json['/content/' + path] ?? null;
  }
  async readText(path: string) {
    const u = this.urls['/content/' + path];
    if (!u) {
      const j = this.json['/content/' + path];
      return j === undefined ? null : JSON.stringify(j);
    }
    const res = await fetch(u);
    return res.ok ? await res.text() : null;
  }
  async url(path: string) {
    return this.urls['/content/' + path] ?? null;
  }
}

// ------------------------------------------------------------- installed

export const INSTALLED_ROOT = 'content';

function mimeFor(path: string): string {
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export class InstalledTree implements ContentTree {
  readonly source = 'installed' as const;
  async listDirs(dir: string) {
    const st = await getStorage();
    const names = await st.list(`${INSTALLED_ROOT}/${dir}`.replace(/\/$/, ''));
    const out: string[] = [];
    for (const n of names) {
      if (!n.includes('.')) out.push(n);
    }
    return out;
  }
  async listFiles(dir: string) {
    const st = await getStorage();
    return (await st.list(`${INSTALLED_ROOT}/${dir}`.replace(/\/$/, ''))).filter((n) => n.includes('.'));
  }
  async readText(path: string) {
    const st = await getStorage();
    return st.readText(`${INSTALLED_ROOT}/${path}`);
  }
  async readJson(path: string) {
    try {
      const t = await this.readText(path);
      return t === null ? null : JSON.parse(t);
    } catch {
      return null;
    }
  }
  async url(path: string) {
    const st = await getStorage();
    const bytes = await st.readBytes(`${INSTALLED_ROOT}/${path}`);
    if (!bytes) return null;
    // data: URLs are fine for <img> (scripts inside SVG never run in an image context).
    return `data:${mimeFor(path)};base64,${toBase64(bytes)}`;
  }
}

/** Plain in-memory tree for tests. */
export class MapTree implements ContentTree {
  constructor(
    readonly source: 'bundled' | 'installed',
    private files: Record<string, string>
  ) {}
  private children(dir: string) {
    const prefix = dir === '' ? '' : dir.replace(/\/$/, '') + '/';
    const dirs = new Set<string>();
    const files = new Set<string>();
    for (const p of Object.keys(this.files)) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      const i = rest.indexOf('/');
      if (i < 0) files.add(rest);
      else dirs.add(rest.slice(0, i));
    }
    return { dirs: [...dirs].sort(), files: [...files].sort() };
  }
  async listDirs(d: string) {
    return this.children(d).dirs;
  }
  async listFiles(d: string) {
    return this.children(d).files;
  }
  async readText(p: string) {
    return this.files[p] ?? null;
  }
  async readJson(p: string) {
    const t = this.files[p];
    return t === undefined ? null : JSON.parse(t);
  }
  async url(p: string) {
    return this.files[p] === undefined ? null : `map:${p}`;
  }
}
