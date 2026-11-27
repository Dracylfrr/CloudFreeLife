/**
 * Wall state for Splash Wall: which pixels have been painted, in which
 * colour, and whether the level's goal has been reached. Pure data - no DOM -
 * so it can be unit-tested.
 */
import type { SplashObjective } from '../../../core/manifests';
import type { RegionMap } from '../../painting/regionMap';

export const WALL_W = 1000;
export const WALL_H = 750;

export interface GoalItem {
  id: string;
  name: string;
  color?: string;
  done: boolean;
  progress: number;
}

export interface GoalStatus {
  done: boolean;
  progress: number;
  label: string;
  items: GoalItem[];
}

/** A region counts as "done" when this fraction of it has been painted. */
export const REGION_DONE = 0.8;

export class WallState {
  /** palette index (1-based) of the colour painted at each pixel; 0 = unpainted */
  readonly idx: Uint8Array;
  /** per-region pixel counts per palette index */
  private counts: Uint32Array[];
  private painted: Uint32Array;
  private totalArea = 0;

  constructor(
    readonly map: RegionMap,
    readonly palette: string[]
  ) {
    this.idx = new Uint8Array(map.width * map.height);
    const n = map.regionIds.length + 1;
    this.counts = Array.from({ length: n }, () => new Uint32Array(palette.length + 1));
    this.painted = new Uint32Array(n);
    for (let i = 1; i < n; i++) this.totalArea += map.areas[i];
  }

  reset() {
    this.idx.fill(0);
    for (const c of this.counts) c.fill(0);
    this.painted.fill(0);
  }

  /** Records that pixel `i` (belonging to region `regionId`) is now colour `colorIdx` (1-based). */
  paint(i: number, regionId: number, colorIdx: number) {
    const old = this.idx[i];
    if (old === colorIdx) return;
    const c = this.counts[regionId];
    if (old) c[old]--;
    else this.painted[regionId]++;
    c[colorIdx]++;
    this.idx[i] = colorIdx;
  }

  regionFraction(regionId: number): number {
    const a = this.map.areas[regionId];
    return a ? this.painted[regionId] / a : 0;
  }

  colorFraction(regionId: number, colorIdx: number): number {
    const a = this.map.areas[regionId];
    return a && colorIdx > 0 ? this.counts[regionId][colorIdx] / a : 0;
  }

  coverage(): number {
    let p = 0;
    for (let i = 1; i < this.painted.length; i++) p += this.painted[i];
    return this.totalArea ? p / this.totalArea : 0;
  }

  regionIndex(id: string): number {
    return this.map.regionIds.indexOf(id) + 1;
  }
}

function pretty(id: string) {
  return id.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

export function evaluateGoal(goal: SplashObjective, wall: WallState, names: Record<string, string> = {}): GoalStatus {
  const nm = (id: string) => names[id] ?? pretty(id);
  if (goal.type === 'free') return { done: false, progress: 0, label: 'Free play — splash as you like', items: [] };
  if (goal.type === 'coverage') {
    const c = wall.coverage();
    const p = Math.min(1, c / goal.target);
    return { done: c >= goal.target, progress: p, label: `${Math.round(Math.min(1, p) * 100)}% of the wall colored`, items: [] };
  }
  if (goal.type === 'regions') {
    const items = goal.regions.map((id) => {
      const r = wall.regionFraction(wall.regionIndex(id));
      return { id, name: nm(id), done: r >= REGION_DONE, progress: Math.min(1, r / REGION_DONE) };
    });
    const done = items.filter((i) => i.done).length;
    return { done: done === items.length, progress: done / items.length, label: `${done} of ${items.length} painted`, items };
  }
  const entries = Object.entries(goal.targets);
  const items = entries.map(([id, hex]) => {
    const cIdx = wall.palette.findIndex((c) => c.toLowerCase() === hex.toLowerCase()) + 1;
    const f = wall.colorFraction(wall.regionIndex(id), cIdx);
    return { id, name: nm(id), color: hex, done: f >= REGION_DONE, progress: Math.min(1, f / REGION_DONE) };
  });
  const done = items.filter((i) => i.done).length;
  return { done: done === items.length, progress: done / items.length, label: `${done} of ${items.length} matched`, items };
}
