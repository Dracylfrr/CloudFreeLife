/**
 * "Inside areas" on Free Draw: which pixels belong to the area of similar color around a point.
 * A plain flood fill over the picture you see (background and layers), grown by one pixel so the soft
 * edge of a stroke is covered too. It works on plain arrays so it is easy to test.
 */

/** Colors within this total difference (red + green + blue + alpha) count as the same area. */
export const AREA_TOLERANCE = 60;

export interface AreaMask {
  /** One byte per pixel: 1 inside the area, 0 outside. */
  bits: Uint8Array;
  /** Pixels inside the area. */
  count: number;
}

export function colorAreaMask(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number, sx: number, sy: number, tol = AREA_TOLERANCE): AreaMask | null {
  sx = Math.floor(sx);
  sy = Math.floor(sy);
  if (!(w > 0) || !(h > 0) || sx < 0 || sy < 0 || sx >= w || sy >= h || rgba.length < w * h * 4) return null;
  const o0 = (sy * w + sx) * 4;
  const tr = rgba[o0];
  const tg = rgba[o0 + 1];
  const tb = rgba[o0 + 2];
  const ta = rgba[o0 + 3];
  const match = (o: number) => Math.abs(rgba[o] - tr) + Math.abs(rgba[o + 1] - tg) + Math.abs(rgba[o + 2] - tb) + Math.abs(rgba[o + 3] - ta) <= tol;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [sx, sy];
  while (stack.length) {
    const y = stack.pop()!;
    let x = stack.pop()!;
    while (x >= 0 && !seen[y * w + x] && match((y * w + x) * 4)) x--;
    x++;
    let up = false;
    let down = false;
    while (x < w && !seen[y * w + x] && match((y * w + x) * 4)) {
      seen[y * w + x] = 1;
      if (y > 0) {
        const m = !seen[(y - 1) * w + x] && match(((y - 1) * w + x) * 4);
        if (m && !up) {
          stack.push(x, y - 1);
          up = true;
        } else if (!m) up = false;
      }
      if (y < h - 1) {
        const m = !seen[(y + 1) * w + x] && match(((y + 1) * w + x) * 4);
        if (m && !down) {
          stack.push(x, y + 1);
          down = true;
        } else if (!m) down = false;
      }
      x++;
    }
  }
  // one pixel wider, so the anti-aliased rim of a neighbouring stroke does not leave a pale halo
  const bits = new Uint8Array(seen);
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (seen[i]) {
        count++;
        continue;
      }
      if ((x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w])) {
        bits[i] = 1;
        count++;
      }
    }
  }
  return { bits, count };
}
