// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildCatalog } from '../src/core/content/registry';
import type { SplashObjective } from '../src/core/manifests';
import { createRng } from '../src/core/rng';
import { makeSplat } from '../src/core/splat';
import { BreakerGame, FIELD_W, levelToBlocks, randomLevel } from '../src/features/minigames/breaker/logic';
import { evaluateGoal, WallState } from '../src/features/minigames/splash/wall';
import { RegionMap, buildRegionSvg, encodeRegionColor, extractRegions } from '../src/features/painting/regionMap';
import { DiskTree, readAllText } from './helpers/diskTree';

let levels: Awaited<ReturnType<typeof buildCatalog>>['breakerLevels'];
beforeAll(async () => {
  levels = (await buildCatalog([new DiskTree()])).breakerLevels;
});
afterEach(() => vi.restoreAllMocks());

/** Plays a level headlessly with a paddle that varies where it meets the ball. */
function autoPlay(game: BreakerGame, maxSeconds = 1500) {
  const dt = 1 / 120;
  game.launch();
  let t = 0;
  while (game.status !== 'won' && game.status !== 'over' && t < maxSeconds) {
    const w = game.paddle.w / 2;
    game.setPaddleTarget(game.ball.x + Math.sin(t * 0.9) * w * 0.7);
    game.update(dt);
    if (game.ball.stuck && game.status === 'ready') game.launch();
    t += dt;
  }
  return t;
}

describe('Pastel Breaker', () => {
  it('turns every handcrafted grid into the right blocks', () => {
    for (const l of levels) {
      const blocks = levelToBlocks(l.manifest);
      const cells = l.manifest.grid.join('').replace(/[. ]/g, '').length;
      expect(blocks.length, l.folder).toBe(cells);
      for (const b of blocks) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(FIELD_W);
      }
    }
    const castle = levels.find((l) => l.folder === '03_castle_blocks')!;
    expect(levelToBlocks(castle.manifest).some((b) => b.maxHp === 2)).toBe(true);
  });

  it('every handcrafted level can be cleared in Relax mode', () => {
    let seed = 7;
    vi.spyOn(Math, 'random').mockImplementation(() => ((seed = (seed * 16807) % 2147483647) / 2147483647));
    for (const l of levels) {
      const g = new BreakerGame('relax');
      g.loadBlocks(levelToBlocks(l.manifest));
      autoPlay(g);
      expect(g.status, l.folder).toBe('won');
      expect(g.remaining).toBe(0);
    }
  });

  it('Relax mode has no lives and brings the ball back automatically', () => {
    const g = new BreakerGame('relax');
    expect(g.lives).toBeNull();
    g.loadBlocks(levelToBlocks(levels[0].manifest));
    g.launch();
    g.ball.y = 700; // fall past the paddle
    g.setPaddleTarget(0);
    for (let i = 0; i < 20; i++) g.update(1 / 60);
    expect(g.status).not.toBe('over');
    expect(g.ball.stuck || g.ball.y < 700).toBe(true);
  });

  it('Classic mode ends after three lost balls', () => {
    const g = new BreakerGame('classic');
    g.loadBlocks(levelToBlocks(levels[0].manifest));
    let guard = 0;
    while (g.status !== 'over' && guard++ < 20000) {
      g.setPaddleTarget(g.ball.x > FIELD_W / 2 ? 40 : FIELD_W - 40); // stay out of the way
      if (g.ball.stuck) g.launch();
      g.update(1 / 60);
    }
    expect(g.status).toBe('over');
    expect(g.lives).toBe(0);
  });

  it('two-hit blocks survive the first hit', () => {
    const g = new BreakerGame('classic');
    const blocks = levelToBlocks({ grid: ['.l.'], legend: { l: '#d9cdf6' }, tough: ['l'] });
    g.loadBlocks(blocks);
    const b = blocks[0];
    g.ball.stuck = false;
    g.status = 'playing';
    g.ball.x = b.x + b.w / 2;
    g.ball.y = b.y + b.h + 12;
    g.ball.vx = 0;
    g.ball.vy = -300;
    g.update(0.05);
    expect(b.alive).toBe(true);
    expect(b.hp).toBe(1);
  });

  it('Endless mode generates valid, ever-growing layouts', () => {
    const rng = createRng(3);
    for (let depth = 1; depth <= 8; depth++) {
      const lv = randomLevel(rng, ['#bfe4f7', '#ffd3e2', '#c6ecda'], depth);
      expect(levelToBlocks(lv).length).toBeGreaterThan(10);
    }
  });
});

