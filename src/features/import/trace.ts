/**
 * Turns a picture of black-and-white line art into a coloring page the painter already understands:
 * an SVG whose colorable shapes carry `data-region` ids, plus a list of those regions.
 *
 * The idea: find every closed area between the lines (a flood fill over the pixels that are not
 * line), give each area an id, and write each area out as a small path made of rows of pixels.
 * The original lines are laid on top as a picture, so they stay as crisp as the file you chose.
 *
 * Everything here works on plain arrays, with no canvas and no file access, so it is easy to test.
 */

/** The size the shapes are found at. The page is shown larger; the lines picture stays sharp. */
export const WORK_W = 640;
export const WORK_H = 480;
export const MAX_REGIONS = 300;
export const MIN_REGION_PIXELS = 24;

export interface Traced {
  w: number;
  h: number;
  /** Per pixel: 0 = line or nothing, otherwise the 1-based region number. */
  labels: Uint16Array;
  /** Number of regions found (numbers 1..count). */
  count: number;
  /** Pixels in each region (index 1..count). */
  areas: number[];
}

export type TraceResult = { ok: true; value: Traced } | { ok: false; reason: string };

/**
 * `dark` marks line pixels (1) and paper pixels (0). Lines are thickened by one pixel so a tiny gap
 * in a line does not let color leak into the next area.
 */
export function traceRegions(dark: Uint8Array, w: number, h: number): TraceResult {
  if (dark.length !== w * h) return { ok: false, reason: 'The picture has an unexpected size.' };
  const wall = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!dark[y * w + x]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h) wall[ny * w + nx] = 1;
        }
      }
    }
  }
  // Flood fill (4-way) over open pixels.
  const comp = new Int32Array(w * h).fill(-1);
  const areasAll: number[] = [];
  const stack = new Int32Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (wall[start] || comp[start] !== -1) continue;
    const id = areasAll.length;
    let n = 0;
    let sp = 0;
    stack[sp++] = start;
    comp[start] = id;
    while (sp > 0) {
      const p = stack[--sp];
      n++;
      const x = p % w;
      const y = (p / w) | 0;
      if (x > 0 && !wall[p - 1] && comp[p - 1] === -1) (comp[p - 1] = id), (stack[sp++] = p - 1);
      if (x < w - 1 && !wall[p + 1] && comp[p + 1] === -1) (comp[p + 1] = id), (stack[sp++] = p + 1);
      if (y > 0 && !wall[p - w] && comp[p - w] === -1) (comp[p - w] = id), (stack[sp++] = p - w);
      if (y < h - 1 && !wall[p + w] && comp[p + w] === -1) (comp[p + w] = id), (stack[sp++] = p + w);
    }
    areasAll.push(n);
  }
  // Keep real areas (not specks), biggest first so the page reads naturally in the region list.
  const keep = areasAll.map((a, i) => ({ a, i })).filter((r) => r.a >= MIN_REGION_PIXELS).sort((p, q) => q.a - p.a);
  if (keep.length > MAX_REGIONS) return { ok: false, reason: `This picture has ${keep.length} separate areas, which is too many to color comfortably (the limit is ${MAX_REGIONS}). Try simpler line art.` };
  if (keep.length < 2) return { ok: false, reason: 'No closed shapes were found. Use clear dark outlines on a light background, with the shapes closed.' };
  const number = new Map<number, number>();
  keep.forEach((r, k) => number.set(r.i, k + 1));
  const labels = new Uint16Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const c = comp[p];
    if (c >= 0) labels[p] = number.get(c) ?? 0;
  }
  // Let each area run a little under the lines around it, so a filled area leaves no pale edge.
  for (let pass = 0; pass < 3; pass++) {
    const grow: [number, number][] = [];
    for (let p = 0; p < w * h; p++) {
      if (labels[p] !== 0) continue;
      const x = p % w;
      const y = (p / w) | 0;
      const near = (x > 0 && labels[p - 1]) || (x < w - 1 && labels[p + 1]) || (y > 0 && labels[p - w]) || (y < h - 1 && labels[p + w]) || 0;
      if (near && wall[p]) grow.push([p, near]);
    }
    for (const [p, v] of grow) labels[p] = v;
    if (!grow.length) break;
  }
  const areas = [0, ...keep.map((r) => r.a)];
  return { ok: true, value: { w, h, labels, count: keep.length, areas } };
}

/** SVG path data for one region: rows of pixels, with identical neighbouring rows merged. */
export function regionPath(t: Traced, id: number): string {
  const { w, h, labels } = t;
  type Run = { x: number; w: number; y: number; h: number };
  let open: Run[] = [];
  const done: Run[] = [];
  for (let y = 0; y < h; y++) {
    const row: { x: number; w: number }[] = [];
    let x = 0;
    while (x < w) {
      if (labels[y * w + x] !== id) {
        x++;
        continue;
      }
      const x0 = x;
      while (x < w && labels[y * w + x] === id) x++;
      row.push({ x: x0, w: x - x0 });
    }
    const next: Run[] = [];
    for (const r of row) {
      const same = open.find((o) => o.x === r.x && o.w === r.w && o.y + o.h === y);
      if (same) {
        same.h++;
        next.push(same);
      } else next.push({ x: r.x, w: r.w, y, h: 1 });
    }
    for (const o of open) if (!next.includes(o)) done.push(o);
    open = next;
  }
  done.push(...open);
  return done.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`).join('');
}

export interface PageFiles {
  svg: string;
  regions: { viewBox: [number, number]; regions: { id: string; name: string }[] };
}

/** The coloring-page SVG and region list. `linesHref` is the lines picture as a data: URL. */
export function buildPage(t: Traced, linesHref: string): PageFiles {
  const regions: { id: string; name: string }[] = [];
  let body = '';
  for (let id = 1; id <= t.count; id++) {
    const rid = `area_${id}`;
    regions.push({ id: rid, name: `Area ${id}` });
    body += `<path data-region="${rid}" fill="#ffffff" d="${regionPath(t, id)}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t.w} ${t.h}" width="${t.w}" height="${t.h}"><rect width="${t.w}" height="${t.h}" fill="#ffffff"/>${body}<image href="${linesHref}" x="0" y="0" width="${t.w}" height="${t.h}"/></svg>`;
  return { svg, regions: { viewBox: [t.w, t.h], regions } };
}

/** Pixels darker than this (0 black .. 255 white) count as line. */
export const LINE_LEVEL = 150;

/** Marks line pixels from gray values, and lets a pixel count as line if any pixel of its block is. */
export function darkFromGray(gray: Uint8Array, gw: number, gh: number, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const sx = gw / w;
  const sy = gh / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let min = 255;
      for (let yy = y0; yy < y1 && yy < gh; yy++) for (let xx = x0; xx < x1 && xx < gw; xx++) min = Math.min(min, gray[yy * gw + xx]);
      out[y * w + x] = min < LINE_LEVEL ? 1 : 0;
    }
  }
  return out;
}
