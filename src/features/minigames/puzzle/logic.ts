/**
 * Pastel Puzzle rules: a picture is cut into columns x rows tiles and scrambled;
 * pick one tile, then another, to swap them. Pure logic, no DOM.
 * `order[position] = tileId`; a tile is home when its id equals its position.
 */
import type { Rng } from '../../../core/rng';

export type SelectResult = 'selected' | 'deselected' | 'swapped' | 'ignored';

export class PuzzleGame {
  order: number[];
  swaps = 0;
  selected: number | null = null;

  constructor(
    readonly columns: number,
    readonly rows: number,
    rng: Rng
  ) {
    this.order = scramble(columns * rows, rng);
  }

  get size() {
    return this.columns * this.rows;
  }

  get solved() {
    return this.order.every((t, p) => t === p);
  }

  /** Number of tiles currently in the right place. */
  get home() {
    return this.order.filter((t, p) => t === p).length;
  }

  isHome(position: number) {
    return this.order[position] === position;
  }

  select(position: number): SelectResult {
    if (position < 0 || position >= this.size || this.solved) return 'ignored';
    if (this.selected === null) {
      this.selected = position;
      return 'selected';
    }
    if (this.selected === position) {
      this.selected = null;
      return 'deselected';
    }
    const a = this.selected;
    [this.order[a], this.order[position]] = [this.order[position], this.order[a]];
    this.selected = null;
    this.swaps++;
    return 'swapped';
  }

  /** A tile that is out of place together with the position it belongs in (for hints). */
  hint(rng: Rng): { tile: number; target: number } | null {
    const wrong = this.order.map((t, p) => (t === p ? -1 : p)).filter((p) => p >= 0);
    if (!wrong.length) return null;
    const position = wrong[Math.floor(rng() * wrong.length)];
    return { tile: this.order[position], target: this.order[position] };
  }
}

/** A scramble where (when possible) no tile starts in its right place, and which is never already solved. */
export function scramble(n: number, rng: Rng): number[] {
  const ids = Array.from({ length: n }, (_, i) => i);
  for (let attempt = 0; attempt < 200; attempt++) {
    const a = [...ids];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.every((t, p) => t !== p)) return a;
  }
  // cyclic shift is always a derangement
  return ids.map((_, p) => (p + 1) % n);
}
