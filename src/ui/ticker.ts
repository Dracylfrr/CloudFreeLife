/**
 * Shared ~10 fps clock for decorative motion (drifting clouds, bubbles, sparkles).
 *
 * Continuous 60 fps CSS animation makes the browser compose the whole window on
 * every frame, which measured ~10x more CPU than moving a handful of elements
 * ten times a second. Ambient motion is slow, so 10 fps looks identical.
 *
 * The timer only exists while someone is subscribed, the window is visible and
 * motion is allowed (Reduced Motion / Low Power switch it off completely).
 */
import { settings } from '../core/settings';
import { isAppHidden, onVisibilityChange } from '../core/visibility';

type Tick = (seconds: number) => void;

const INTERVAL_MS = 100;
const subs = new Set<Tick>();
let timer: ReturnType<typeof setInterval> | undefined;
let allowed = true;
let origin = 0;
let started = false;

function now() {
  return (performance.now() - origin) / 1000;
}

function sync() {
  const should = subs.size > 0 && allowed && !isAppHidden();
  if (should && !timer) {
    timer = setInterval(() => {
      const t = now();
      for (const fn of subs) fn(t);
    }, INTERVAL_MS);
  } else if (!should && timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

function init() {
  if (started) return;
  started = true;
  origin = performance.now();
  settings.subscribe((s) => {
    allowed = !(s.reducedMotion || s.lowPowerMode);
    sync();
  });
  onVisibilityChange(sync);
}

/** Subscribes to the ambient clock. The callback runs once immediately, then ~10 times a second. */
export function onAmbientTick(fn: Tick): () => void {
  init();
  subs.add(fn);
  fn(now());
  sync();
  return () => {
    subs.delete(fn);
    sync();
  };
}

/** Test/diagnostic helper. */
export function ambientTimerRunning(): boolean {
  return timer !== undefined;
}
