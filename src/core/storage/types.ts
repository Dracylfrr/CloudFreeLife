/**
 * Storage abstraction. All user data (artwork, settings, installed content)
 * goes through this interface so it can live in the OS app-data folder on
 * Windows, in IndexedDB while developing in a browser, or in memory in tests.
 *
 * Paths are always POSIX-style, relative to the data root, e.g.
 *   "artworks/cloud-castle-ab12/paint.png"
 */
export interface StorageAdapter {
  readonly kind: 'tauri' | 'browser' | 'memory';
  readText(path: string): Promise<string | null>;
  writeText(path: string, text: string): Promise<void>;
  readBytes(path: string): Promise<Uint8Array | null>;
  writeBytes(path: string, bytes: Uint8Array): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** Removes a file or (recursively) a directory. Missing paths are not an error. */
  remove(path: string): Promise<void>;
  /** Names (not paths) of the direct children of a directory. */
  list(dir: string): Promise<string[]>;
  /** Human readable location of the data root. */
  describeRoot(): Promise<string>;
  /** Total bytes stored under a directory. */
  usage(dir?: string): Promise<number>;
}

export function joinPath(...parts: string[]): string {
  return parts
    .join('/')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\//, '')
    .replace(/\/$/, '');
}

export function dirname(path: string): string {
  const i = path.lastIndexOf('/');
  return i < 0 ? '' : path.slice(0, i);
}

/** Rejects absolute paths, drive letters and traversal. Throws on anything unsafe. */
export function assertSafeRelativePath(path: string): string {
  const norm = path.replace(/\\/g, '/');
  if (
    norm.startsWith('/') ||
    /^[a-zA-Z]:/.test(norm) ||
    norm.split('/').some((seg) => seg === '..' || seg === '.') ||
    norm.includes('\0') ||
    norm.length === 0 ||
    norm.length > 240
  ) {
    throw new Error(`Unsafe path: ${path}`);
  }
  return norm.replace(/\/+/g, '/');
}
