/**
 * Paint Flow rules. A small square board has pairs of matching colored dots. Drag from one dot
 * through neighbouring squares to its partner to paint a path. Paths never cross: drawing over
 * another color gently clears that path. The board is complete when every pair is joined.
 * Nothing is timed and there are no move limits, and Undo, Reset and Hint are always free.
 */
import type { Cell, FlowLevel, FlowPair } from '../../../core/manifests14';

export type { Cell, FlowPair };

const key = (c: Cell) => `${c[0]},${c[1]}`;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
const near = (a: Cell, b: Cell) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;

export class FlowBoard {
  readonly size: number;
  readonly pairs: FlowPair[];
  /** One path per pair (index = pair index); empty when not drawn. */
  paths: Cell[][];
  /** Undo history: each entry is a snapshot of all paths. */
  private history: Cell[][][] = [];
  private active = -1;
  private hintsGiven = 0;

  constructor(
    level: Pick<FlowLevel, 'size' | 'pairs'>,
    readonly solution?: Cell[][]
  ) {
    this.size = level.size;
    this.pairs = level.pairs;
    this.paths = level.pairs.map(() => []);
  }

  /** The pair (index) whose dot is at this cell, or -1. */
  endpointAt(c: Cell): number {
    return this.pairs.findIndex((p) => same(p.a, c) || same(p.b, c));
  }

  /** Which pair's path passes through this cell, or -1. */
  owner(c: Cell): number {
    return this.paths.findIndex((p) => p.some((q) => same(q, c)));
  }

  private snapshot() {
    this.history.push(this.paths.map((p) => p.map((c) => [c[0], c[1]] as Cell)));
    if (this.history.length > 200) this.history.shift();
  }

  /** Starts a stroke on a dot (or on the end of an existing path of that color). Returns the pair index or -1. */
  begin(c: Cell): number {
    let i = this.endpointAt(c);
    if (i < 0) {
      // Pressing on a painted square continues that path from there.
      const o = this.owner(c);
      if (o < 0) return -1;
      this.snapshot();
      const idx = this.paths[o].findIndex((q) => same(q, c));
      this.paths[o] = this.paths[o].slice(0, idx + 1);
      this.active = o;
      return o;
    }
    this.snapshot();
    this.paths[i] = [c];
    this.active = i;
    return i;
  }

  /** Extends the active stroke into a neighbouring cell (or steps back). */
  extend(c: Cell): boolean {
    const i = this.active;
    if (i < 0) return false;
    const path = this.paths[i];
    const last = path[path.length - 1];
    if (!last || same(last, c) || !near(last, c)) return false;
    if (c[0] < 0 || c[1] < 0 || c[0] >= this.size || c[1] >= this.size) return false;
    // Stepping back onto the previous cell erases the last step.
    if (path.length > 1 && same(path[path.length - 2], c)) {
      path.pop();
      return true;
    }
    // A finished path cannot be extended past its partner dot.
    const pair = this.pairs[i];
    const other = same(path[0], pair.a) ? pair.b : pair.a;
    if (same(last, other)) return false;
    // Another color's dot is a wall.
    const ep = this.endpointAt(c);
    if (ep >= 0 && ep !== i) return false;
    if (ep === i && !same(c, other)) return false; // that is our own start dot
    // Crossing another path clears it (gently), never blocks.
    const o = this.owner(c);
    if (o >= 0 && o !== i) this.paths[o] = [];
    // Running into our own path trims back to that point.
    const self = path.findIndex((q) => same(q, c));
    if (self >= 0) {
      this.paths[i] = path.slice(0, self + 1);
      return true;
    }
    path.push(c);
    return true;
  }

  end() {
    const i = this.active;
    this.active = -1;
    if (i >= 0 && !this.isConnected(i)) {
      // A half-finished path stays until it is redrawn, so nothing is lost by a slip.
    }
  }

  isConnected(i: number): boolean {
    const p = this.paths[i];
    const pair = this.pairs[i];
    if (p.length < 2) return false;
    const a = p[0];
    const b = p[p.length - 1];
    return (same(a, pair.a) && same(b, pair.b)) || (same(a, pair.b) && same(b, pair.a));
  }

