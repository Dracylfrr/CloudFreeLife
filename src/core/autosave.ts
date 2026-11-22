import { saveStatus } from './feedback';

export interface AutosaveOptions {
  /** Quiet period (ms) after the last change before writing. */
  delay?: number;
  /** Delay before retrying after a failed save. */
  retryDelay?: number;
  /** How long "Saved" stays visible. */
  savedLinger?: number;
  onStatus?: (s: 'saving' | 'saved' | 'error' | 'idle') => void;
}

/**
 * Debounced autosave. Strokes call markDirty() which only (re)arms a timer, so
 * nothing is written to disk while the mouse is moving. flush() writes
 * immediately and is used when changing pages, returning home and on close.
 */
export class Autosaver {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private lingerTimer: ReturnType<typeof setTimeout> | undefined;
  private dirty = false;
  private running: Promise<void> | null = null;
  private disposed = false;
  readonly delay: number;
  private readonly retryDelay: number;
  private readonly savedLinger: number;
  private readonly onStatus: NonNullable<AutosaveOptions['onStatus']>;
  /** Number of completed writes (handy for tests and diagnostics). */
  saves = 0;

  constructor(
    private saveFn: () => Promise<void>,
    opts: AutosaveOptions = {}
  ) {
    this.delay = opts.delay ?? 1500;
    this.retryDelay = opts.retryDelay ?? 5000;
    this.savedLinger = opts.savedLinger ?? 2200;
    this.onStatus = opts.onStatus ?? ((s) => saveStatus.set(s));
  }

  get isDirty() {
    return this.dirty;
  }

  markDirty() {
    if (this.disposed) return;
    this.dirty = true;
    if (this.lingerTimer) clearTimeout(this.lingerTimer);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delay);
  }

  /** Writes now if anything changed. Safe to call repeatedly. */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    // Wait for an in-flight write, then write again if more changes arrived.
    while (this.running) await this.running;
    if (!this.dirty) return;
    this.dirty = false;
    this.onStatus('saving');
    this.running = (async () => {
      try {
        await this.saveFn();
        this.saves++;
        this.onStatus('saved');
        if (this.lingerTimer) clearTimeout(this.lingerTimer);
        this.lingerTimer = setTimeout(() => {
          if (!this.dirty) this.onStatus('idle');
        }, this.savedLinger);
      } catch (err) {
        console.warn('Autosave failed', err);
        this.dirty = true;
        this.onStatus('error');
        if (!this.disposed) this.timer = setTimeout(() => void this.flush(), this.retryDelay);
      }
    })();
    try {
      await this.running;
    } finally {
      this.running = null;
    }
    if (this.dirty && !this.timer && !this.disposed) await this.flush();
  }

  /** Stops timers. Call flush() first if pending work must be kept. */
  dispose() {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.lingerTimer) clearTimeout(this.lingerTimer);
    this.timer = this.lingerTimer = undefined;
  }
}
