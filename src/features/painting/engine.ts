/**
 * PaintEngine: all canvas work for coloring pages and free drawing.
 *
 * Layers (bottom to top, all the same logical size):
 *   bg     paper colour or a Free Canvas background
 *   paint  the user's colour (this is what gets saved)
 *   lines  the page's line art, blended with "multiply"
 *   fx     short-lived effects (paintball flight, sparkles)
 *
 * Brush strokes are drawn on an off-screen "stroke" layer and composited onto
 * the paint layer on top of a snapshot taken at the start of the stroke. This
 * gives uniform per-stroke opacity (markers), cheap undo (one patch per stroke)
 * and optional "Stay Inside Lines" masking, all with tiny dirty rectangles.
 */
import { History, type Sized } from '../../core/undo';
import { createRng, randomSeed } from '../../core/rng';
import { drawSplat, makeSplat, PAINTBALL_SIZES, type PaintballSize } from '../../core/splat';
import { hexToRgb, rgbToHex, clamp, mix } from '../../core/util';
import type { BackgroundDef, RegionsFile } from '../../core/manifests';
import { drawBackground } from './backgrounds';
import { RegionMap, buildRegionSvg } from './regionMap';
import { canvasToPng, ctx2d, makeCanvas, pngToBitmap, rasterizeSvg, sizeSvg } from './raster';
import { BRUSHES, isBrushTool, type ToolId } from './tools';

export const PAPER = '#fffdf8';
export const LINE_COLOR = '#6e6a8e';

interface Pt {
  x: number;
  y: number;
}
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Patch extends Sized, Rect {
  data: ImageData;
}

export interface EngineState {
  tool: ToolId;
  color: string;
  size: number;
  stayInside: boolean;
  paintballSize: PaintballSize;
  reduceMotion: boolean;
  particles: boolean;
}

