// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { validateRegions } from '../src/core/manifests';
import { buildRegionSvg } from '../src/features/painting/regionMap';
import { LINE_LEVEL, MAX_REGIONS, buildPage, darkFromGray, regionPath, traceRegions } from '../src/features/import/trace';

/** A w x h picture with a line drawn wherever `line(x, y)` says so. */
function draw(w: number, h: number, line: (x: number, y: number) => boolean): Uint8Array {
  const d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = line(x, y) ? 1 : 0;
  return d;
}
const box = (x0: number, y0: number, x1: number, y1: number) => (x: number, y: number) =>
  ((x === x0 || x === x1) && y >= y0 && y <= y1) || ((y === y0 || y === y1) && x >= x0 && x <= x1);

describe('turning line art into a coloring page', () => {
  it('finds the area outside and inside a closed shape', () => {
    const r = traceRegions(draw(60, 40, box(10, 8, 49, 31)), 60, 40);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.count).toBe(2);
    // the outside is the bigger area, so it comes first
    expect(r.value.areas[1]).toBeGreaterThan(r.value.areas[2]);
    const outside = r.value.labels[0];
    const inside = r.value.labels[20 * 60 + 30];
    expect(outside).toBe(1);
    expect(inside).toBe(2);
  });

  it('counts two shapes side by side as three areas', () => {
    const f = (x: number, y: number) => box(4, 4, 28, 35)(x, y) || box(32, 4, 56, 35)(x, y);
    const r = traceRegions(draw(60, 40, f), 60, 40);
    expect(r.ok && r.value.count).toBe(3);
  });

  it('does not let color leak through a one-pixel gap in a line', () => {
    const f = (x: number, y: number) => box(10, 8, 49, 31)(x, y) && !(x === 10 && y === 20);
    const r = traceRegions(draw(60, 40, f), 60, 40);
    expect(r.ok && r.value.count).toBe(2);
  });

  it('lets each area run a little under the lines around it', () => {
    const r = traceRegions(draw(60, 40, box(10, 8, 49, 31)), 60, 40);
    if (!r.ok) throw new Error('trace failed');
    // a pixel on the line itself now belongs to a neighbouring area, so no pale edge is left
    expect(r.value.labels[8 * 60 + 30]).not.toBe(0);
  });

  it('ignores specks, and says so plainly when there is nothing to color', () => {
    const blank = traceRegions(draw(60, 40, () => false), 60, 40);
    expect(blank.ok).toBe(false);
    if (!blank.ok) expect(blank.reason).toMatch(/closed shapes/);
    const speck = traceRegions(draw(60, 40, (x, y) => x === 30 && y === 20), 60, 40);
    expect(speck.ok).toBe(false);
  });

  it('refuses a picture with far too many areas (a photo or a screen of noise)', () => {
    const f = (x: number, y: number) => x % 10 === 0 || y % 10 === 0;
    const r = traceRegions(draw(240, 240, f), 240, 240);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain(String(MAX_REGIONS));
  });

  it('rejects a picture of the wrong size instead of guessing', () => {
    expect(traceRegions(new Uint8Array(10), 4, 4).ok).toBe(false);
  });

  it('writes a plain rectangle as one small rectangle path', () => {
    const r = traceRegions(draw(60, 40, box(10, 8, 49, 31)), 60, 40);
    if (!r.ok) throw new Error('trace failed');
    const d = regionPath(r.value, 2);
    expect(d.match(/M/g)?.length ?? 0).toBeLessThanOrEqual(4);
    expect(d).toMatch(/^M\d+ \d+h\d+v\d+h-\d+z/);
  });

  it('builds a page the painter already understands', () => {
    const r = traceRegions(draw(60, 40, box(10, 8, 49, 31)), 60, 40);
    if (!r.ok) throw new Error('trace failed');
    const page = buildPage(r.value, 'data:image/png;base64,AAAA');
    expect(validateRegions(page.regions).ok).toBe(true);
    expect(page.regions.regions.map((x) => x.id)).toEqual(['area_1', 'area_2']);
    expect(page.svg).toContain('data-region="area_1"');
    expect(page.svg).not.toMatch(/<script|onload|javascript:/i);
    // the same step the painter uses to find regions keeps the shapes and drops the lines picture
    const regionSvg = buildRegionSvg(page.svg, page.regions.regions.map((x) => x.id), 60, 40);
    expect(regionSvg).toContain('data-region="area_2"');
    expect(regionSvg).not.toContain('<image');
  });

  it('reads line pixels from gray values at another size', () => {
    const gray = new Uint8Array(8 * 8).fill(255);
    gray[3 * 8 + 3] = LINE_LEVEL - 1;
    const d = darkFromGray(gray, 8, 8, 4, 4);
    expect(d[1 * 4 + 1]).toBe(1);
    expect(d.reduce((a, b) => a + b, 0)).toBe(1);
    expect(darkFromGray(new Uint8Array(64).fill(LINE_LEVEL), 8, 8, 4, 4).every((v) => v === 0)).toBe(true);
  });
});
