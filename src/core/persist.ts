/**
 * One small, shared way to keep a piece of local state in a JSON file inside the data folder.
 *
 * Meditation history, movement favorites and mini-game progress all use this instead of each
 * inventing its own saving. It gives you:
 *  - a Svelte store you can read from components;
 *  - `load()` that tolerates a missing or corrupt file (you simply start fresh);
 *  - `update(fn)` that changes the state and schedules a debounced write, so nothing is written
 *    while something is still changing quickly;
 *  - `flush()` to write immediately (called when leaving a screen and when the window closes).
 *
 * Everything stays on this computer. Nothing here is ever uploaded.
 */
import { get, writable, type Readable } from 'svelte/store';
import { Autosaver } from './autosave';
import { getStorage } from './storage';

export interface Persisted<T> extends Readable<T> {
  load(): Promise<T>;
  /** Mutates a copy of the state, stores it and schedules a save. */
  update(fn: (draft: T) => void): void;
  flush(): Promise<void>;
  /** Current value without subscribing. */
  value(): T;
  /** Test hook: forget everything and behave as if nothing was loaded yet. */
  __reset(): void;
  /** Test hook: allow writes without calling load(). */
  __enable(): void;
}

export function persisted<T>(path: string, empty: () => T, sanitize: (raw: unknown) => T, delay = 800): Persisted<T> {
  const store = writable<T>(empty());
  let loaded = false;
  const saver = new Autosaver(
    async () => {
      const st = await getStorage();
      await st.writeText(path, JSON.stringify(get(store), null, 2));
    },
    { delay, onStatus: () => {} }
  );
  return {
    subscribe: store.subscribe,
    async load() {
      try {
        const st = await getStorage();
        const text = await st.readText(path);
        store.set(sanitize(text ? JSON.parse(text) : null));
      } catch (err) {
        console.warn(`Could not read ${path}, starting fresh`, err);
        store.set(empty());
      }
      loaded = true;
      return get(store);
    },
    update(fn) {
      const draft = structuredClone(get(store));
      fn(draft);
      store.set(draft);
      if (loaded) saver.markDirty();
    },
    flush: () => saver.flush(),
    value: () => get(store),
    __reset() {
      store.set(empty());
      loaded = false;
    },
    __enable() {
      loaded = true;
    }
  };
}
