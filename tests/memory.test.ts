import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { MEMORY_ICON_IDS } from '../src/core/manifests';
import { MemoryGame, shuffle } from '../src/features/minigames/memory/logic';
import { MEMORY_ICONS, iconSvg } from '../src/features/minigames/memory/icons';

const rng = () => createRng(11);
const symbols = ['cloud', 'star', 'moon'];

function pairOf(g: MemoryGame, symbol: string) {
  return g.cards.filter((c) => c.symbol === symbol).map((c) => c.id) as [number, number];
}

describe('Memory Meadow rules', () => {
  it('deals every symbol exactly twice, shuffled reproducibly', () => {
    const g = new MemoryGame(symbols, rng());
    expect(g.cards).toHaveLength(6);
    for (const s of symbols) expect(g.cards.filter((c) => c.symbol === s)).toHaveLength(2);
    expect(new MemoryGame(symbols, rng()).cards.map((c) => c.symbol)).toEqual(g.cards.map((c) => c.symbol));
    expect(shuffle([1, 2, 3, 4, 5, 6, 7, 8], createRng(5)).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('matches a pair, counts one try, and keeps the cards face up', () => {
    const g = new MemoryGame(symbols, rng());
    const [a, b] = pairOf(g, 'star');
    expect(g.flip(a)).toBe('flipped');
    expect(g.moves).toBe(0); // a try is two flips
    expect(g.flip(b)).toBe('match');
    expect(g.moves).toBe(1);
    expect(g.matches).toBe(1);
    expect(g.cards[a].matched && g.cards[b].matched).toBe(true);
    expect(g.flip(a)).toBe('ignored'); // matched cards cannot be flipped again
  });

  it('a wrong pair stays visible until it is cleared, then turns back', () => {
    const g = new MemoryGame(symbols, rng());
    const a = pairOf(g, 'cloud')[0];
    const b = pairOf(g, 'moon')[0];
    g.flip(a);
    expect(g.flip(b)).toBe('mismatch');
    expect(g.hasMismatch).toBe(true);
    expect(g.cards[a].faceUp && g.cards[b].faceUp).toBe(true);
    g.clearMismatch();
    expect(g.cards[a].faceUp || g.cards[b].faceUp).toBe(false);
    expect(g.hasMismatch).toBe(false);
  });

  it('clicking a new card while a wrong pair shows turns that pair back first (never blocks the player)', () => {
    const g = new MemoryGame(symbols, rng());
    const a = pairOf(g, 'cloud')[0];
    const b = pairOf(g, 'moon')[0];
    const c = pairOf(g, 'star')[0];
    g.flip(a);
    g.flip(b);
    expect(g.flip(c)).toBe('flipped');
    expect(g.cards[a].faceUp || g.cards[b].faceUp).toBe(false);
    expect(g.cards[c].faceUp).toBe(true);
  });

  it('cannot flip the same face-up card twice', () => {
    const g = new MemoryGame(symbols, rng());
    g.flip(0);
    expect(g.flip(0)).toBe('ignored');
    expect(g.moves).toBe(0);
  });

  it('completes when every pair is found, with no way to lose', () => {
    const g = new MemoryGame(symbols, rng());
    for (const s of symbols) {
      const [a, b] = pairOf(g, s);
      g.flip(a);
      g.flip(b);
    }
    expect(g.complete).toBe(true);
    expect(g.moves).toBe(3);
  });

  it('hints point at a real hidden pair and never reveal or change anything', () => {
    const g = new MemoryGame(symbols, rng());
    const before = JSON.stringify(g.cards);
    const h = g.hint(rng())!;
    expect(g.cards[h[0]].symbol).toBe(g.cards[h[1]].symbol);
    expect(h[0]).not.toBe(h[1]);
    expect(JSON.stringify(g.cards)).toBe(before);
    for (const s of symbols) {
      const [a, b] = pairOf(g, s);
      g.flip(a);
      g.flip(b);
    }
    expect(g.hint(rng())).toBeNull();
  });

  it('with one card face up, the hint points at that card\'s pair', () => {
    const g = new MemoryGame(symbols, rng());
    const [a, b] = pairOf(g, 'moon');
    g.flip(a);
    expect(g.hint(rng())!.sort()).toEqual([a, b].sort());
  });
});

describe('Memory Meadow pictures', () => {
  it('has a drawing for every allowed picture id, and only those', () => {
    expect(Object.keys(MEMORY_ICONS).sort()).toEqual([...MEMORY_ICON_IDS].sort());
    for (const id of MEMORY_ICON_IDS) {
      const svg = iconSvg(id);
      expect(svg).toContain('<svg');
      expect(svg).not.toMatch(/<script|href=|onload/i);
    }
  });
});
