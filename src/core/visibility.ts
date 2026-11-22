/**
 * "Is the app visible?" in one place.
 *
 * In a browser, `document.hidden` covers tab switches. In the Tauri window,
 * minimising does NOT change `document.hidden` (the webview stays "visible"),
 * so the window's minimised state is tracked too. Animation loops, ambient
 * motion and audio all stop while the app is hidden or minimised.
 */
import { isTauri } from './storage';

let minimized = false;
const listeners = new Set<() => void>();
let started = false;

export function isAppHidden(): boolean {
  return (typeof document !== 'undefined' && document.hidden) || minimized;
}

function notify() {
  for (const l of [...listeners]) l();
}

/** Calls `fn` whenever visibility may have changed. Returns an unsubscribe function. */
export function onVisibilityChange(fn: () => void): () => void {
  start();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function start() {
  if (started || typeof document === 'undefined') return;
  started = true;
  document.addEventListener('visibilitychange', notify);
  if (isTauri()) {
    void (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        const check = async () => {
          const m = await win.isMinimized();
          if (m !== minimized) {
            minimized = m;
            notify();
          }
        };
        await win.onResized(check);
        await win.onFocusChanged(check);
        await check();
      } catch (err) {
        console.warn('Could not watch the window state', err);
      }
    })();
  }
}

/** Test hook. */
export function __setMinimizedForTests(v: boolean) {
  minimized = v;
  notify();
}
