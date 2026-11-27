import { get, writable } from 'svelte/store';

export type Route =
  | { name: 'home' }
  | { name: 'books' }
  | { name: 'book'; bookId: string }
  | { name: 'draw' }
  | { name: 'paint'; artworkId: string }
  | { name: 'gallery' }
  | { name: 'stories'; tab?: 'continue' | 'all' | 'notStarted' | 'finished' | 'favorites' }
  | { name: 'story'; storyId: string }
  | { name: 'adventures'; tab?: 'continue' | 'all' | 'notStarted' | 'finished' | 'favorites' }
  | { name: 'adventure'; adventureId: string }
  | { name: 'minigames'; game?: string }
  | { name: 'breaker'; levelId?: string; mode?: 'relax' | 'classic' | 'endless' }
  | { name: 'splash'; levelId?: string }
  | { name: 'memory'; levelId?: string }
  | { name: 'puzzle'; levelId?: string }
  | { name: 'bubbles'; levelId?: string; mode?: 'relax' | 'match' | 'endless' }
  | { name: 'catcher'; levelId?: string; mode?: 'relax' | 'match' | 'pattern' | 'endless' }
  | { name: 'zen'; levelId?: string; gardenId?: string }
  | { name: 'flow'; levelId?: string; mode?: 'puzzle' | 'relax' | 'free' }
  | { name: 'meditation' }
  | { name: 'meditate'; sessionId: string }
  | { name: 'movement' }
  | { name: 'moves'; cardId: string }
  | { name: 'updates' }
  | { name: 'settings'; tab?: string }
  | { name: 'about' };

export type NavSection = 'home' | 'books' | 'draw' | 'gallery' | 'stories' | 'adventures' | 'minigames' | 'meditation' | 'movement' | 'updates' | 'settings' | 'about';

const store = writable<Route>({ name: 'home' });
export const route = { subscribe: store.subscribe };

type Guard = () => Promise<void> | void;
const guards = new Set<Guard>();

/**
 * Registers a function that runs (and is awaited) before the user leaves the
 * current screen. The painting screen uses this to flush autosave.
 */
export function onBeforeLeave(fn: Guard): () => void {
  guards.add(fn);
  return () => guards.delete(fn);
}

/** How long saving may take before the app moves on anyway. Leaving a screen or closing the window must never wait for ever. */
export const LEAVE_WAIT_MS = 8000;

export async function runLeaveGuards(waitMs = LEAVE_WAIT_MS): Promise<void> {
  const all = (async () => {
    for (const g of [...guards]) {
      try {
        await g();
      } catch (err) {
        console.warn('leave guard failed', err);
      }
    }
  })();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      console.warn('Saving is taking a long time; moving on. It keeps going in the background.');
      resolve();
    }, waitMs);
  });
  try {
    await Promise.race([all, late]);
  } finally {
    clearTimeout(timer);
  }
}

export async function navigate(next: Route): Promise<void> {
  await runLeaveGuards();
  store.set(next);
}

export function currentRoute(): Route {
  return get(store);
}

export function sectionOf(r: Route): NavSection {
  switch (r.name) {
    case 'book':
    case 'books':
      return 'books';
    case 'draw':
      return 'books';
    case 'story':
      return 'stories';
    case 'adventure':
    case 'adventures':
      return 'adventures';
    case 'paint':
      return 'books';
    case 'breaker':
    case 'splash':
    case 'memory':
    case 'puzzle':
    case 'bubbles':
    case 'catcher':
    case 'zen':
    case 'flow':
    case 'minigames':
      return 'minigames';
    case 'meditate':
      return 'meditation';
    case 'moves':
      return 'movement';
    default:
      return r.name as NavSection;
  }
}
