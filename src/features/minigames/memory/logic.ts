/**
 * Memory Meadow rules. Pure and deterministic given an RNG: no DOM, no timers.
 * The screen decides *when* to call clearMismatch() (after a short pause).
 */
import type { Rng } from '../../../core/rng';

export interface Card {
  id: number;
  symbol: string;
  faceUp: boolean;
  matched: boolean;
}

export type FlipResult = 'ignored' | 'flipped' | 'match' | 'mismatch';

export function shuffle<T>(list: T[], rng: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class MemoryGame {
  cards: Card[];
  moves = 0;
  matches = 0;
  /** index of the first card of the current turn */
  private first: number | null = null;
  /** two face-up cards that did not match; they turn back on clearMismatch() */
  private pending: [number, number] | null = null;

  constructor(
    readonly symbols: string[],
    rng: Rng
  ) {
    const deck = shuffle([...symbols, ...symbols], rng);
    this.cards = deck.map((symbol, id) => ({ id, symbol, faceUp: false, matched: false }));
  }

  get pairs() {
    return this.symbols.length;
  }

  get complete() {
    return this.matches === this.pairs;
  }

  get hasMismatch() {
    return this.pending !== null;
  }

  flip(i: number): FlipResult {
    const c = this.cards[i];
    if (!c || c.matched) return 'ignored';
    // flipping while a wrong pair is still showing simply turns that pair back first
    if (this.pending) this.clearMismatch();
    if (c.faceUp) return 'ignored';
    c.faceUp = true;
    if (this.first === null) {
      this.first = i;
      return 'flipped';
    }
    const a = this.cards[this.first];
    this.moves++;
    if (a.symbol === c.symbol) {
      a.matched = c.matched = true;
      this.matches++;
      this.first = null;
      return 'match';
    }
    this.pending = [this.first, i];
    this.first = null;
    return 'mismatch';
  }

  clearMismatch() {
    if (!this.pending) return;
    for (const i of this.pending) this.cards[i].faceUp = false;
    this.pending = null;
  }

  /** A pair that is still hidden, to nudge the player. Never reveals anything by itself. */
  hint(rng: Rng): [number, number] | null {
    const open = this.first !== null ? this.cards[this.first].symbol : null;
    const hidden = new Map<string, number[]>();
    this.cards.forEach((c, i) => {
      if (c.matched) return;
      const list = hidden.get(c.symbol) ?? [];
      list.push(i);
      hidden.set(c.symbol, list);
    });
    const pairs = [...hidden.values()].filter((l) => l.length === 2);
    if (!pairs.length) return null;
    // if one card is already face up, point at its partner's pair
    const preferred = open ? pairs.find((l) => this.cards[l[0]].symbol === open) : undefined;
    const pick = preferred ?? pairs[Math.floor(rng() * pairs.length)];
    return [pick[0], pick[1]];
  }
}
