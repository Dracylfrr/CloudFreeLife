import { BrowserStorage } from './browser';
import { MemoryStorage } from './memory';
import type { StorageAdapter } from './types';

export * from './types';
export { MemoryStorage } from './memory';

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

let current: StorageAdapter | null = null;

/** Lazily picks the right adapter for the environment. */
export async function getStorage(): Promise<StorageAdapter> {
  if (current) return current;
  if (isTauri()) {
    const { TauriStorage } = await import('./tauri');
    current = new TauriStorage();
  } else if (typeof indexedDB !== 'undefined') {
    current = new BrowserStorage();
  } else {
    current = new MemoryStorage();
  }
  return current;
}

/** Tests (and nothing else) replace the adapter. */
export function setStorage(adapter: StorageAdapter | null) {
  current = adapter;
}