  get connectedCount() {
    return this.pairs.filter((_, i) => this.isConnected(i)).length;
  }
  get solved() {
    return this.connectedCount === this.pairs.length;
  }
  /** Fraction of the board covered by paths. */
  get filled() {
    const n = this.paths.reduce((s, p) => s + p.length, 0);
    return n / (this.size * this.size);
  }

  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.paths = prev;
    this.active = -1;
    return true;
  }

  reset() {
    if (this.paths.some((p) => p.length)) this.snapshot();
    this.paths = this.pairs.map(() => []);
    this.active = -1;
  }

  /** Reveals one pair's route (the next one not yet connected). Returns the pair index, or -1. */
  hint(): number {
    if (!this.solution) return -1;
    const i = this.pairs.findIndex((_, k) => !this.isConnected(k));
    if (i < 0) return -1;
    this.snapshot();
    const sol = this.solution[i];
    for (const c of sol) {
      const o = this.owner(c);
      if (o >= 0 && o !== i) this.paths[o] = [];
    }
    this.paths[i] = sol.map((c) => [c[0], c[1]] as Cell);
    this.hintsGiven++;
    return i;
  }

  get hints() {
    return this.hintsGiven;
  }
}

/** True when a solution really joins every pair without overlapping (used by tests and the generator). */
export function solutionIsValid(level: Pick<FlowLevel, 'size' | 'pairs'>, solution: Cell[][]): boolean {
  if (solution.length !== level.pairs.length) return false;
  const seen = new Set<string>();
  for (const [i, path] of solution.entries()) {
    const pr = level.pairs[i];
    if (path.length < 2) return false;
    const ends = [key(path[0]), key(path[path.length - 1])];
    if (!ends.includes(key(pr.a)) || !ends.includes(key(pr.b))) return false;
    for (let k = 0; k < path.length; k++) {
      if (k && !near(path[k - 1], path[k])) return false;
      if (seen.has(key(path[k]))) return false;
      seen.add(key(path[k]));
    }
  }
  return true;
}

/**
 * A fresh random board for Relax mode: a random winding path that visits every square,
 * cut into pieces, so a solution always exists.
 */
export function randomBoard(size: number, pairCount: number, colors: string[], rng: () => number = Math.random): { level: Pick<FlowLevel, 'size' | 'pairs'>; solution: Cell[][] } {
  const n = size * size;
  for (let attempt = 0; attempt < 400; attempt++) {
    const visited = new Set<string>();
    const order: Cell[] = [];
    const start: Cell = [Math.floor(rng() * size), Math.floor(rng() * size)];
    const dirs: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const free = (c: Cell) => dirs.map((d) => [c[0] + d[0], c[1] + d[1]] as Cell).filter((q) => q[0] >= 0 && q[1] >= 0 && q[0] < size && q[1] < size && !visited.has(key(q)));
    let cur = start;
    visited.add(key(cur));
    order.push(cur);
    while (order.length < n) {
      const opts = free(cur);
      if (!opts.length) break;
      // Prefer the neighbour with the fewest onward options (keeps the path from trapping itself), with a little randomness.
      const scored = opts.map((q) => ({ q, s: free(q).length + rng() * 1.4 })).sort((a, b) => a.s - b.s);
      cur = scored[0].q;
      visited.add(key(cur));
      order.push(cur);
    }
    if (order.length < n) continue;
    // Cut the single path into `pairCount` pieces of at least 2 squares.
    const cuts = new Set<number>();
    let guard = 0;
    while (cuts.size < pairCount - 1 && guard++ < 500) cuts.add(2 + Math.floor(rng() * (n - 3)));
    const points = [0, ...[...cuts].sort((a, b) => a - b), n];
    const pieces: Cell[][] = [];
    for (let i = 0; i < points.length - 1; i++) pieces.push(order.slice(points[i], points[i + 1]));
    if (pieces.length !== pairCount || pieces.some((p) => p.length < 2)) continue;
    const pairs: FlowPair[] = pieces.map((p, i) => ({ color: colors[i % colors.length], a: p[0], b: p[p.length - 1] }));
    return { level: { size, pairs }, solution: pieces };
  }
  throw new Error('could not build a board');
}
