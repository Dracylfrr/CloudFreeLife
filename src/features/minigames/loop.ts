import { get } from 'svelte/store';
import { settings } from '../../core/settings';

/**
 * requestAnimationFrame loop with an FPS cap. It stops completely while the
 * window is hidden or minimised, so a paused game uses no CPU at all.
 */
export class GameLoop {
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  private onVis = () => {
    if (document.hidden) this.halt();
    else if (this.running) this.kick();
  };

  constructor(
    private tick: (dt: number) => void,
    private draw: () => void
  ) {
    document.addEventListener('visibilitychange', this.onVis);
  }

  private targetInterval(): number {
    const s = get(settings);
    return s.fps30 || s.lowPowerMode ? 1000 / 30 : 1000 / 60;
  }

  start() {
    this.running = true;
    this.kick();
  }

  stop() {
    this.running = false;
    this.halt();
  }

  private halt() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private kick() {
    if (this.raf || document.hidden) return;
    this.last = performance.now();
    this.acc = 0;
    const frame = (now: number) => {
      this.raf = requestAnimationFrame(frame);
      this.acc += now - this.last;
      this.last = now;
      const iv = this.targetInterval();
      if (this.acc < iv - 1) return;
      const dt = Math.min(this.acc, 100) / 1000;
      this.acc = 0;
      this.tick(dt);
      this.draw();
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** Draw a single frame without running the loop (used for paused/overlay states). */
  drawOnce() {
    this.draw();
  }

  dispose() {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVis);
  }
}