describe('region maps', () => {
  const ids = ['sky', 'house'];
  it('encodes and decodes region ids from rendered colors', () => {
    const w = 8;
    const h = 4;
    const px = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const x = i % w;
      const id = x < 4 ? 1 : 2;
      px[i * 4] = (id >> 8) & 255;
      px[i * 4 + 1] = id & 255;
      px[i * 4 + 2] = 0;
      px[i * 4 + 3] = 255;
    }
    px.fill(0, 0, 4); // pixel 0 is empty
    const map = RegionMap.fromRgba(px, w, h, ids);
    expect(map.idAt(0, 0)).toBe(0);
    expect(map.idAt(1, 1)).toBe(1);
    expect(map.idAt(6, 2)).toBe(2);
    expect(map.regionKey(2)).toBe('house');
    expect(map.bboxes[2]).toEqual({ x0: 4, y0: 0, x1: 7, y1: 3 });
    expect(map.areas[1]).toBe(15);
    expect(map.idNearest(0, 0, 3)).toBe(1); // clicking on a line snaps to a neighbouring region
    expect(map.idAt(-5, 2)).toBe(0);
    expect(encodeRegionColor(258)).toBe('rgb(1,2,0)');
  });

  it('builds a flat-color region SVG from real line art and lists its regions', async () => {
    const files = await readAllText();
    const svg = files['books/cloud_dreams/pages/01_cloud_castle/lineart.svg'];
    const regions = extractRegions(svg);
    expect(regions.length).toBeGreaterThan(10);
    const out = buildRegionSvg(svg, regions.map((r) => r.id), 640, 480);
    expect(out).toContain('crispEdges');
    expect((out.match(/<path /g) ?? []).length).toBe(regions.length); // detail lines are not part of the map
    expect(out).not.toContain('<circle'); // eyes and other decoration are dropped
    expect((out.match(/data-region=/g) ?? []).length).toBe(regions.length);
    expect(out).toContain(encodeRegionColor(1));
  });
});

describe('splatter and Splash Wall goals', () => {
  it('splatter is reproducible per seed and varies between seeds', () => {
    expect(makeSplat(50, 42)).toEqual(makeSplat(50, 42));
    expect(makeSplat(50, 42)).not.toEqual(makeSplat(50, 43));
    expect(makeSplat(80, 1).extent).toBeGreaterThan(makeSplat(30, 1).extent);
  });

  function wall() {
    const w = 10;
    const h = 10;
    const ids = new Uint16Array(w * h);
    ids.fill(1, 0, 50); // region 1: top half
    ids.fill(2, 50, 100); // region 2: bottom half
    const map = new RegionMap(ids, w, h, ['top', 'bottom']);
    return new WallState(map, ['#ff0000', '#00ff00']);
  }

  it('tracks coverage and region progress', () => {
    const s = wall();
    for (let i = 0; i < 50; i++) s.paint(i, 1, 1);
    expect(s.coverage()).toBe(0.5);
    expect(s.regionFraction(1)).toBe(1);
    s.paint(0, 1, 2); // repainting a pixel does not double count
    expect(s.coverage()).toBe(0.5);
    expect(evaluateGoal({ type: 'coverage', target: 0.5 }, s).done).toBe(true);
    expect(evaluateGoal({ type: 'coverage', target: 0.9 }, s).done).toBe(false);
    expect(evaluateGoal({ type: 'free' }, s).done).toBe(false);
  });

  it('region goals need most (four fifths) of each region painted', () => {
    const s = wall();
    for (let i = 0; i < 50; i++) s.paint(i, 1, 1);
    const g: SplashObjective = { type: 'regions', regions: ['top', 'bottom'] };
    expect(evaluateGoal(g, s).done).toBe(false);
    for (let i = 50; i < 80; i++) s.paint(i, 2, 2); // 60% is not yet enough
    expect(evaluateGoal(g, s).done).toBe(false);
    for (let i = 80; i < 92; i++) s.paint(i, 2, 2);
    const done = evaluateGoal(g, s);
    expect(done.done).toBe(true);
    expect(done.items.every((i) => i.done)).toBe(true);
  });

  it('color-match goals check the color painted, and repainting changes the answer', () => {
    const s = wall();
    const g: SplashObjective = { type: 'color_match', targets: { top: '#ff0000', bottom: '#00ff00' } };
    for (let i = 0; i < 50; i++) s.paint(i, 1, 1);
    for (let i = 50; i < 100; i++) s.paint(i, 2, 1); // wrong color on the bottom
    let r = evaluateGoal(g, s);
    expect(r.items.map((i) => i.done)).toEqual([true, false]);
    for (let i = 50; i < 100; i++) s.paint(i, 2, 2); // recolor it
    r = evaluateGoal(g, s);
    expect(r.done).toBe(true);
  });

  it('reset clears all progress', () => {
    const s = wall();
    for (let i = 0; i < 100; i++) s.paint(i, i < 50 ? 1 : 2, 1);
    s.reset();
    expect(s.coverage()).toBe(0);
  });
});
