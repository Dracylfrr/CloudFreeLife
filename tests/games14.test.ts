// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { buildCatalog, type Catalog } from '../src/core/content/registry';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { validateBubbleLevel, validateCatcherLevel, validateFlowLevel, validateZenLevel, type BubbleLevel, type CatcherKind, type CatcherLevel } from '../src/core/manifests14';
import { BubbleGarden, FIELD_H, FIELD_W, MAX_BUBBLES } from '../src/features/minigames/bubbles/logic';
import { CloudCatcher, MATCH_GOAL, PATTERN_REPEATS, layoutZones, MAX_ITEMS } from '../src/features/minigames/catcher/logic';
import { FlowBoard, randomBoard, solutionIsValid, type Cell } from '../src/features/minigames/flow/logic';
import { ZEN_SETTINGS, bedOf } from '../src/features/minigames/zen/settings';
import { MAX_OBJECTS, MAX_POINTS, MAX_STROKES, addPoint, deleteGarden, duplicateGarden, emptyGarden, listGardens, loadGarden, objectAt, sanitizeGarden, saveGarden, strokeAt } from '../src/features/minigames/zen/gardens';
import { gamesProgress, loadGamesProgress, recordFlowSolved, recordOpened, recordPlayed, sanitizeGames } from '../src/features/minigames/progress';
import { createRng } from '../src/core/rng';
import { DiskTree, readAllText } from './helpers/diskTree';

let catalog: Catalog;
beforeEach(async () => {
  catalog ??= await buildCatalog([new DiskTree()]);
});

const base = { id: 'lvl_one', name: 'L', description: 'd', thumbnail: 't.svg', version: '1.4.0', minAppVersion: '1.4.0', objective: 'o' };
const sky = ['#d6ecfb', '#f2f9ff'];

