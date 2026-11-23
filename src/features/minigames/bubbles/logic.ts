/**
 * Bubble Garden rules. Pure and deterministic given an RNG, so they can be tested without a canvas.
 *
 * There is no timer, no score to reach and no way to lose. Bubbles drift up and gently away.
 * You can pop them, or drag a bubble onto one of the same color to merge them into a bigger one.
 * In Color Match a soft request (for example "pop 4 pink bubbles") appears; finishing a request
 * just brings the next one, and a few requests complete a round with a gentle finish.
 */
import type { BubbleLevel } from '../../../core/manifests14';

export const FIELD_W = 900;
export const FIELD_H = 580;
export const MAX_BUBBLES = 36;

export type BubbleMode = 'relax' | 'match' | 'endless';

export interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  /** Sideways sway phase. */
  phase: number;
  /** True while the player is holding it. */
  held: boolean;
}

export interface Request {
  color: string;
  need: number;
  got: number;
}

export interface BubbleEvents {
  onPop?: (b: Bubble, merged: boolean) => void;
  onMerge?: (b: Bubble) => void;
  onRequestDone?: () => void;
  onFinish?: () => void;
}

export class BubbleGarden {
  bubbles: Bubble[] = [];
  request: Request | null = null;
  /** Requests completed so far. */
  completed = 0;
  popped = 0;
  finished = false;
  private nextId = 1;
  private spawnAcc = 0;
  private time = 0;

  constructor(
    readonly level: BubbleLevel,
    readonly mode: BubbleMode,
    private rng: () => number = Math.random,
    private events: BubbleEvents = {},
    /** 1 normally; lower when the player prefers less motion. */
    private calm = 1
  ) {
    // Start with a gentle handful, spread over the field, so there is something to see at once.
    for (let i = 0; i < 9; i++) this.spawn(this.rng() * (FIELD_H - 160) + 80);
    if (mode !== 'relax') this.newRequest();
  }

  private pickColor(): string {
    const p = this.level.palette;
    return p[Math.floor(this.rng() * p.length)];
  }

  private spawn(y = FIELD_H + 60): Bubble | null {
    if (this.bubbles.length >= MAX_BUBBLES) return null;
    const [lo, hi] = this.level.size;
    const r = lo + this.rng() * (hi - lo);
    const b: Bubble = { id: this.nextId++, x: r + this.rng() * (FIELD_W - 2 * r), y, r, color: this.pickColor(), phase: this.rng() * 6.28, held: false };
    this.bubbles.push(b);
    return b;
  }

  private newRequest() {
    // Ask for a color that is actually on screen, so a request can always be met.
    const onScreen = [...new Set(this.bubbles.map((b) => b.color))];
    const color = onScreen.length ? onScreen[Math.floor(this.rng() * onScreen.length)] : this.pickColor();
    this.request = { color, need: 3 + Math.floor(this.rng() * 3), got: 0 };
  }

  update(dt: number) {
    this.time += dt;
    this.spawnAcc += dt * this.level.spawn * this.calm;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      this.spawn();
    }
    const drift = this.level.speed * this.calm;
    for (const b of this.bubbles) {
      if (b.held) continue;
      // Bigger bubbles drift a touch slower: it feels heavier and calmer.
      b.y -= drift * dt * (0.8 + 24 / (b.r + 24));
      b.x += Math.sin(this.time * 0.8 + b.phase) * 14 * dt * this.calm;
      b.x = Math.max(b.r, Math.min(FIELD_W - b.r, b.x));
    }
    // Bubbles that float off the top simply disappear; others take their place.
    this.bubbles = this.bubbles.filter((b) => b.held || b.y + b.r > -30);
    // Keep a request possible: if its color has all floated away, ask for another.
    if (this.request && !this.bubbles.some((b) => b.color === this.request!.color)) this.spawnColor(this.request.color);
  }

  private spawnColor(color: string) {
    const b = this.spawn();
    if (b) b.color = color;
  }

  /** The front-most bubble under a point (later ones are drawn on top). */
  at(x: number, y: number): Bubble | null {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (Math.hypot(b.x - x, b.y - y) <= b.r) return b;
    }
    return null;
  }

  private count(b: Bubble, weight = 1) {
    this.popped += weight;
    if (!this.request || b.color !== this.request.color) return;
    this.request.got += weight;
    if (this.request.got >= this.request.need) {
      this.completed++;
      this.events.onRequestDone?.();
      if (this.mode === 'match' && this.completed >= this.level.rounds && !this.finished) {
        this.finished = true;
        this.request = null;
        this.events.onFinish?.();
      } else {
        this.newRequest();
      }
    }
  }

  pop(id: number, merged = false): boolean {
    const i = this.bubbles.findIndex((b) => b.id === id);
    if (i < 0) return false;
    const [b] = this.bubbles.splice(i, 1);
    this.events.onPop?.(b, merged);
    this.count(b, merged ? 2 : 1);
    return true;
  }

  /** Moves a held bubble. */
  drag(id: number, x: number, y: number) {
    const b = this.bubbles.find((q) => q.id === id);
    if (!b) return;
    b.held = true;
    b.x = Math.max(b.r, Math.min(FIELD_W - b.r, x));
    b.y = Math.max(b.r, Math.min(FIELD_H - b.r, y));
  }

  /**
   * Lets go of a bubble. If it overlaps another of the same color they merge into one bigger
   * bubble (area is added). A very big merged bubble blooms: it pops into sparkles and counts double.
   */
  release(id: number): { merged: boolean; bloomed: boolean } {
    const b = this.bubbles.find((q) => q.id === id);
    if (!b) return { merged: false, bloomed: false };
    b.held = false;
    const other = this.bubbles.find((q) => q.id !== b.id && q.color === b.color && Math.hypot(q.x - b.x, q.y - b.y) < (q.r + b.r) * 0.9);
    if (!other) return { merged: false, bloomed: false };
    const maxR = this.level.size[1] * 1.7;
    const r = Math.sqrt(b.r * b.r + other.r * other.r);
    this.bubbles = this.bubbles.filter((q) => q.id !== b.id);
    other.x = (other.x * other.r + b.x * b.r) / (other.r + b.r);
    other.y = (other.y * other.r + b.y * b.r) / (other.r + b.r);
    other.r = Math.min(r, maxR);
    this.events.onMerge?.(other);
    if (r >= maxR) {
      this.pop(other.id, true);
      return { merged: true, bloomed: true };
    }
    return { merged: true, bloomed: false };
  }

  /** Starts over with a fresh round (used by "Play again"). */
  static fresh(level: BubbleLevel, mode: BubbleMode, rng: () => number, events: BubbleEvents, calm = 1) {
    return new BubbleGarden(level, mode, rng, events, calm);
  }
}
