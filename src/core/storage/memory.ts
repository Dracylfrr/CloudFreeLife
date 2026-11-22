import { assertSafeRelativePath, type StorageAdapter } from './types';

/** In-memory adapter. Used by tests and as a last-resort fallback. */
export class MemoryStorage implements StorageAdapter {
  readonly kind = 'memory' as const;
  private files = new Map<string, Uint8Array>();
  private enc = new TextEncoder();
  private dec = new TextDecoder();

  /** Test hook: make the next write fail. */
  failNextWrite = false;

  async readText(path: string) {
    const b = this.files.get(assertSafeRelativePath(path));
    return b ? this.dec.decode(b) : null;
  }
  async writeText(path: string, text: string) {
    await this.writeBytes(path, this.enc.encode(text));
  }
  async readBytes(path: string) {
    const b = this.files.get(assertSafeRelativePath(path));
    return b ? b.slice() : null;
  }
  async writeBytes(path: string, bytes: Uint8Array) {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error('Simulated write failure');
    }
    this.files.set(assertSafeRelativePath(path), bytes.slice());
  }
  async exists(path: string) {
    const p = assertSafeRelativePath(path);
    if (this.files.has(p)) return true;
    const prefix = p + '/';
    for (const k of this.files.keys()) if (k.startsWith(prefix)) return true;
    return false;
  }
  async remove(path: string) {
    const p = assertSafeRelativePath(path);
    this.files.delete(p);
    const prefix = p + '/';
    for (const k of [...this.files.keys()]) if (k.startsWith(prefix)) this.files.delete(k);
  }
  async list(dir: string) {
    const prefix = dir === '' ? '' : assertSafeRelativePath(dir) + '/';
    const names = new Set<string>();
    for (const k of this.files.keys()) {
      if (!k.startsWith(prefix)) continue;
      names.add(k.slice(prefix.length).split('/')[0]);
    }
    return [...names].sort();
  }
  async describeRoot() {
    return 'In-memory storage (not persistent)';
  }
  async usage(dir = '') {
    const prefix = dir === '' ? '' : assertSafeRelativePath(dir) + '/';
    let total = 0;
    for (const [k, v] of this.files) if (k.startsWith(prefix)) total += v.byteLength;
    return total;
  }
}
