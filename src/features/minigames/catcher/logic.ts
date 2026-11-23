/**
 * Cloud Catcher rules. Soft clouds, stars, moons, drops and petals drift across the sky. Drag
 * one gently into a zone (or click it, and it floats there by itself). A wrong zone is never a
 * mistake: the item just drifts on. No timer, no lives, nothing to lose.
 */
import type { CatcherKind, CatcherLevel, CatcherZone } from '../../../core/manifests14';

export const FIELD_W = 900;
export const FIELD_H = 580;
export const MAX_ITEMS = 14;
export const ZONE_H = 120;

export type CatcherMode = 'relax' | 'match' | 'pattern' | 'endless';

export interface Drifter {
  id: number;
  kind: CatcherKind;
  color: string;
  x: number;
  y: number;
  r: number;
  vx: number;
  phase: number;
  held: boolean;
  /** Set while it floats into a zone. */
  settling: { zone: string; t: number; fromX: number; fromY: number } | null;
}

export interface PlacedZone extends CatcherZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CatcherEvents {
  onCatch?: (item: Drifter, zone: PlacedZone) => void;
  onPatternStep?: () => void;
  onFinish?: () => void;
}

/** How many catches finish a Color Match round, and how many times the pattern repeats. */
export const MATCH_GOAL = 10;
export const PATTERN_REPEATS = 3;

export function layoutZones(zones: CatcherZone[], w = FIELD_W, h = FIELD_H): PlacedZone[] {
  const gap = 18;
  const zw = Math.min(250, (w - gap * (zones.length + 1)) / zones.length);
  const total = zones.length * zw + (zones.length - 1) * gap;
  const x0 = (w - total) / 2;
  return zones.map((z, i) => ({ ...z, x: x0 + i * (zw + gap), y: h - ZONE_H - 14, w: zw, h: ZONE_H }));
}

export class CloudCatcher {
  items: Drifter[] = [];
  zones: PlacedZone[];
  caught = 0;
  /** Position in the pattern (0-based, wraps). */
  step = 0;
  repeats = 0;
  finished = false;
  private nextId = 1;
  private spawnAcc = 0;
  private time = 0;

  constructor(
    readonly level: CatcherLevel,
    readonly mode: CatcherMode,
    private rng: () => number = Math.random,
    private events: CatcherEvents = {},
    private calm = 1
  ) {
    this.zones = layoutZones(level.zones);
    for (let i = 0; i < 5; i++) this.spawn(80 + this.rng() * (FIELD_W - 160));
  }

  /** The kind wanted next (Pattern mode), else null. */
  get wanted(): CatcherKind | null {
    return this.mode === 'pattern' ? this.level.pattern[this.step % this.level.pattern.length] : null;
  }

  private spawn(x?: number): Drifter | null {
    if (this.items.length >= MAX_ITEMS) return null;
    const lv = this.level;
    const fromLeft = this.rng() < 0.5;
    const kind = lv.kinds[Math.floor(this.rng() * lv.kinds.length)];
    // In Pattern mode, make sure the wanted kind keeps appearing.
    const want = this.wanted;
    const k = want && this.rng() < 0.45 && lv.kinds.includes(want) ? want : kind;
    const r = 30 + this.rng() * 14;
    const d: Drifter = {
      id: this.nextId++,
      kind: k,
      color: lv.colors[Math.floor(this.rng() * lv.colors.length)],
      x: x ?? (fromLeft ? -r : FIELD_W + r),
      y: 70 + this.rng() * (FIELD_H - ZONE_H - 220),
      r,
      vx: (fromLeft ? 1 : -1) * lv.speed * (0.6 + this.rng() * 0.7),
      phase: this.rng() * 6.28,
      held: false,
      settling: null
    };
    this.items.push(d);
    return d;
  }

  update(dt: number) {
    this.time += dt;
    this.spawnAcc += dt * this.level.spawn * this.calm;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      this.spawn();
    }
    for (const d of this.items) {
      if (d.settling) {
        d.settling.t += dt * 1.6;
        const z = this.zones.find((q) => q.id === d.settling!.zone);
        if (z) {
          const e = Math.min(1, d.settling.t);
          const ease = e * e * (3 - 2 * e);
          d.x = d.settling.fromX + (z.x + z.w / 2 - d.settling.fromX) * ease;
          d.y = d.settling.fromY + (z.y + z.h * 0.45 - d.settling.fromY) * ease;
        }
        continue;
      }
      if (d.held) continue;
      d.x += d.vx * dt * this.calm;
      d.y += Math.sin(this.time * 0.9 + d.phase) * 10 * dt * this.calm;
    }
    this.items = this.items.filter((d) => (d.settling ? d.settling.t < 1.25 : d.held || (d.x > -90 && d.x < FIELD_W + 90)));
  }

  at(x: number, y: number): Drifter | null {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const d = this.items[i];
      if (!d.settling && Math.hypot(d.x - x, d.y - y) <= d.r + 6) return d;
    }
    return null;
  }

  drag(id: number, x: number, y: number) {
    const d = this.items.find((q) => q.id === id);
    if (!d || d.settling) return;
    d.held = true;
    d.x = Math.max(d.r, Math.min(FIELD_W - d.r, x));
    d.y = Math.max(d.r, Math.min(FIELD_H - d.r, y));
  }

  /** Does this zone welcome this item right now? */
  accepts(zone: PlacedZone, item: Drifter): boolean {
    switch (this.mode) {
      case 'relax':
        return true;
      case 'match':
      case 'endless':
        return zone.color.toLowerCase() === item.color.toLowerCase();
      case 'pattern':
        return item.kind === this.wanted && (!zone.kind || zone.kind === item.kind);
    }
  }

  zoneAt(x: number, y: number): PlacedZone | null {
    return this.zones.find((z) => x >= z.x && x <= z.x + z.w && y >= z.y - 20 && y <= z.y + z.h) ?? null;
  }

  /** Lets go of an item. Returns the zone it was welcomed into, if any. */
  drop(id: number): PlacedZone | null {
    const d = this.items.find((q) => q.id === id);
    if (!d) return null;
    d.held = false;
    const z = this.zoneAt(d.x, d.y);
    if (z && this.accepts(z, d)) return this.settle(d, z);
    return null; // it simply drifts on
  }

  /** A click without dragging: the item floats to the first zone that welcomes it. */
  autoCatch(id: number): PlacedZone | null {
    const d = this.items.find((q) => q.id === id);
    if (!d || d.settling) return null;
    const z = this.zones.find((q) => this.accepts(q, d));
    return z ? this.settle(d, z) : null;
  }

  private settle(d: Drifter, z: PlacedZone): PlacedZone {
    d.settling = { zone: z.id, t: 0, fromX: d.x, fromY: d.y };
    d.held = false;
    this.caught++;
    this.events.onCatch?.(d, z);
    if (this.mode === 'pattern') {
      this.step++;
      this.events.onPatternStep?.();
      if (this.step % this.level.pattern.length === 0) {
        this.repeats++;
        if (this.repeats >= PATTERN_REPEATS && !this.finished) this.finish();
      }
    } else if (this.mode === 'match' && this.caught >= MATCH_GOAL && !this.finished) this.finish();
    return z;
  }

  private finish() {
    this.finished = true;
    this.events.onFinish?.();
  }
}
