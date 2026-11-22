import { assertSafeRelativePath, type StorageAdapter } from './types';

/**
 * IndexedDB adapter. Used when the UI runs in a plain browser (development,
 * smoke testing). The packaged Windows app uses the Tauri file-system adapter.
 */
const DB_NAME = 'cloud-freelife';
const STORE = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class BrowserStorage implements StorageAdapter {
  readonly kind = 'browser' as const;
  private dbp: Promise<IDBDatabase> | null = null;
  private enc = new TextEncoder();
  private dec = new TextDecoder();

  private db() {
    return (this.dbp ??= openDb());
  }

  private async tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.db();
    return new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = run(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  private async allKeys(): Promise<string[]> {
    return (await this.tx('readonly', (s) => s.getAllKeys())) as string[];
  }

  async readBytes(path: string) {
    const v = await this.tx<Uint8Array | undefined>('readonly', (s) => s.get(assertSafeRelativePath(path)));
    return v ? new Uint8Array(v) : null;
  }
  async writeBytes(path: string, bytes: Uint8Array) {
    await this.tx('readwrite', (s) => s.put(bytes.slice(), assertSafeRelativePath(path)));
  }
  async readText(path: string) {
    const b = await this.readBytes(path);
    return b ? this.dec.decode(b) : null;
  }
  async writeText(path: string, text: string) {
    await this.writeBytes(path, this.enc.encode(text));
  }
  async exists(path: string) {
    const p = assertSafeRelativePath(path);
    const keys = await this.allKeys();
    return keys.some((k) => k === p || k.startsWith(p + '/'));
  }
  async remove(path: string) {
    const p = assertSafeRelativePath(path);
    const keys = await this.allKeys();
    const doomed = keys.filter((k) => k === p || k.startsWith(p + '/'));
    const db = await this.db();
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(STORE, 'readwrite');
      const s = t.objectStore(STORE);
      doomed.forEach((k) => s.delete(k));
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }
  async list(dir: string) {
    const prefix = dir === '' ? '' : assertSafeRelativePath(dir) + '/';
    const names = new Set<string>();
    for (const k of await this.allKeys()) {
      if (k.startsWith(prefix)) names.add(k.slice(prefix.length).split('/')[0]);
    }
    return [...names].sort();
  }
  async describeRoot() {
    return 'Browser storage (development mode)';
  }
  async usage(dir = '') {
    const prefix = dir === '' ? '' : assertSafeRelativePath(dir) + '/';
    let total = 0;
    for (const k of await this.allKeys()) {
      if (!k.startsWith(prefix)) continue;
      const b = await this.readBytes(k);
      total += b?.byteLength ?? 0;
    }
    return total;
  }
}