// ================================================================ bundled levels
describe('the four new games ship real levels', () => {
  it('has the requested number of levels, all valid and compatible', () => {
    expect(catalog.skipped).toEqual([]);
    expect(catalog.bubbleLevels.length).toBeGreaterThanOrEqual(6);
    expect(catalog.catcherLevels.length).toBeGreaterThanOrEqual(6);
    expect(catalog.zenLevels.length).toBe(5);
    expect(catalog.flowLevels.length).toBeGreaterThanOrEqual(12);
  });

  it('names the levels from the request', () => {
    const names = (l: { manifest: { name: string } }[]) => l.map((x) => x.manifest.name);
    expect(names(catalog.bubbleLevels)).toEqual(expect.arrayContaining(['Morning Sky', 'Lavender Evening', 'Garden Bubbles', 'Ocean Mist', 'Peach Sunset', 'Moonlight']));
    expect(names(catalog.catcherLevels)).toEqual(expect.arrayContaining(['Blue Morning', 'Rainbow Drift', 'Star Night', 'Sunset Clouds', 'Moon Garden', 'Floating Islands']));
    expect(names(catalog.zenLevels)).toEqual(expect.arrayContaining(['Warm Sand', 'Lavender Sand', 'Moonlight', 'Garden', 'Seaside']));
  });

  it('every level has its thumbnail on disk, and nothing is locked', async () => {
    const files = await readAllText();
    for (const l of [...catalog.bubbleLevels, ...catalog.catcherLevels, ...catalog.zenLevels, ...catalog.flowLevels]) {
      expect(`${l.dir}/${l.manifest.thumbnail}` in files, l.manifest.id).toBe(true);
      expect(JSON.stringify(l.manifest)).not.toMatch(/lock|unlock|requires/i);
    }
  });

  it('all twelve Paint Flow boards have a real solution and grow gently harder', () => {
    let prev = 0;
    for (const l of catalog.flowLevels) {
      const m = l.manifest;
      expect(m.solution, m.id).toBeTruthy();
      expect(solutionIsValid(m, m.solution!), m.id).toBe(true);
      // the solution covers every square, so the board is always winnable
      expect(m.solution!.reduce((n, p) => n + p.length, 0), m.id).toBe(m.size * m.size);
      const difficulty = m.size * 10 + m.pairs.length;
      expect(difficulty, m.id).toBeGreaterThanOrEqual(prev - 5); // never a sudden jump back down
      prev = Math.max(prev, difficulty);
    }
    expect(catalog.flowLevels[0].manifest.size).toBeLessThanOrEqual(4);
    expect(catalog.flowLevels.at(-1)!.manifest.size).toBeGreaterThanOrEqual(7);
  });

  it('Bubble Garden and Cloud Catcher levels stay gentle', () => {
    for (const l of catalog.bubbleLevels) {
      expect(l.manifest.speed, l.manifest.id).toBeLessThanOrEqual(35);
      expect(l.manifest.spawn, l.manifest.id).toBeLessThanOrEqual(1.2);
      expect(l.manifest.palette.length).toBeGreaterThanOrEqual(3);
    }
    for (const l of catalog.catcherLevels) {
      expect(l.manifest.speed, l.manifest.id).toBeLessThanOrEqual(35);
      expect(l.manifest.zones.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('level validators', () => {
  const bubble = { ...base, minigame: 'bubble_garden', palette: ['#aaaaaa', '#bbbbbb', '#cccccc'], sky, scenery: 'morning', spawn: 1, speed: 20, size: [20, 40], rounds: 3 };
  const catcher = { ...base, minigame: 'cloud_catcher', kinds: ['cloud'], colors: ['#aaaaaa', '#bbbbbb'], zones: [{ id: 'a', label: 'A', color: '#aaaaaa' }], sky, spawn: 1, speed: 20, pattern: ['cloud', 'star'] };
  const flow = { ...base, minigame: 'paint_flow', size: 4, pairs: [{ color: '#aaaaaa', a: [0, 0], b: [0, 3] }, { color: '#bbbbbb', a: [1, 0], b: [1, 3] }] };

  it('Bubble Garden', () => {
    expect(validateBubbleLevel(bubble).ok).toBe(true);
    expect(validateBubbleLevel({ ...bubble, palette: ['#aaaaaa'] }).ok).toBe(false);
    expect(validateBubbleLevel({ ...bubble, sky: ['red', 'blue'] }).ok).toBe(false);
    expect(validateBubbleLevel({ ...bubble, minigame: 'cloud_catcher' }).ok).toBe(false);
    const wild = validateBubbleLevel({ ...bubble, spawn: 500, speed: 9000, size: [1, 9999], rounds: 99, scenery: 'lava' });
    expect(wild.ok).toBe(true);
    if (wild.ok) {
      expect(wild.value.spawn).toBeLessThanOrEqual(3);
      expect(wild.value.speed).toBeLessThanOrEqual(90);
      expect(wild.value.size[1]).toBeLessThanOrEqual(120);
      expect(wild.value.scenery).toBe('morning');
    }
  });

  it('Cloud Catcher', () => {
    expect(validateCatcherLevel(catcher).ok).toBe(true);
    expect(validateCatcherLevel({ ...catcher, kinds: [] }).ok).toBe(false);
    expect(validateCatcherLevel({ ...catcher, zones: [] }).ok).toBe(false);
    expect(validateCatcherLevel({ ...catcher, zones: [{ id: 'a', color: '#aaaaaa' }, { id: 'a', color: '#bbbbbb' }] }).ok).toBe(false); // duplicate id
    const r = validateCatcherLevel({ ...catcher, kinds: ['cloud', 'unicorn'], pattern: ['cloud'] });
    expect(r.ok && r.value.kinds).toEqual(['cloud']);
  });

  it('Zen Garden backgrounds', () => {
    const zen = { ...base, minigame: 'zen_garden', ground: ['#f4e4c0', '#e9d3a4'] };
    expect(validateZenLevel(zen).ok).toBe(true);
    expect(validateZenLevel({ ...zen, ground: ['#f4e4c0'] }).ok).toBe(false);
    const r = validateZenLevel({ ...zen, groove: 'brown', scenery: 'volcano' });
    expect(r.ok && r.value.scenery).toBe('sand');
  });

  it('Paint Flow boards: bad solutions are ignored, bad boards are refused', () => {
    expect(validateFlowLevel(flow).ok).toBe(true);
    expect(validateFlowLevel({ ...flow, size: 2 }).ok).toBe(false);
    expect(validateFlowLevel({ ...flow, pairs: [flow.pairs[0]] }).ok).toBe(false); // needs at least two
    expect(validateFlowLevel({ ...flow, pairs: [flow.pairs[0], { color: '#bbbbbb', a: [0, 0], b: [2, 2] }] }).ok).toBe(false); // shares a cell
    expect(validateFlowLevel({ ...flow, pairs: [flow.pairs[0], { color: '#bbbbbb', a: [9, 0], b: [1, 1] }] }).ok).toBe(false); // off the board
    const good = [[[0, 0], [0, 1], [0, 2], [0, 3]], [[1, 0], [1, 1], [1, 2], [1, 3]]];
    const withGood = validateFlowLevel({ ...flow, solution: good });
    expect(withGood.ok && withGood.value.solution).toBeTruthy();
    const broken = validateFlowLevel({ ...flow, solution: [[[0, 0], [0, 2]], [[1, 0], [1, 3]]] });
    expect(broken.ok).toBe(true); // a bad hint never blocks the board
    expect(broken.ok && broken.value.solution).toBeUndefined();
    const overlapping = validateFlowLevel({ ...flow, solution: [good[0], [[1, 0], [0, 1], [0, 2], [0, 3]]] });
    expect(overlapping.ok && overlapping.value.solution).toBeUndefined();
  });
});

// ================================================================ Bubble Garden rules
const bubbleLevel = () => catalog.bubbleLevels[0].manifest as BubbleLevel;
describe('Bubble Garden', () => {
  it('relax mode has no goals, nothing to lose, and keeps drifting', () => {
    const g = new BubbleGarden(bubbleLevel(), 'relax', createRng(1));
    expect(g.request).toBeNull();
    for (let i = 0; i < 600; i++) g.update(0.1);
    expect(g.bubbles.length).toBeGreaterThan(0);
    expect(g.bubbles.length).toBeLessThanOrEqual(MAX_BUBBLES);
    expect(g.finished).toBe(false);
    for (const b of g.bubbles) {
      expect(b.x).toBeGreaterThanOrEqual(b.r - 0.01);
      expect(b.x).toBeLessThanOrEqual(FIELD_W - b.r + 0.01);
    }
  });

  it('bubbles that float off the top simply vanish', () => {
    const g = new BubbleGarden({ ...bubbleLevel(), spawn: 0.2 }, 'relax', createRng(2));
    const before = g.bubbles.map((b) => b.id);
    for (let i = 0; i < 2400; i++) g.update(0.1);
    expect(g.bubbles.some((b) => before.includes(b.id))).toBe(false);
  });

  it('tapping pops the front-most bubble under the pointer', () => {
    const g = new BubbleGarden(bubbleLevel(), 'relax', createRng(3));
    const b = g.bubbles[0];
    expect(g.at(b.x, b.y)?.id).toBeTruthy();
    expect(g.pop(b.id)).toBe(true);
    expect(g.bubbles.find((q) => q.id === b.id)).toBeUndefined();
    expect(g.pop(b.id)).toBe(false);
    expect(g.at(-500, -500)).toBeNull();
  });

  it('dragging a bubble onto one of the same color merges them into a bigger bubble', () => {
    const g = new BubbleGarden(bubbleLevel(), 'relax', createRng(4));
    g.bubbles = [
      { id: 1, x: 300, y: 300, r: 30, color: '#ffd3e2', phase: 0, held: false },
      { id: 2, x: 500, y: 300, r: 30, color: '#ffd3e2', phase: 0, held: false },
      { id: 3, x: 700, y: 300, r: 30, color: '#bfe4f7', phase: 0, held: false }
    ];
    g.drag(1, 480, 300);
    const r = g.release(1);
    expect(r).toEqual({ merged: true, bloomed: false });
    expect(g.bubbles.length).toBe(2);
    const big = g.bubbles.find((b) => b.id === 2)!;
    expect(big.r).toBeCloseTo(Math.sqrt(30 * 30 * 2), 3);
    // a different color does not merge
    g.drag(2, 690, 300);
    expect(g.release(2).merged).toBe(false);
    expect(g.bubbles.length).toBe(2);
  });

  it('a very large merged bubble blooms into sparkles and counts double', () => {
    const lv = bubbleLevel();
    const g = new BubbleGarden(lv, 'relax', createRng(5));
    const r = lv.size[1] * 1.3;
    g.bubbles = [
      { id: 1, x: 300, y: 300, r, color: '#ffd3e2', phase: 0, held: false },
      { id: 2, x: 330, y: 300, r, color: '#ffd3e2', phase: 0, held: false }
    ];
    g.drag(1, 320, 300);
    expect(g.release(1)).toEqual({ merged: true, bloomed: true });
    expect(g.bubbles.length).toBe(0);
    expect(g.popped).toBe(2);
  });

  it('Color Match asks for a color that is on screen and finishes gently after a few requests', () => {
    let done = 0;
    let finished = 0;
    const lv = { ...bubbleLevel(), rounds: 2 };
    const g = new BubbleGarden(lv, 'match', createRng(6), { onRequestDone: () => done++, onFinish: () => finished++ });
    expect(g.request).not.toBeNull();
    expect(g.bubbles.some((b) => b.color === g.request!.color)).toBe(true);
    let guard = 0;
    while (!g.finished && guard++ < 400) {
      const want = g.request!.color;
      let b = g.bubbles.find((q) => q.color === want);
      if (!b) {
        g.update(0.2);
        continue;
      }
      g.pop(b.id);
      g.update(0.05);
    }
    expect(g.finished).toBe(true);
    expect(done).toBe(2);
    expect(finished).toBe(1);
    expect(g.request).toBeNull();
  });

  it('Endless never finishes', () => {
    const g = new BubbleGarden(bubbleLevel(), 'endless', createRng(7));
    for (let i = 0; i < 200; i++) {
      const want = g.request!.color;
      const b = g.bubbles.find((q) => q.color === want);
      if (b) g.pop(b.id);
      g.update(0.1);
    }
    expect(g.completed).toBeGreaterThan(2);
    expect(g.finished).toBe(false);
  });

  it('a slower, calmer speed is used when motion is reduced', () => {
    const fast = new BubbleGarden(bubbleLevel(), 'relax', createRng(8), {}, 1);
    const slow = new BubbleGarden(bubbleLevel(), 'relax', createRng(8), {}, 0.5);
    const y0 = fast.bubbles[0].y;
    fast.update(1);
    slow.update(1);
    expect(y0 - slow.bubbles[0].y).toBeLessThan(y0 - fast.bubbles[0].y);
    expect(FIELD_H).toBeGreaterThan(0);
  });
});

// ================================================================ Cloud Catcher rules
const catcherLevel = () => catalog.catcherLevels[0].manifest as CatcherLevel;
describe('Cloud Catcher', () => {
  it('lays the zones out across the bottom, inside the field', () => {
    const zs = layoutZones(catcherLevel().zones);
    expect(zs.length).toBe(3);
    for (const z of zs) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.x + z.w).toBeLessThanOrEqual(900);
    }
    expect(zs[1].x).toBeGreaterThan(zs[0].x + zs[0].w);
  });

  it('items drift across and leave without any penalty', () => {
    const g = new CloudCatcher(catcherLevel(), 'relax', createRng(1));
    for (let i = 0; i < 2000; i++) g.update(0.1);
    expect(g.items.length).toBeLessThanOrEqual(MAX_ITEMS);
    expect(g.finished).toBe(false);
    expect(g.caught).toBe(0);
  });

  it('Relax accepts anything in any zone', () => {
    const g = new CloudCatcher(catcherLevel(), 'relax', createRng(2));
    const d = g.items[0];
    const z = g.zones[2];
    g.drag(d.id, z.x + z.w / 2, z.y + z.h / 2);
    expect(g.drop(d.id)?.id).toBe(z.id);
    expect(g.caught).toBe(1);
  });

  it('Color Match welcomes only the matching color; a wrong zone just lets it drift on', () => {
    const g = new CloudCatcher(catcherLevel(), 'match', createRng(3));
    const [a, b] = g.zones;
    g.items = [{ id: 99, kind: 'cloud', color: a.color, x: 0, y: 0, r: 30, vx: 10, phase: 0, held: false, settling: null }];
    g.drag(99, b.x + 20, b.y + 20);
    expect(g.drop(99)).toBeNull();
    expect(g.caught).toBe(0);
    expect(g.items.find((i) => i.id === 99)?.held).toBe(false);
    g.drag(99, a.x + 20, a.y + 20);
    expect(g.drop(99)?.id).toBe(a.id);
    expect(g.caught).toBe(1);
  });

  it('clicking an item sends it to the zone that welcomes it', () => {
    const g = new CloudCatcher(catcherLevel(), 'match', createRng(4));
    g.items = [{ id: 7, kind: 'cloud', color: g.zones[1].color, x: 100, y: 100, r: 30, vx: 10, phase: 0, held: false, settling: null }];
    expect(g.autoCatch(7)?.id).toBe(g.zones[1].id);
    g.update(1); // it floats there and fades
    g.update(1);
    expect(g.items.length).toBeGreaterThanOrEqual(0);
  });

  it('Color Match finishes after a gentle number of catches', () => {
    let finished = 0;
    const g = new CloudCatcher(catcherLevel(), 'match', createRng(5), { onFinish: () => finished++ });
    for (let i = 0; i < MATCH_GOAL; i++) {
      g.items = [{ id: 100 + i, kind: 'cloud', color: g.zones[0].color, x: 50, y: 50, r: 30, vx: 0, phase: 0, held: false, settling: null }];
      g.autoCatch(100 + i);
    }
    expect(g.finished).toBe(true);
    expect(finished).toBe(1);
  });

  it('Pattern mode wants the kinds in order, and only accepts the one wanted next', () => {
    const lv: CatcherLevel = { ...catcherLevel(), kinds: ['cloud', 'star'], pattern: ['cloud', 'star'] };
    const g = new CloudCatcher(lv, 'pattern', createRng(6));
    expect(g.wanted).toBe('cloud');
    const mk = (id: number, kind: CatcherKind) => ({ id, kind, color: '#ffffff', x: 0, y: 0, r: 30, vx: 0, phase: 0, held: false, settling: null });
    g.items = [mk(1, 'star'), mk(2, 'cloud')];
    expect(g.autoCatch(1)).toBeNull(); // wrong one: nothing happens
    expect(g.autoCatch(2)).not.toBeNull();
    expect(g.wanted).toBe('star');
    let reps = 0;
    for (let i = 0; i < PATTERN_REPEATS * 2 + 2 && !g.finished; i++) {
      const kind = g.wanted!;
      g.items = [mk(10 + i, kind)];
      g.autoCatch(10 + i);
      reps++;
    }
    expect(g.finished).toBe(true);
    expect(reps).toBeGreaterThan(0);
  });

  it('Endless never finishes', () => {
    const g = new CloudCatcher(catcherLevel(), 'endless', createRng(7));
    for (let i = 0; i < 40; i++) {
      g.items = [{ id: 500 + i, kind: 'cloud', color: g.zones[0].color, x: 50, y: 50, r: 30, vx: 0, phase: 0, held: false, settling: null }];
      g.autoCatch(500 + i);
    }
    expect(g.caught).toBe(40);
    expect(g.finished).toBe(false);
  });
});

// ================================================================ Paint Flow rules
const small = { size: 4, pairs: [{ color: '#f49bbd', a: [0, 0] as Cell, b: [0, 3] as Cell }, { color: '#7fb8f0', a: [1, 0] as Cell, b: [1, 3] as Cell }, { color: '#7fd2a8', a: [2, 0] as Cell, b: [3, 3] as Cell }] };
const stroke = (b: FlowBoard, cells: Cell[]) => {
  b.begin(cells[0]);
  for (const c of cells.slice(1)) b.extend(c);
  b.end();
};
describe('Paint Flow', () => {
  it('connects a pair by dragging from one dot to the other', () => {
    const b = new FlowBoard(small);
    stroke(b, [[0, 0], [0, 1], [0, 2], [0, 3]]);
    expect(b.isConnected(0)).toBe(true);
    expect(b.connectedCount).toBe(1);
    expect(b.solved).toBe(false);
  });

  it('only moves to neighbouring squares and stays on the board', () => {
    const b = new FlowBoard(small);
    b.begin([0, 0]);
    expect(b.extend([2, 2])).toBe(false); // not adjacent
    expect(b.extend([-1, 0])).toBe(false);
    expect(b.extend([0, 1])).toBe(true);
    expect(b.paths[0].length).toBe(2);
  });

  it('other colors dots are walls, and a path stops at its own partner dot', () => {
    const b = new FlowBoard(small);
    b.begin([0, 0]);
    expect(b.extend([1, 0])).toBe(false); // that is another color's dot
    b.extend([0, 1]);
    b.extend([0, 2]);
    b.extend([0, 3]);
    expect(b.isConnected(0)).toBe(true);
    expect(b.extend([1, 3])).toBe(false); // finished: cannot run past the partner
  });

  it('drawing across another path gently clears that path instead of blocking', () => {
    const b = new FlowBoard(small);
    stroke(b, [[0, 0], [0, 1], [0, 2], [0, 3]]);
    b.begin([1, 0]);
    b.extend([1, 1]);
    b.extend([0, 1]); // crosses the first path
    expect(b.paths[0]).toEqual([]);
    expect(b.isConnected(0)).toBe(false);
  });

  it('stepping back erases a step, and crossing yourself trims the loop', () => {
    const b = new FlowBoard(small);
    b.begin([1, 0]);
    b.extend([1, 1]);
    b.extend([1, 2]);
    b.extend([1, 1]); // back
    expect(b.paths[1].length).toBe(2);
    b.extend([2, 1]);
    b.extend([2, 2]);
    b.extend([1, 2]);
    b.extend([1, 1]); // meets itself: trims to there
    expect(b.paths[1].map((c) => c.join(','))).toEqual(['1,0', '1,1']);
  });

  it('is solved when every pair is joined, and undo, reset and hint are always free', () => {
    const sol: Cell[][] = [[[0, 0], [0, 1], [0, 2], [0, 3]], [[1, 0], [1, 1], [1, 2], [1, 3]], [[2, 0], [3, 0], [3, 1], [3, 2], [2, 2], [2, 3], [3, 3]]];
    // (the third pair's route is not needed to be exact for the rules: hint just reveals it)
    const b = new FlowBoard(small, sol);
    stroke(b, sol[0]);
    stroke(b, sol[1]);
    expect(b.solved).toBe(false);
    expect(b.undo()).toBe(true); // takes back the last stroke
    expect(b.connectedCount).toBe(1);
    const i = b.hint();
    expect(i).toBe(1); // next pair not yet joined
    expect(b.isConnected(1)).toBe(true);
    b.reset();
    expect(b.connectedCount).toBe(0);
    expect(b.undo()).toBe(true);
    expect(b.connectedCount).toBe(2);
    expect(new FlowBoard(small).hint()).toBe(-1); // no solution to reveal: nothing happens, nothing breaks
  });

  it('every bundled board can be solved by following its own solution', () => {
    for (const l of catalog.flowLevels) {
      const b = new FlowBoard(l.manifest, l.manifest.solution);
      for (const path of l.manifest.solution!) stroke(b, path);
      expect(b.solved, l.manifest.id).toBe(true);
      expect(b.filled).toBe(1);
    }
  });

  it('every bundled board can be solved with hints alone', () => {
    for (const l of catalog.flowLevels) {
      const b = new FlowBoard(l.manifest, l.manifest.solution);
      for (let i = 0; i < l.manifest.pairs.length; i++) b.hint();
      expect(b.solved, l.manifest.id).toBe(true);
    }
  });

  it('Relax boards are always solvable', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const size = 4 + (seed % 4);
      const g = randomBoard(size, Math.min(7, size), ['#a', '#b', '#c', '#d', '#e', '#f', '#g'].map((c) => c + '00000'), createRng(seed));
      expect(solutionIsValid(g.level, g.solution)).toBe(true);
      const b = new FlowBoard(g.level, g.solution);
      for (const p of g.solution) stroke(b, p);
      expect(b.solved).toBe(true);
    }
  });
});

// ================================================================ Zen Garden
describe('Zen Garden', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
  });
  afterEach(() => setStorage(null));

  it('never grows without limit', () => {
    const wild = {
      id: 'g1',
      strokes: Array.from({ length: MAX_STROKES + 50 }, () => ({ pts: Array.from({ length: (MAX_POINTS + 100) * 2 }, (_, i) => i % 900) })),
      objects: Array.from({ length: MAX_OBJECTS + 50 }, () => ({ kind: 'stone', x: 1e9, y: -1e9, size: 99, variant: 77, rot: 1e9 }))
    };
    const g = sanitizeGarden(wild)!;
    expect(g.strokes.length).toBeLessThanOrEqual(MAX_STROKES);
    expect(g.strokes.every((s) => s.pts.length <= MAX_POINTS * 2)).toBe(true);
    expect(g.objects.length).toBe(MAX_OBJECTS);
    expect(g.objects.every((o) => o.x <= 900 && o.y >= 0 && o.size <= 1.8 && o.variant <= 3)).toBe(true);
  });

  it('rejects junk and unsafe ids', () => {
    expect(sanitizeGarden(null)).toBeNull();
    expect(sanitizeGarden({ id: '../evil' })).toBeNull();
    expect(sanitizeGarden({ id: 'ok-1' }, 'other')).toBeNull();
    const g = sanitizeGarden({ id: 'ok-1', name: '   ', objects: [{ kind: 'dragon' }, 5, null], strokes: [{ pts: [1, 2] }, 'x'] })!;
    expect(g.name).toBe('My garden');
    expect(g.objects).toEqual([]);
    expect(g.strokes).toEqual([]);
  });

  it('raked points are spaced out so files stay small', () => {
    const s = { pts: [] as number[] };
    expect(addPoint(s, 10, 10)).toBe(true);
    expect(addPoint(s, 11, 11)).toBe(false);
    expect(addPoint(s, 30, 10)).toBe(true);
    for (let i = 0; i < 2000; i++) addPoint(s, i * 10, 0);
    expect(s.pts.length).toBeLessThanOrEqual(MAX_POINTS * 2);
  });

  it('puts a garden in a place (a Japanese house, the seaside...) and keeps old gardens on open sand', async () => {
    expect(sanitizeGarden({ id: 'old-1' })!.setting).toBe('plain');
    expect(sanitizeGarden({ id: 'old-2', setting: 'castle-in-the-air' })!.setting).toBe('plain');
    expect(sanitizeGarden({ id: 'new-1', setting: 'japanese' })!.setting).toBe('japanese');
    const g = emptyGarden('warm_sand', 'Tea', 'tea');
    await saveGarden(g);
    expect((await loadGarden(g.id))!.setting).toBe('tea');
    for (const z of ZEN_SETTINGS) {
      const b = bedOf(z);
      expect(b.x + b.w).toBeLessThanOrEqual(900);
      expect(b.y + b.h).toBeLessThanOrEqual(580);
      expect(b.w).toBeGreaterThan(300);
    }
  });

  it('saves automatically-written gardens and loads them back exactly', async () => {
    const g = emptyGarden('warm_sand', 'Evening');
    g.strokes.push({ pts: [10, 10, 40, 30, 80, 50] });
    g.objects.push({ id: 1, kind: 'stone', x: 200, y: 200, size: 1.2, variant: 2, rot: 0.5 });
    await saveGarden(g);
    const back = await loadGarden(g.id);
    expect(back).toMatchObject({ id: g.id, name: 'Evening', levelId: 'warm_sand' });
    expect(back!.strokes).toEqual(g.strokes);
    expect(back!.objects[0]).toMatchObject({ kind: 'stone', x: 200, size: 1.2, variant: 2 });
  });

  it('lists newest first, duplicates into an independent copy, and deletes', async () => {
    const a = emptyGarden('warm_sand', 'First');
    await saveGarden(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = emptyGarden('moonlight_sand', 'Second');
    b.objects.push({ id: 1, kind: 'flower', x: 5, y: 5, size: 1, variant: 0, rot: 0 });
    await saveGarden(b);
    expect((await listGardens()).map((g) => g.name)).toEqual(['Second', 'First']);
    const copy = duplicateGarden(b);
    expect(copy.id).not.toBe(b.id);
    expect(copy.name).toBe('Second copy');
    copy.objects.push({ id: 2, kind: 'stone', x: 9, y: 9, size: 1, variant: 0, rot: 0 });
    expect(b.objects.length).toBe(1); // the original is untouched
    await saveGarden(copy);
    expect((await listGardens()).length).toBe(3);
    await deleteGarden(a.id);
    expect((await listGardens()).map((g) => g.name).sort()).toEqual(['Second', 'Second copy']);
    expect(await loadGarden(a.id)).toBeNull();
  });

  it('a damaged garden file is skipped, never fatal', async () => {
    await mem.writeText('gardens/broken.json', '{ nope');
    const ok = emptyGarden('warm_sand');
    await saveGarden(ok);
    expect((await listGardens()).map((g) => g.id)).toEqual([ok.id]);
    expect(await loadGarden('broken')).toBeNull();
  });

  it('finds objects and raked lines near a point for moving and erasing', () => {
    const g = emptyGarden('warm_sand');
    g.objects.push({ id: 1, kind: 'stone', x: 100, y: 100, size: 1, variant: 0, rot: 0 });
    g.strokes.push({ pts: [300, 300, 340, 300] });
    expect(objectAt(g, 110, 105)?.id).toBe(1);
    expect(objectAt(g, 400, 400)).toBeNull();
    expect(strokeAt(g, 320, 305)).toBe(0);
    expect(strokeAt(g, 600, 500)).toBe(-1);
  });
});

