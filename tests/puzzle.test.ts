import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { PuzzleGame, scramble } from '../src/features/minigames/puzzle/logic';
import { GAMES, gameById } from '../src/features/minigames/games';

describe('Pastel Puzzle rules', () => {
  it('scrambles into a permutation with no piece already home, for every level size', () => {
    for (const n of [6, 9, 12, 20, 24]) {
      const order = scramble(n, createRng(n));
      expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(order.every((t, p) => t !== p)).toBe(true);
    }
  });

  it('a new game is never already solved', () => {
    for (let seed = 1; seed <= 25; seed++) expect(new PuzzleGame(3, 2, createRng(seed)).solved).toBe(false);
  });

  it('select / select swaps two pieces and counts one swap', () => {
    const g = new PuzzleGame(3, 2, createRng(4));
    const [a, b] = [g.order[0], g.order[1]];
    expect(g.select(0)).toBe('selected');
    expect(g.select(1)).toBe('swapped');
    expect(g.order[0]).toBe(b);
    expect(g.order[1]).toBe(a);
    expect(g.swaps).toBe(1);
    expect(g.selected).toBeNull();
  });

  it('picking the same piece again just un-picks it', () => {
    const g = new PuzzleGame(3, 2, createRng(4));
    g.select(2);
    expect(g.select(2)).toBe('deselected');
    expect(g.swaps).toBe(0);
  });

  it('can always be solved by swapping, and then stops accepting moves', () => {
    const g = new PuzzleGame(4, 3, createRng(9));
    let guard = 0;
    while (!g.solved && guard++ < 100) {
      const p = g.order.findIndex((t, i) => t !== i);
      const where = g.order.indexOf(p);
      g.select(p);
      g.select(where);
    }
    expect(g.solved).toBe(true);
    expect(g.home).toBe(12);
    expect(g.select(0)).toBe('ignored');
  });

  it('pieces are never locked: a correct piece can be swapped out again', () => {
    const g = new PuzzleGame(3, 2, createRng(2));
    const p = g.order.findIndex((t, i) => t !== i);
    const home = g.order.indexOf(p);
    g.select(p);
    g.select(home);
    expect(g.isHome(p)).toBe(true);
    g.select(p);
    expect(g.select(home)).toBe('swapped');
    expect(g.isHome(p)).toBe(false);
  });

  it('hints name a piece that is out of place', () => {
    const g = new PuzzleGame(3, 2, createRng(5));
    const h = g.hint(createRng(1))!;
    expect(g.order.indexOf(h.tile)).not.toBe(h.target);
  });
});

describe('mini-games list', () => {
  it('has four games with a preview image and a unique id each', () => {
    expect(GAMES.map((g) => g.id)).toEqual(['breaker', 'splash', 'memory', 'puzzle']);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(4);
    for (const g of GAMES) {
      expect(g.cover).toBeTruthy();
      expect(g.title.length).toBeGreaterThan(3);
    }
    expect(gameById('memory')?.title).toBe('Memory Meadow');
    expect(gameById('nope')).toBeUndefined();
  });
});
