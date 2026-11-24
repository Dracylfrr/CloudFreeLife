import { describe, expect, it } from 'vitest';
import { BRUSHES, TOOLS, isBrushTool } from '../src/features/painting/tools';
import { STAMPS, STAMP_IDS, drawStamp, isStamp, stampExtent, stampRadius, type StampId } from '../src/features/painting/stamps';
import { Recorder, applyEvent, sanitizeLog, type ReplayTarget } from '../src/features/painting/timelapse';

describe('tools', () => {
  it('have unique ids and unique keyboard keys', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    const keys = TOOLS.map((t) => t.key.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
    // Ctrl+S saves and the keys [ ] 0 + - are used by the painter itself
    for (const k of keys) expect(/^[a-z]$/.test(k)).toBe(true);
  });
  it('offer the four new brushes and the stamp tool', () => {
    for (const id of ['watercolor', 'pastel', 'ink', 'glitter', 'stamp']) expect(TOOLS.some((t) => t.id === id), id).toBe(true);
    for (const id of ['watercolor', 'pastel', 'ink', 'glitter']) expect(isBrushTool(id as never), id).toBe(true);
    expect(isBrushTool('stamp')).toBe(false);
  });
  it('every brush has sane settings', () => {
    for (const [id, b] of Object.entries(BRUSHES)) {
      expect(b.scale, id).toBeGreaterThan(0.2);
      expect(b.scale, id).toBeLessThanOrEqual(3);
      expect(b.alpha, id).toBeGreaterThan(0.2);
      expect(b.alpha, id).toBeLessThanOrEqual(1);
      expect(b.margin, id).toBeGreaterThanOrEqual(2);
    }
    // the ink pen is the thinnest and watercolor the softest
    expect(BRUSHES.ink.scale).toBeLessThan(BRUSHES.brush.scale);
    expect(BRUSHES.watercolor.alpha).toBeLessThan(BRUSHES.brush.alpha);
  });
  it('every tool has a label, a hint and an icon', () => {
    for (const t of TOOLS) {
      expect(t.label.length, t.id).toBeGreaterThan(2);
      expect(t.hint.length, t.id).toBeGreaterThan(8);
      expect(t.icon, t.id).toBeTruthy();
    }
  });
});

/** A canvas stand-in that remembers where it was asked to draw. */
function recorder() {
  const pts: [number, number][] = [];
  let fills = 0;
  const ctx = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'fill') return () => void fills++;
        if (['arc', 'ellipse'].includes(prop as string)) return (x: number, y: number, r: number) => void pts.push([x + r, y + r], [x - r, y - r]);
        if (['moveTo', 'lineTo'].includes(prop as string)) return (x: number, y: number) => void pts.push([x, y]);
        if (prop === 'bezierCurveTo') return (_a: number, _b: number, _c: number, _d: number, x: number, y: number) => void pts.push([x, y]);
        if (prop === 'quadraticCurveTo') return (_a: number, _b: number, x: number, y: number) => void pts.push([x, y]);
        return () => {};
      },
      set() {
        return true;
      }
    }
  ) as unknown as CanvasRenderingContext2D;
  return { ctx, pts, fills: () => fills };
}

describe('stamps', () => {
  it('has eight named shapes', () => {
    expect(STAMPS).toHaveLength(8);
    expect(new Set(STAMP_IDS).size).toBe(8);
    for (const s of STAMPS) expect(s.label.length).toBeGreaterThan(2);
    expect(isStamp('heart')).toBe(true);
    for (const bad of ['', 'Heart', 'dragon', 5, null]) expect(isStamp(bad)).toBe(false);
  });
  it('every shape draws something, near where it was asked to, inside its extent', () => {
    for (const id of STAMP_IDS as StampId[]) {
      const r = recorder();
      drawStamp(r.ctx, id, 0, 0, 40, 0, '#a9d4f5');
      expect(r.fills(), id).toBeGreaterThan(0);
      for (const [x, y] of r.pts) {
        expect(Math.abs(x), id).toBeLessThanOrEqual(stampExtent(40));
        expect(Math.abs(y), id).toBeLessThanOrEqual(stampExtent(40));
      }
    }
  });
  it('scales with the size slider, but never gets tiny', () => {
    expect(stampRadius(2)).toBeGreaterThanOrEqual(8);
    expect(stampRadius(50)).toBeGreaterThan(stampRadius(10));
  });
});

describe('stamps in the timelapse', () => {
  const base = { w: 1280, h: 960, truncated: false };
  it('are recorded and replayed with their shape, size and tilt', () => {
    const rec = new Recorder(1280, 960);
    rec.stamp(100.4, 200.6, '#ffd3e2', 'flower', 24, 0.123, true);
    expect(rec.events[0]).toEqual(['s', 100, 201, '#ffd3e2', 'flower', 24, 0.12, 1]);
    const seen: string[] = [];
    const state = { color: '', stampShape: '', size: 0, stayInside: false };
    const t = { state, stampAt: (x: number, y: number, rot: number) => (seen.push(`${x},${y},${rot},${state.stampShape},${state.color},${state.size},${state.stayInside}`), true) } as unknown as ReplayTarget;
    applyEvent(t, rec.events[0]);
    expect(seen).toEqual(['100,201,0.12,flower,#ffd3e2,24,true']);
  });
  it('are read back safely: only valid ones, and only from version 2 logs', () => {
    const good = ['s', 1, 2, '#ffd3e2', 'star', 20, 0.2, 1];
    const events = [good, ['s', 1, 2, 'pink', 'star', 20, 0.2, 1], ['s', 1, 2, '#ffd3e2', 'dragon', 20, 0.2, 1], ['s', 1, 2, '#ffd3e2', 'star', 900, 0.2, 1], ['s', 1, 2, '#ffd3e2', 'star', 20, 50, 1], ['f', 3, 4, '#ffd3e2', 1]];
    expect(sanitizeLog({ v: 2, ...base, events })?.events.map((e) => e[0])).toEqual(['s', 'f']);
    expect(sanitizeLog({ v: 1, ...base, events })?.events.map((e) => e[0])).toEqual(['f']);
  });
  it('log the new brushes as ordinary strokes', () => {
    const rec = new Recorder(1280, 960);
    for (const tool of ['watercolor', 'pastel', 'ink', 'glitter'] as const) {
      rec.begin(10, 10, { tool, color: '#a9d4f5', size: 20, stayInside: false });
      rec.move([{ x: 40, y: 40 }]);
      rec.end();
    }
    const log = sanitizeLog(JSON.parse(JSON.stringify(rec.toLog())));
    expect(log?.events.filter((e) => e[0] === 'b')).toHaveLength(4);
  });
});