// ================================================================ small progress file
describe('mini-game progress', () => {
  let mem: MemoryStorage;
  beforeEach(() => {
    mem = new MemoryStorage();
    setStorage(mem);
    gamesProgress.__reset();
  });
  afterEach(() => setStorage(null));

  it('remembers solved boards and the last game, with no scores', async () => {
    await loadGamesProgress();
    recordFlowSolved('flow_first_drops');
    recordFlowSolved('flow_first_drops');
    recordPlayed('bubbles', 'bubbles_morning_sky');
    recordOpened('zen', 'warm_sand');
    const p = get(gamesProgress);
    expect(p.flowSolved).toEqual(['flow_first_drops']);
    expect(p.played.flow.flow_first_drops).toBe(2);
    expect(p.last?.game).toBe('zen');
    expect(Object.keys(p).sort()).toEqual(['flowSolved', 'last', 'played', 'schema']);
    await gamesProgress.flush();
    gamesProgress.__reset();
    await loadGamesProgress();
    expect(get(gamesProgress).flowSolved).toEqual(['flow_first_drops']);
  });

  it('survives junk', () => {
    const p = sanitizeGames({ played: { 'bad game': { x: 1 }, ok: { good: 2, 'bad id': 3, neg: -1 } }, flowSolved: ['a', 7, 'B B'], last: { game: 'x', levelId: 'y', at: -5 } });
    expect(p.played).toEqual({ ok: { good: 2 } });
    expect(p.flowSolved).toEqual(['a']);
    expect(p.last).toBeNull();
  });
});
