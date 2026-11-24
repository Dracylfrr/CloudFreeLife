import { describe, expect, it } from 'vitest';
import { AREA_TOLERANCE, colorAreaMask } from '../src/features/painting/colorArea';
import { PAINT_MODES, brushActsAsFill, isPaintMode, keepsInside, modeFromLegacy, modeInfo, modeList } from '../src/features/painting/paintMode';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';

/** A w x h picture of one color, with filled rectangles of other colors. */
function picture(w: number, h: number, base: [number, number, number], boxes: { x: number; y: number; w: number; h: number; c: [number, number, number] }[] = []) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set([...base, 255], i * 4);
  for (const b of boxes) {
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) d.set([...b.c, 255], (y * w + x) * 4);
  }
  return d;
}

describe('Paint modes', () => {
  it('has the three modes and recognises only those', () => {
    expect([...PAINT_MODES]).toEqual(['inside', 'anywhere', 'fill']);
    for (const m of PAINT_MODES) expect(isPaintMode(m)).toBe(true);
    for (const bad of ['', 'Inside', 'splash', 1, null, undefined, {}]) expect(isPaintMode(bad)).toBe(false);
  });

  it('turns the old on/off setting into a mode', () => {
    expect(modeFromLegacy(true)).toBe('inside');
    expect(modeFromLegacy(false)).toBe('anywhere');
    expect(modeFromLegacy(undefined)).toBe('inside');
  });

  it('uses clear words, different on a coloring page and on Free Draw', () => {
    expect(modeList(true).map((m) => m.label)).toEqual(['Inside the lines', 'Splash anywhere', 'Fill areas']);
    expect(modeList(false).map((m) => m.label)).toEqual(['Inside areas', 'Anywhere', 'Fill areas']);
    for (const m of PAINT_MODES) {
      expect(modeInfo(m, true).hint.length).toBeGreaterThan(10);
      expect(modeInfo(m, false).id).toBe(m);
    }
  });

  it('keeps paint inside in Inside and Fill modes, and lets it go anywhere only in Anywhere', () => {
    expect(keepsInside('inside')).toBe(true);
    expect(keepsInside('fill')).toBe(true);
    expect(keepsInside('anywhere')).toBe(false);
  });

  it('turns every painting brush into a tap-to-fill in Fill mode, and nothing else', () => {
    for (const t of ['brush', 'marker', 'crayon', 'airbrush', 'watercolor', 'pastel', 'ink', 'glitter']) {
      expect(brushActsAsFill('fill', t)).toBe(true);
      expect(brushActsAsFill('inside', t)).toBe(false);
      expect(brushActsAsFill('anywhere', t)).toBe(false);
    }
    for (const t of ['eraser', 'fill', 'picker', 'pan', 'stamp', 'paintball', 'clearRegion']) expect(brushActsAsFill('fill', t)).toBe(false);
  });
});

describe('Paint mode setting', () => {
  it('defaults to Inside the lines', () => {
    expect(DEFAULT_SETTINGS.paintMode).toBe('inside');
  });

  it('keeps a saved mode', () => {
    for (const m of PAINT_MODES) expect(sanitizeSettings({ paintMode: m }).paintMode).toBe(m);
  });

  it('moves an older "stay inside lines" choice over', () => {
    expect(sanitizeSettings({ stayInsideLines: false }).paintMode).toBe('anywhere');
    expect(sanitizeSettings({ stayInsideLines: true }).paintMode).toBe('inside');
    expect(sanitizeSettings({}).paintMode).toBe('inside');
  });

  it('ignores a mode it does not know', () => {
    expect(sanitizeSettings({ paintMode: 'splashy', stayInsideLines: false }).paintMode).toBe('anywhere');
    expect(sanitizeSettings({ paintMode: 5 }).paintMode).toBe('inside');
    expect(sanitizeSettings(null).paintMode).toBe('inside');
  });
});

describe('Area of similar color (Free Draw, Inside areas)', () => {
  const white: [number, number, number] = [255, 255, 255];
  const red: [number, number, number] = [220, 60, 60];

  it('finds only the connected area around the point', () => {
    // a red box in the middle of white: starting in the white gives the white ring, not the box
    const d = picture(20, 20, white, [{ x: 8, y: 8, w: 4, h: 4, c: red }]);
    const m = colorAreaMask(d, 20, 20, 1, 1)!;
    expect(m.bits[1 * 20 + 1]).toBe(1);
    expect(m.bits[10 * 20 + 10]).toBe(0);
    // starting in the box gives the box (plus the one-pixel rim)
    const b = colorAreaMask(d, 20, 20, 9, 9)!;
    expect(b.bits[10 * 20 + 10]).toBe(1);
    expect(b.bits[8 * 20 + 8]).toBe(1);
    expect(b.bits[1 * 20 + 1]).toBe(0);
    expect(b.count).toBe(32); // 4x4 box (16) + a rim of 4 pixels on each of its 4 sides, no corners (16)
  });

  it('is stopped by a line of a different color', () => {
    // a dark vertical line splits the picture into two halves
    const d = picture(20, 10, white, [{ x: 10, y: 0, w: 2, h: 10, c: [20, 20, 20] }]);
    const left = colorAreaMask(d, 20, 10, 2, 5)!;
    expect(left.bits[5 * 20 + 2]).toBe(1);
    expect(left.bits[5 * 20 + 15]).toBe(0);
  });

  it('treats near-identical shades as one area', () => {
    const d = picture(10, 10, white, [{ x: 4, y: 0, w: 2, h: 10, c: [250, 250, 252] }]);
    const m = colorAreaMask(d, 10, 10, 0, 0)!;
    expect(m.bits[5 * 10 + 9]).toBe(1);
    expect(AREA_TOLERANCE).toBeGreaterThan(0);
  });

  it('covers a one-pixel rim so soft stroke edges are not left behind', () => {
    const d = picture(10, 10, white, [{ x: 5, y: 0, w: 5, h: 10, c: red }]);
    const m = colorAreaMask(d, 10, 10, 0, 5)!;
    expect(m.bits[5 * 10 + 4]).toBe(1);
    expect(m.bits[5 * 10 + 5]).toBe(1); // the rim
    expect(m.bits[5 * 10 + 6]).toBe(0);
  });

  it('returns nothing for a point outside the picture or a bad size', () => {
    const d = picture(5, 5, white);
    expect(colorAreaMask(d, 5, 5, -1, 2)).toBeNull();
    expect(colorAreaMask(d, 5, 5, 2, 9)).toBeNull();
    expect(colorAreaMask(d, 0, 5, 0, 0)).toBeNull();
    expect(colorAreaMask(new Uint8ClampedArray(4), 5, 5, 0, 0)).toBeNull();
  });

  it('fills the whole picture when it is all one color, without stack trouble on a big one', () => {
    const d = picture(300, 200, white);
    const m = colorAreaMask(d, 300, 200, 150, 100)!;
    expect(m.count).toBe(300 * 200);
  });
});