const union = (a: Rect | null, b: Rect): Rect => {
  if (!a) return b;
  const x0 = Math.min(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const x1 = Math.max(a.x + a.w, b.x + b.w);
  const y1 = Math.max(a.y + a.h, b.y + b.h);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

export class PaintEngine {
  readonly bg: HTMLCanvasElement;
  readonly paint: HTMLCanvasElement;
  readonly lines: HTMLCanvasElement;
  readonly fx: HTMLCanvasElement;

  private pctx: CanvasRenderingContext2D;
  private fxctx: CanvasRenderingContext2D;
  private stroke: HTMLCanvasElement;
  private sctx: CanvasRenderingContext2D;
  private snap: HTMLCanvasElement;
  private snctx: CanvasRenderingContext2D;
  private tmp: HTMLCanvasElement;
  private tctx: CanvasRenderingContext2D;

  regionMap: RegionMap | null = null;
  regions: RegionsFile | null = null;
  readonly history = new History<Patch>(60, 96 * 1024 * 1024);

  state: EngineState = {
    tool: 'brush',
    color: '#a9d4f5',
    size: 18,
    stayInside: true,
    paintballSize: 'medium',
    reduceMotion: false,
    particles: true
  };

  /** Called after any change to the paint layer. */
  onChange: () => void = () => {};
  /** Called when undo/redo availability changes. */
  onHistory: () => void = () => {};
  /** True when there is nothing painted (so an empty page is not saved as art). */
  blank = true;

  // stroke state
  private drawing = false;
  private prev: Pt = { x: 0, y: 0 };
  private lastMid: Pt = { x: 0, y: 0 };
  private bounds: Rect | null = null;
  private maskId = 0;
  private strokeTool: ToolId = 'brush';
  private strokeColor = '#000';
  private strokeSize = 10;
  private crayonPattern: CanvasPattern | null = null;
  private airStamp: { key: string; canvas: HTMLCanvasElement } | null = null;
  private noiseTiles = new Map<string, HTMLCanvasElement>();

  // fx
  private anims: Array<(t: number) => boolean> = [];
  private raf = 0;

  constructor(
    readonly width: number,
    readonly height: number
  ) {
    this.bg = makeCanvas(width, height);
    this.paint = makeCanvas(width, height);
    this.lines = makeCanvas(width, height);
    this.fx = makeCanvas(width, height);
    this.stroke = makeCanvas(width, height);
    this.snap = makeCanvas(width, height);
    this.tmp = makeCanvas(width, height);
    this.pctx = ctx2d(this.paint);
    this.fxctx = ctx2d(this.fx);
    this.sctx = ctx2d(this.stroke);
    this.snctx = ctx2d(this.snap);
    this.tctx = ctx2d(this.tmp, { willReadFrequently: true });
    this.setBackground(null);
  }

  // ------------------------------------------------------------ setup

  setBackground(def: BackgroundDef | null) {
    const ctx = ctx2d(this.bg);
    if (def) drawBackground(ctx, def, this.width, this.height);
    else {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /** Renders the line art and builds the region lookup. Pass null for free drawing. */
  async setLineArt(svg: string | null, regions: RegionsFile | null) {
    const lctx = ctx2d(this.lines);
    lctx.clearRect(0, 0, this.width, this.height);
    this.regionMap = null;
    this.regions = regions;
    if (!svg || !regions) return;
    const art = await rasterizeSvg(sizeSvg(svg, this.width, this.height), this.width, this.height, true);
    lctx.drawImage(art, 0, 0);
    const ids = regions.regions.map((r) => r.id);
    const regionSvg = buildRegionSvg(svg, ids, this.width, this.height);
    const regionCanvas = await rasterizeSvg(regionSvg, this.width, this.height, false);
    const data = ctx2d(regionCanvas, { willReadFrequently: true }).getImageData(0, 0, this.width, this.height);
    this.regionMap = RegionMap.fromRgba(data.data, this.width, this.height, ids);
  }

  async loadPaint(bytes: Uint8Array | null) {
    this.pctx.clearRect(0, 0, this.width, this.height);
    this.history.clear();
    this.blank = true;
    if (bytes && bytes.byteLength) {
      const bmp = await pngToBitmap(bytes);
      this.pctx.drawImage(bmp, 0, 0, this.width, this.height);
      bmp.close();
      this.blank = false;
    }
    this.onHistory();
  }

  async exportPaintPng(): Promise<Uint8Array> {
    return canvasToPng(this.paint);
  }

  /** Flat image of everything the user sees (paper + paint + lines). */
  compose(scale = 1): HTMLCanvasElement {
    const w = Math.round(this.width * scale);
    const h = Math.round(this.height * scale);
    const out = makeCanvas(w, h);
    const ctx = ctx2d(out);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.bg, 0, 0, w, h);
    ctx.drawImage(this.paint, 0, 0, w, h);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.lines, 0, 0, w, h);
    return out;
  }

  async exportFlatPng(): Promise<Uint8Array> {
    return canvasToPng(this.compose(1));
  }

  async thumbnailPng(width = 360): Promise<Uint8Array> {
    return canvasToPng(this.compose(width / this.width));
  }

  // ------------------------------------------------------------ history

  private readRect(r: Rect): Patch {
    const data = this.pctx.getImageData(r.x, r.y, r.w, r.h);
    return { ...r, data, bytes: data.data.byteLength };
  }

  private clampRect(r: Rect): Rect {
    const x = clamp(Math.floor(r.x), 0, this.width);
    const y = clamp(Math.floor(r.y), 0, this.height);
    const x1 = clamp(Math.ceil(r.x + r.w), 0, this.width);
    const y1 = clamp(Math.ceil(r.y + r.h), 0, this.height);
    return { x, y, w: Math.max(0, x1 - x), h: Math.max(0, y1 - y) };
  }

  private swap = (e: Patch): Patch => {
    const cur = this.readRect(e);
    this.pctx.putImageData(e.data, e.x, e.y);
    return cur;
  };

  undo(): boolean {
    if (this.drawing) return false;
    const ok = this.history.undo(this.swap);
    if (ok) {
      this.blank = false;
      this.onChange();
      this.onHistory();
    }
    return ok;
  }

  redo(): boolean {
    if (this.drawing) return false;
    const ok = this.history.redo(this.swap);
    if (ok) {
      this.onChange();
      this.onHistory();
    }
    return ok;
  }

  private commit(before: Patch) {
    this.history.push(before);
    this.blank = false;
    this.onChange();
    this.onHistory();
  }

  // ------------------------------------------------------------ strokes

  get isDrawing() {
    return this.drawing;
  }

  beginStroke(x: number, y: number): boolean {
    const tool = this.state.tool;
    if (!isBrushTool(tool) || this.drawing) return false;
    this.drawing = true;
    this.strokeTool = tool;
    this.strokeColor = this.state.color;
    this.strokeSize = Math.max(1, this.state.size * BRUSHES[tool].scale);
    this.bounds = null;
    this.snctx.clearRect(0, 0, this.width, this.height);
    this.snctx.drawImage(this.paint, 0, 0);
    this.maskId = 0;
    if (this.state.stayInside && this.regionMap && tool !== 'eraser') this.maskId = this.regionMap.idNearest(x, y, 4);
    if (tool === 'crayon') this.crayonPattern = this.sctx.createPattern(this.noiseTile(this.strokeColor), 'repeat');
    this.prev = { x, y };
    this.lastMid = { x, y };
    // initial dab
    const r = this.dabRect({ x, y }, { x, y });
    this.dab(x, y);
    this.bounds = r;
    this.compositeRect(r);
    return true;
  }

  moveStroke(points: Pt[]) {
    if (!this.drawing) return;
    let dirty: Rect | null = null;
    for (const p of points) {
      const mid = { x: (this.prev.x + p.x) / 2, y: (this.prev.y + p.y) / 2 };
      const r = this.dabRect(this.lastMid, p);
      this.segment(this.lastMid, this.prev, mid);
      dirty = union(dirty, r);
      this.lastMid = mid;
      this.prev = p;
    }
    if (dirty) {
      this.bounds = union(this.bounds, dirty);
      this.compositeRect(dirty);
    }
  }

  endStroke() {
    if (!this.drawing) return;
    // finish the curve to the last point
    const r = this.dabRect(this.lastMid, this.prev);
    this.segment(this.lastMid, this.prev, this.prev);
    this.bounds = union(this.bounds, r);
    this.compositeRect(r);
    this.drawing = false;
    const b = this.bounds ? this.clampRect(this.bounds) : null;
    if (b && b.w > 0 && b.h > 0) {
      const before = this.snctx.getImageData(b.x, b.y, b.w, b.h);
      this.sctx.clearRect(b.x, b.y, b.w, b.h);
      this.commit({ ...b, data: before, bytes: before.data.byteLength });
    }
    this.bounds = null;
    this.maskId = 0;
  }

  cancelStroke() {
    if (!this.drawing) return;
    this.drawing = false;
    this.pctx.clearRect(0, 0, this.width, this.height);
    this.pctx.drawImage(this.snap, 0, 0);
    this.sctx.clearRect(0, 0, this.width, this.height);
  }

  private dabRect(a: Pt, b: Pt): Rect {
    const m = (this.strokeSize / 2) * (this.strokeTool === 'airbrush' ? 1.0 : 1) + BRUSHES[this.strokeTool as keyof typeof BRUSHES].margin + 2;
    const x0 = Math.min(a.x, b.x) - m;
    const y0 = Math.min(a.y, b.y) - m;
    return this.clampRect({ x: x0, y: y0, w: Math.abs(a.x - b.x) + m * 2, h: Math.abs(a.y - b.y) + m * 2 });
  }

  private dab(x: number, y: number) {
    const c = this.sctx;
    if (this.strokeTool === 'airbrush') {
      this.stamp(x, y);
      return;
    }
    c.save();
    this.styleStroke(c);
    c.fillStyle = this.strokeTool === 'crayon' && this.crayonPattern ? this.crayonPattern : this.strokeColor;
    if (this.strokeTool === 'marker') {
      const s = this.strokeSize;
      c.fillRect(x - s / 2, y - s / 2, s, s);
    } else {
      c.beginPath();
      c.arc(x, y, this.strokeSize / 2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  private styleStroke(c: CanvasRenderingContext2D) {
    c.lineCap = BRUSHES[this.strokeTool as keyof typeof BRUSHES].cap;
    c.lineJoin = this.strokeTool === 'marker' ? 'bevel' : 'round';
    c.lineWidth = this.strokeSize;
    c.strokeStyle = this.strokeTool === 'crayon' && this.crayonPattern ? this.crayonPattern : this.strokeColor;
  }

  /** Draws the curve from `from` (via control `ctrl`) to `to`. */
  private segment(from: Pt, ctrl: Pt, to: Pt) {
    const c = this.sctx;
    if (this.strokeTool === 'airbrush') {
      const spacing = Math.max(1.5, this.strokeSize * 0.12);
      const len = Math.hypot(ctrl.x - from.x, ctrl.y - from.y) + Math.hypot(to.x - ctrl.x, to.y - ctrl.y);
      const n = Math.max(1, Math.ceil(len / spacing));
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const u = 1 - t;
        this.stamp(u * u * from.x + 2 * u * t * ctrl.x + t * t * to.x, u * u * from.y + 2 * u * t * ctrl.y + t * t * to.y);
      }
      return;
    }
    c.save();
    this.styleStroke(c);
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.quadraticCurveTo(ctrl.x, ctrl.y, to.x, to.y);
    c.stroke();
    c.restore();
  }

  private stamp(x: number, y: number) {
    const r = this.strokeSize / 2;
    const key = `${this.strokeColor}|${Math.round(r)}`;
    if (!this.airStamp || this.airStamp.key !== key) {
      const size = Math.ceil(r * 2);
      const cv = makeCanvas(size, size);
      const cx = ctx2d(cv);
      const g = cx.createRadialGradient(r, r, 0, r, r, r);
      const [cr, cg, cb] = hexToRgb(this.strokeColor);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},0.55)`);
      g.addColorStop(0.45, `rgba(${cr},${cg},${cb},0.22)`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      cx.fillStyle = g;
      cx.fillRect(0, 0, size, size);
      this.airStamp = { key, canvas: cv };
    }
    this.sctx.globalAlpha = 0.42;
    this.sctx.drawImage(this.airStamp.canvas, x - r, y - r);
    this.sctx.globalAlpha = 1;
  }

  private noiseTile(color: string): HTMLCanvasElement {
    let tile = this.noiseTiles.get(color);
    if (tile) return tile;
    const n = 96;
    tile = makeCanvas(n, n);
    const cx = ctx2d(tile);
    const img = cx.createImageData(n, n);
    const [r, g, b] = hexToRgb(color);
    const rng = createRng(0x51ed);
    for (let i = 0; i < n * n; i++) {
      const v = rng();
      const a = v < 0.16 ? 0 : v < 0.4 ? 0.55 + rng() * 0.2 : 0.82 + rng() * 0.18;
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = a * 255;
    }
    cx.putImageData(img, 0, 0);
    this.noiseTiles.set(color, tile);
    if (this.noiseTiles.size > 24) this.noiseTiles.delete(this.noiseTiles.keys().next().value!);
    return tile;
  }

  /** Redraws the dirty rect: snapshot + this stroke (masked / erasing as needed). */
  private compositeRect(rect: Rect) {
    const { x, y, w, h } = rect;
    if (w <= 0 || h <= 0) return;
    const p = this.pctx;
    p.clearRect(x, y, w, h);
    p.drawImage(this.snap, x, y, w, h, x, y, w, h);
    if (this.strokeTool === 'eraser') {
      p.save();
      p.globalCompositeOperation = 'destination-out';
      p.drawImage(this.stroke, x, y, w, h, x, y, w, h);
      p.restore();
      return;
    }
    const alpha = BRUSHES[this.strokeTool as keyof typeof BRUSHES].alpha;
    if (this.maskId && this.regionMap) {
      this.applyMasked(this.stroke, rect, this.maskId, alpha);
    } else {
      p.save();
      p.globalAlpha = alpha;
      p.drawImage(this.stroke, x, y, w, h, x, y, w, h);
      p.restore();
    }
  }

  /** Draws `src` into the paint layer, keeping only pixels that belong to region `id`. */
  private applyMasked(src: HTMLCanvasElement, rect: Rect, id: number, alpha: number) {
    const { x, y, w, h } = rect;
    const t = this.tctx;
    t.clearRect(0, 0, w, h);
    t.drawImage(src, x, y, w, h, 0, 0, w, h);
    const img = t.getImageData(0, 0, w, h);
    const d = img.data;
    const ids = this.regionMap!.ids;
    const W = this.width;
    for (let j = 0; j < h; j++) {
      const row = (y + j) * W + x;
      for (let i = 0; i < w; i++) {
        if (ids[row + i] !== id) d[(j * w + i) * 4 + 3] = 0;
      }
    }
    t.putImageData(img, 0, 0);
    const p = this.pctx;
    p.save();
    p.globalAlpha = alpha;
    p.drawImage(this.tmp, 0, 0, w, h, x, y, w, h);
    p.restore();
  }

  // ------------------------------------------------------------ fills

  /** Region fill on coloring pages; contiguous flood fill on free canvases. */
  fillAt(x: number, y: number): boolean {
    const color = hexToRgb(this.state.color);
    if (this.regionMap) {
      const id = this.regionMap.idNearest(x, y, 8);
      const b = id ? this.regionMap.bboxes[id] : null;
      if (!id || !b) return false;
      const rect = { x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 };
      const img = this.pctx.getImageData(rect.x, rect.y, rect.w, rect.h);
      const before: Patch = { ...rect, data: new ImageData(new Uint8ClampedArray(img.data), rect.w, rect.h), bytes: img.data.byteLength };
      const ids = this.regionMap.ids;
      const d = img.data;
      for (let j = 0; j < rect.h; j++) {
        const row = (rect.y + j) * this.width + rect.x;
        for (let i = 0; i < rect.w; i++) {
          if (ids[row + i] === id) {
            const o = (j * rect.w + i) * 4;
            d[o] = color[0];
            d[o + 1] = color[1];
            d[o + 2] = color[2];
            d[o + 3] = 255;
          }
        }
      }
      this.pctx.putImageData(img, rect.x, rect.y);
      this.commit(before);
      return true;
    }
    return this.floodFill(Math.floor(x), Math.floor(y), color);
  }

  private floodFill(sx: number, sy: number, color: [number, number, number]): boolean {
    const W = this.width;
    const H = this.height;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return false;
    const full = this.pctx.getImageData(0, 0, W, H);
    const d = full.data;
    const o0 = (sy * W + sx) * 4;
    const tr = d[o0], tg = d[o0 + 1], tb = d[o0 + 2], ta = d[o0 + 3];
    if (ta === 255 && tr === color[0] && tg === color[1] && tb === color[2]) return false;
    const tol = 56;
    const match = (o: number) => Math.abs(d[o] - tr) + Math.abs(d[o + 1] - tg) + Math.abs(d[o + 2] - tb) + Math.abs(d[o + 3] - ta) <= tol;
    const seen = new Uint8Array(W * H);
    const stack: number[] = [sx, sy];
    let x0 = sx, x1 = sx, y0 = sy, y1 = sy;
    const filled: number[] = [];
    while (stack.length) {
      const y = stack.pop()!;
      let x = stack.pop()!;
      while (x >= 0 && !seen[y * W + x] && match((y * W + x) * 4)) x--;
      x++;
      let up = false;
      let down = false;
      while (x < W && !seen[y * W + x] && match((y * W + x) * 4)) {
        seen[y * W + x] = 1;
        filled.push(y * W + x);
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        if (y > 0) {
          const m = !seen[(y - 1) * W + x] && match(((y - 1) * W + x) * 4);
          if (m && !up) {
            stack.push(x, y - 1);
            up = true;
          } else if (!m) up = false;
        }
        if (y < H - 1) {
          const m = !seen[(y + 1) * W + x] && match(((y + 1) * W + x) * 4);
          if (m && !down) {
            stack.push(x, y + 1);
            down = true;
          } else if (!m) down = false;
        }
        x++;
      }
    }
    // grow by one pixel so anti-aliased stroke edges don't leave a halo
    const grown = new Uint8Array(seen);
    for (const i of filled) {
      const px = i % W;
      const py = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (!grown[n] && d[n * 4 + 3] < 255) {
          grown[n] = 1;
          if (nx < x0) x0 = nx;
          if (nx > x1) x1 = nx;
          if (ny < y0) y0 = ny;
          if (ny > y1) y1 = ny;
        }
      }
    }
    const rect = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    const beforeImg = this.pctx.getImageData(rect.x, rect.y, rect.w, rect.h);
    for (let j = y0; j <= y1; j++) {
      for (let i = x0; i <= x1; i++) {
        if (grown[j * W + i]) {
          const o = (j * W + i) * 4;
          d[o] = color[0];
          d[o + 1] = color[1];
          d[o + 2] = color[2];
          d[o + 3] = 255;
        }
      }
    }
    const after = new ImageData(rect.w, rect.h);
    for (let j = 0; j < rect.h; j++) {
      const src = ((rect.y + j) * W + rect.x) * 4;
      after.data.set(d.subarray(src, src + rect.w * 4), j * rect.w * 4);
    }
    this.pctx.putImageData(after, rect.x, rect.y);
    this.commit({ ...rect, data: beforeImg, bytes: beforeImg.data.byteLength });
    return true;
  }

  /** Removes every bit of paint inside one region. */
  clearRegionAt(x: number, y: number): boolean {
    if (!this.regionMap) return false;
    const id = this.regionMap.idNearest(x, y, 8);
    const b = id ? this.regionMap.bboxes[id] : null;
    if (!id || !b) return false;
    const rect = { x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 };
    const img = this.pctx.getImageData(rect.x, rect.y, rect.w, rect.h);
    const before: Patch = { ...rect, data: new ImageData(new Uint8ClampedArray(img.data), rect.w, rect.h), bytes: img.data.byteLength };
    const ids = this.regionMap.ids;
    let any = false;
    for (let j = 0; j < rect.h; j++) {
      const row = (rect.y + j) * this.width + rect.x;
      for (let i = 0; i < rect.w; i++) {
        if (ids[row + i] === id) {
          const o = (j * rect.w + i) * 4 + 3;
          if (img.data[o]) any = true;
          img.data[o] = 0;
        }
      }
    }
    if (!any) return false;
    this.pctx.putImageData(img, rect.x, rect.y);
    this.commit(before);
    return true;
  }

  /** Clears the whole page (undoable). The UI must ask for confirmation first. */
  resetAll(): void {
    const rect = { x: 0, y: 0, w: this.width, h: this.height };
    const before = this.readRect(rect);
    this.pctx.clearRect(0, 0, this.width, this.height);
    this.commit(before);
    this.blank = true;
  }

  /** Colour currently visible at a point (paint over paper/background). */
  sampleColor(x: number, y: number): string | null {
    const xi = clamp(Math.floor(x), 0, this.width - 1);
    const yi = clamp(Math.floor(y), 0, this.height - 1);
    const p = this.pctx.getImageData(xi, yi, 1, 1).data;
    if (p[3] === 0) {
      const b = ctx2d(this.bg).getImageData(xi, yi, 1, 1).data;
      return rgbToHex(b[0], b[1], b[2]);
    }
    if (p[3] === 255) return rgbToHex(p[0], p[1], p[2]);
    const b = ctx2d(this.bg).getImageData(xi, yi, 1, 1).data;
    const a = p[3] / 255;
    return rgbToHex(p[0] * a + b[0] * (1 - a), p[1] * a + b[1] * (1 - a), p[2] * a + b[2] * (1 - a));
  }

  // ------------------------------------------------------------ paintball

  paintball(x: number, y: number): void {
    const radius = PAINTBALL_SIZES[this.state.paintballSize];
    const color = this.state.color;
    const shape = makeSplat(radius, randomSeed());
    const maskId = this.state.stayInside && this.regionMap ? this.regionMap.idNearest(x, y, 4) : 0;
    const finish = () => {
      const rect = this.clampRect({ x: x - shape.extent, y: y - shape.extent, w: shape.extent * 2, h: shape.extent * 2 });
      if (rect.w <= 0 || rect.h <= 0) return;
      const before = this.readRect(rect);
      // draw onto the stroke layer, then composite (optionally masked) over the paint layer
      this.sctx.clearRect(rect.x, rect.y, rect.w, rect.h);
      drawSplat(this.sctx, x, y, shape, color, 1);
      if (maskId && this.regionMap) this.applyMasked(this.stroke, rect, maskId, 1);
      else this.pctx.drawImage(this.stroke, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
      this.sctx.clearRect(rect.x, rect.y, rect.w, rect.h);
      this.commit(before);
    };
    if (this.state.reduceMotion) {
      finish();
      return;
    }
    // flight: ball arcs in from below, then the splat spreads
    const startX = x + (Math.random() - 0.5) * 240;
    const startY = this.height + 40;
    const flight = 240;
    const spread = 300;
    const t0 = performance.now();
    const ballR = radius * 0.3;
    const sparks = this.state.particles
      ? Array.from({ length: 7 }, () => ({ a: Math.random() * Math.PI * 2, d: radius * (1.1 + Math.random() * 1.2), s: 5 + Math.random() * 6 }))
      : [];
    let committed = false;
    this.anim((now) => {
      const t = now - t0;
      const f = this.fxctx;
      if (t < flight) {
        const k = t / flight;
        const e = k * k;
        const bx = startX + (x - startX) * e;
        const by = startY + (y - startY) * e - Math.sin(k * Math.PI) * 60;
        const r = ballR * (1.25 - 0.4 * k);
        const g = f.createRadialGradient(bx - r * 0.35, by - r * 0.35, r * 0.1, bx, by, r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, mix(color, '#ffffff', 0.35));
        g.addColorStop(1, color);
        f.fillStyle = g;
        f.beginPath();
        f.arc(bx, by, r, 0, Math.PI * 2);
        f.fill();
        return true;
      }
      const k = Math.min(1, (t - flight) / spread);
      drawSplat(f, x, y, shape, color, k);
      if (sparks.length) {
        f.save();
        f.fillStyle = '#fff8d6';
        f.globalAlpha = 1 - k;
        for (const s of sparks) {
          const d = s.d * (0.5 + k * 0.7);
          const sx = x + Math.cos(s.a) * d;
          const sy = y + Math.sin(s.a) * d;
          f.beginPath();
          for (let i = 0; i < 8; i++) {
            const rad = i % 2 === 0 ? s.s * (1 - k * 0.4) : s.s * 0.3;
            const a = (Math.PI / 4) * i;
            f.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad);
          }
          f.closePath();
          f.fill();
        }
        f.restore();
      }
      if (k >= 1) {
        if (!committed) {
          committed = true;
          finish();
        }
        return false;
      }
      return true;
    });
  }

  private anim(step: (now: number) => boolean) {
    this.anims.push(step);
    if (!this.raf) {
      const loop = (now: number) => {
        this.fxctx.clearRect(0, 0, this.width, this.height);
        this.anims = this.anims.filter((a) => a(now));
        this.raf = this.anims.length ? requestAnimationFrame(loop) : 0;
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  dispose() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.anims = [];
    this.history.clear();
  }
}
