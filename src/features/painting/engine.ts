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
import { drawStamp, stampExtent, stampRadius, type StampId } from './stamps';
import { colorAreaMask } from './colorArea';
import { MAX_LAYERS, blendOf, cleanName, cleanOpacity, defaultLayerName, nextLayerId, type BlendId, type LayerCommand, type LayerMeta } from './layers';

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
  /** The layer these pixels belong to (filled in when the step is recorded). */
  layerId?: string;
}
/** A step that is not pixels: adding, moving or changing a layer. Running it undoes it and returns the step that redoes it. */
interface OpEntry extends Sized {
  run: () => Entry;
}
type Entry = Patch | OpEntry;
const isOp = (e: Entry): e is OpEntry => 'run' in e;

/** One layer of the painting. */
export interface EngineLayer extends LayerMeta {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Changed since it was last saved. */
  dirty: boolean;
}

export interface EngineState {
  tool: ToolId;
  color: string;
  size: number;
  stayInside: boolean;
  paintballSize: PaintballSize;
  stampShape: StampId;
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
  readonly lines: HTMLCanvasElement;
  readonly fx: HTMLCanvasElement;

  /** Bottom to top. Coloring pages have exactly one. */
  layers: EngineLayer[] = [];
  activeId = 'l1';
  /** True for Free Draw, where more than one layer is allowed. */
  allowLayers = false;
  /** Called when layers are added, moved, changed or selected. */
  onLayers: () => void = () => {};
  private host: HTMLElement | null = null;
  private get active(): EngineLayer {
    return this.layers.find((l) => l.id === this.activeId) ?? this.layers[this.layers.length - 1];
  }
  /** The canvas of the layer being painted on. */
  get paint(): HTMLCanvasElement {
    return this.active.canvas;
  }
  private get pctx(): CanvasRenderingContext2D {
    return this.active.ctx;
  }
  private fxctx: CanvasRenderingContext2D;
  private stroke: HTMLCanvasElement;
  private sctx: CanvasRenderingContext2D;
  private snap: HTMLCanvasElement;
  private snctx: CanvasRenderingContext2D;
  private tmp: HTMLCanvasElement;
  private tctx: CanvasRenderingContext2D;

  regionMap: RegionMap | null = null;
  regions: RegionsFile | null = null;
  readonly history = new History<Entry>(60, 96 * 1024 * 1024);

  state: EngineState = {
    tool: 'brush',
    color: '#a9d4f5',
    size: 18,
    stayInside: true,
    paintballSize: 'medium',
    stampShape: 'star',
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
  /** On Free Draw, "inside areas": the pixels of the similar-color area where the stroke started. */
  private maskBits: Uint8Array | null = null;
  private strokeTool: ToolId = 'brush';
  private strokeColor = '#000';
  private strokeSize = 10;
  private crayonPattern: CanvasPattern | null = null;
  /** Watercolor redraws the whole wash as it grows, so its soft edge is the same all along. */
  private washPts: Pt[] = [];
  /** Glitter sparkles of the stroke being drawn. They are drawn at full strength on top of the soft trail. */
  private sparks: { x: number; y: number; r: number; c: string }[] = [];
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
    this.lines = makeCanvas(width, height);
    this.fx = makeCanvas(width, height);
    this.stroke = makeCanvas(width, height);
    this.snap = makeCanvas(width, height);
    this.tmp = makeCanvas(width, height);
    this.layers = [this.makeLayer({ id: 'l1', name: 'Layer 1', visible: true, locked: false, opacity: 1, blend: 'normal' })];
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
    this.active.dirty = true;
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

  /** What gets saved as paint.png: all visible layers flattened, with no paper and no lines. */
  async exportPaintPng(): Promise<Uint8Array> {
    if (this.layers.length === 1 && this.layers[0].visible && this.layers[0].opacity === 1 && this.layers[0].blend === 'normal') return canvasToPng(this.layers[0].canvas);
    const out = makeCanvas(this.width, this.height);
    this.drawLayers(ctx2d(out), this.width, this.height);
    return canvasToPng(out);
  }

  /** Draws every visible layer, bottom to top, with its opacity and blend mode. */
  private drawLayers(ctx: CanvasRenderingContext2D, w: number, h: number) {
    for (const l of this.layers) {
      if (!l.visible || l.opacity <= 0) continue;
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.globalCompositeOperation = blendOf(l.blend).op as GlobalCompositeOperation;
      ctx.drawImage(l.canvas, 0, 0, w, h);
      ctx.restore();
    }
  }

  /** Flat image of everything the user sees (paper + paint + lines). */
  compose(scale = 1): HTMLCanvasElement {
    const w = Math.round(this.width * scale);
    const h = Math.round(this.height * scale);
    const out = makeCanvas(w, h);
    const ctx = ctx2d(out);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.bg, 0, 0, w, h);
    this.drawLayers(ctx, w, h);
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

  private readRect(r: Rect, layer: EngineLayer = this.active): Patch {
    const data = layer.ctx.getImageData(r.x, r.y, r.w, r.h);
    return { ...r, data, bytes: data.data.byteLength, layerId: layer.id };
  }

  private clampRect(r: Rect): Rect {
    const x = clamp(Math.floor(r.x), 0, this.width);
    const y = clamp(Math.floor(r.y), 0, this.height);
    const x1 = clamp(Math.ceil(r.x + r.w), 0, this.width);
    const y1 = clamp(Math.ceil(r.y + r.h), 0, this.height);
    return { x, y, w: Math.max(0, x1 - x), h: Math.max(0, y1 - y) };
  }

  private swap = (e: Entry): Entry => {
    if (isOp(e)) {
      const back = e.run();
      this.onLayers();
      return back;
    }
    const layer = this.layers.find((l) => l.id === e.layerId) ?? this.active;
    const cur = this.readRect(e, layer);
    layer.ctx.putImageData(e.data, e.x, e.y);
    layer.dirty = true;
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
    before.layerId = this.active.id;
    this.active.dirty = true;
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
    if (!isBrushTool(tool) || this.drawing || this.paintBlockedReason()) return false;
    this.drawing = true;
    this.strokeTool = tool;
    this.strokeColor = this.state.color;
    this.strokeSize = Math.max(1, this.state.size * BRUSHES[tool].scale);
    this.bounds = null;
    this.snctx.clearRect(0, 0, this.width, this.height);
    this.snctx.drawImage(this.paint, 0, 0);
    this.maskId = 0;
    this.maskBits = null;
    if (this.state.stayInside && tool !== 'eraser') {
      if (this.regionMap) this.maskId = this.regionMap.idNearest(x, y, 4);
      else this.maskBits = this.colorAreaBits(x, y);
    }
    if (tool === 'crayon' || tool === 'pastel') this.crayonPattern = this.sctx.createPattern(this.noiseTile(this.strokeColor, tool), 'repeat');
    this.prev = { x, y };
    this.lastMid = { x, y };
    this.washPts = [{ x, y }];
    this.sparks = [];
    // initial dab
    const r = this.dabRect({ x, y }, { x, y });
    this.dab(x, y);
    this.bounds = r;
    this.compositeRect(r);
    return true;
  }

  moveStroke(points: Pt[]) {
    if (!this.drawing) return;
    if (this.strokeTool === 'watercolor') {
      this.wash(points);
      return;
    }
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
    if (this.strokeTool !== 'watercolor') this.segment(this.lastMid, this.prev, this.prev);
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
    this.maskBits = null;
  }

  cancelStroke() {
    if (!this.drawing) return;
    this.drawing = false;
    this.pctx.clearRect(0, 0, this.width, this.height);
    this.pctx.drawImage(this.snap, 0, 0);
    this.sctx.clearRect(0, 0, this.width, this.height);
  }

  /** Draws the whole watercolor wash again with the new points: a soft stroke with a slightly darker rim. */
  private wash(points: Pt[]) {
    let box: Rect | null = this.bounds;
    for (const p of points) {
      this.washPts.push(p);
      box = union(box, this.dabRect(p, p));
      this.prev = p;
      this.lastMid = p;
    }
    if (this.washPts.length > 4000) this.washPts = this.washPts.filter((_, i) => i % 2 === 0 || i === this.washPts.length - 1);
    if (!box) return;
    this.bounds = box;
    const c = this.sctx;
    c.clearRect(box.x, box.y, box.w, box.h);
    c.save();
    c.beginPath();
    const pts = this.washPts;
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const mid = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 };
      c.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mid.x, mid.y);
    }
    c.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = this.strokeColor;
    c.lineWidth = this.strokeSize;
    c.stroke();
    c.globalCompositeOperation = 'destination-out';
    c.globalAlpha = 0.38;
    c.lineWidth = this.strokeSize * 0.62;
    c.stroke();
    c.restore();
    this.compositeRect(box);
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
    c.fillStyle = (this.strokeTool === 'crayon' || this.strokeTool === 'pastel') && this.crayonPattern ? this.crayonPattern : this.strokeColor;
    if (this.strokeTool === 'marker') {
      const s = this.strokeSize;
      c.fillRect(x - s / 2, y - s / 2, s, s);
    } else {
      c.beginPath();
      c.arc(x, y, this.strokeSize / 2, 0, Math.PI * 2);
      c.fill();
      if (this.strokeTool === 'watercolor') {
        // a lighter middle leaves the edge a little darker, like pigment gathering at the rim of a wash
        c.globalCompositeOperation = 'destination-out';
        c.globalAlpha = 0.38;
        c.beginPath();
        c.arc(x, y, this.strokeSize * 0.31, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
    if (this.strokeTool === 'glitter') this.sparkle({ x, y }, { x, y });
  }

  private styleStroke(c: CanvasRenderingContext2D) {
    c.lineCap = BRUSHES[this.strokeTool as keyof typeof BRUSHES].cap;
    c.lineJoin = this.strokeTool === 'marker' ? 'bevel' : 'round';
    c.lineWidth = this.strokeSize;
    c.strokeStyle = (this.strokeTool === 'crayon' || this.strokeTool === 'pastel') && this.crayonPattern ? this.crayonPattern : this.strokeColor;
  }

  /** A few small sparkles scattered around a piece of the glitter stroke. */
  private sparkle(a: Pt, b: Pt) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.min(10, Math.max(1, Math.ceil(len / Math.max(3, this.strokeSize * 0.28))));
    const reach = this.strokeSize * 0.75;
    for (let i = 0; i < n && this.sparks.length < 3000; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      this.sparks.push({
        x: a.x + (b.x - a.x) * t + (Math.random() - 0.5) * reach * 2,
        y: a.y + (b.y - a.y) * t + (Math.random() - 0.5) * reach * 2,
        r: Math.max(2.5, this.strokeSize * (0.15 + Math.random() * 0.25)),
        c: Math.random() < 0.5 ? mix(this.strokeColor, '#ffd45e', 0.65) : mix(this.strokeColor, '#6e6a8e', 0.3)
      });
    }
  }

  /** Draws the sparkles that fall inside `rect` onto the layer being painted. */
  private drawSparks(rect: Rect) {
    const p = this.pctx;
    p.save();
    p.beginPath();
    p.rect(rect.x, rect.y, rect.w, rect.h);
    p.clip();
    for (const sp of this.sparks) {
      if (sp.x < rect.x - sp.r || sp.x > rect.x + rect.w + sp.r || sp.y < rect.y - sp.r || sp.y > rect.y + rect.h + sp.r) continue;
      if (this.maskId && this.regionMap && this.regionMap.ids[Math.floor(sp.y) * this.width + Math.floor(sp.x)] !== this.maskId) continue;
      if (this.maskBits && this.maskBits[Math.floor(sp.y) * this.width + Math.floor(sp.x)] !== 1) continue;
      p.fillStyle = sp.c;
      p.beginPath();
      for (let k = 0; k < 8; k++) {
        const ang = (Math.PI / 4) * k;
        const rad = k % 2 === 0 ? sp.r : sp.r * 0.28;
        p.lineTo(sp.x + Math.cos(ang) * rad, sp.y + Math.sin(ang) * rad);
      }
      p.closePath();
      p.fill();
    }
    p.restore();
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
    if (this.strokeTool === 'glitter') this.sparkle(from, to);
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

  private noiseTile(color: string, kind: 'crayon' | 'pastel' = 'crayon'): HTMLCanvasElement {
    const key = kind === 'crayon' ? color : `${kind}|${color}`;
    let tile = this.noiseTiles.get(key);
    if (tile) return tile;
    const n = 96;
    tile = makeCanvas(n, n);
    const cx = ctx2d(tile);
    const img = cx.createImageData(n, n);
    const [r, g, b] = hexToRgb(color);
    const rng = createRng(0x51ed);
    for (let i = 0; i < n * n; i++) {
      const v = rng();
      // pastel is chalkier: more gaps and a softer, more broken texture than crayon
      const a = kind === 'pastel' ? (v < 0.3 ? 0 : v < 0.62 ? 0.35 + rng() * 0.3 : 0.7 + rng() * 0.25) : v < 0.16 ? 0 : v < 0.4 ? 0.55 + rng() * 0.2 : 0.82 + rng() * 0.18;
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = a * 255;
    }
    cx.putImageData(img, 0, 0);
    this.noiseTiles.set(key, tile);
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
    if (this.maskBits) {
      this.applyMasked(this.stroke, rect, 0, alpha, this.maskBits);
    } else if (this.maskId && this.regionMap) {
      this.applyMasked(this.stroke, rect, this.maskId, alpha);
    } else {
      p.save();
      p.globalAlpha = alpha;
      p.drawImage(this.stroke, x, y, w, h, x, y, w, h);
      p.restore();
    }
    if (this.strokeTool === 'glitter') this.drawSparks(rect);
  }

  /** Draws `src` into the paint layer, keeping only pixels that belong to region `id`. */
  private applyMasked(src: HTMLCanvasElement, rect: Rect, id: number, alpha: number, bits: Uint8Array | null = null) {
    const { x, y, w, h } = rect;
    const t = this.tctx;
    t.clearRect(0, 0, w, h);
    t.drawImage(src, x, y, w, h, 0, 0, w, h);
    const img = t.getImageData(0, 0, w, h);
    const d = img.data;
    const ids = bits ? null : this.regionMap!.ids;
    const W = this.width;
    for (let j = 0; j < h; j++) {
      const row = (y + j) * W + x;
      for (let i = 0; i < w; i++) {
        const inside = bits ? bits[row + i] === 1 : ids![row + i] === id;
        if (!inside) d[(j * w + i) * 4 + 3] = 0;
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
    if (this.paintBlockedReason()) return false;
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
    if (!this.regionMap || this.paintBlockedReason()) return false;
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
    if (this.layers.length > 1) {
      // every layer is cleared in one undoable step
      const saved = this.layers.map((l) => ({ l, copy: this.cloneCanvas(l.canvas) }));
      const clear = () => {
        for (const { l } of saved) {
          l.ctx.clearRect(0, 0, this.width, this.height);
          l.dirty = true;
        }
      };
      const restore = () => {
        for (const { l, copy } of saved) {
          l.ctx.clearRect(0, 0, this.width, this.height);
          l.ctx.drawImage(copy, 0, 0);
          l.dirty = true;
        }
      };
      clear();
      this.push(this.mkOp(restore, clear, saved.length * this.width * this.height * 4));
      this.blank = true;
      return;
    }
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
    // draw the one pixel of the background and every visible layer into a 1 x 1 canvas
    const one = makeCanvas(1, 1);
    const c = ctx2d(one);
    c.drawImage(this.bg, xi, yi, 1, 1, 0, 0, 1, 1);
    for (const l of this.layers) {
      if (!l.visible || l.opacity <= 0) continue;
      c.save();
      c.globalAlpha = l.opacity;
      c.globalCompositeOperation = blendOf(l.blend).op as GlobalCompositeOperation;
      c.drawImage(l.canvas, xi, yi, 1, 1, 0, 0, 1, 1);
      c.restore();
    }
    const p = c.getImageData(0, 0, 1, 1).data;
    return rgbToHex(p[0], p[1], p[2]);
  }

  /** On Free Draw: the area of similar color (in the picture you can see) around a point, or null. */
  private colorAreaBits(x: number, y: number): Uint8Array | null {
    const c = makeCanvas(this.width, this.height);
    const g = ctx2d(c, { willReadFrequently: true });
    g.drawImage(this.bg, 0, 0);
    this.drawLayers(g, this.width, this.height);
    const data = g.getImageData(0, 0, this.width, this.height).data;
    return colorAreaMask(data, this.width, this.height, x, y)?.bits ?? null;
  }

  // ------------------------------------------------------------ stamps

  /** Presses the chosen stamp onto the active layer. `rot` (radians) tilts it a little. */
  stampAt(x: number, y: number, rot = 0): boolean {
    if (this.paintBlockedReason()) return false;
    const r = stampRadius(this.state.size);
    const ext = stampExtent(r);
    const rect = this.clampRect({ x: x - ext, y: y - ext, w: ext * 2, h: ext * 2 });
    if (rect.w <= 0 || rect.h <= 0) return false;
    const before = this.readRect(rect);
    this.sctx.clearRect(rect.x, rect.y, rect.w, rect.h);
    drawStamp(this.sctx, this.state.stampShape, x, y, r, rot, this.state.color);
    const maskId = this.state.stayInside && this.regionMap ? this.regionMap.idNearest(x, y, 4) : 0;
    const bits = this.state.stayInside && !this.regionMap ? this.colorAreaBits(x, y) : null;
    if (bits) this.applyMasked(this.stroke, rect, 0, 1, bits);
    else if (maskId && this.regionMap) this.applyMasked(this.stroke, rect, maskId, 1);
    else this.pctx.drawImage(this.stroke, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
    this.sctx.clearRect(rect.x, rect.y, rect.w, rect.h);
    this.commit(before);
    return true;
  }

  // ------------------------------------------------------------ paintball

  paintball(x: number, y: number): void {
    if (this.paintBlockedReason()) return;
    const radius = PAINTBALL_SIZES[this.state.paintballSize];
    const color = this.state.color;
    const shape = makeSplat(radius, randomSeed());
    const maskId = this.state.stayInside && this.regionMap ? this.regionMap.idNearest(x, y, 4) : 0;
    const bits = this.state.stayInside && !this.regionMap ? this.colorAreaBits(x, y) : null;
    const finish = () => {
      const rect = this.clampRect({ x: x - shape.extent, y: y - shape.extent, w: shape.extent * 2, h: shape.extent * 2 });
      if (rect.w <= 0 || rect.h <= 0) return;
      const before = this.readRect(rect);
      // draw onto the stroke layer, then composite (optionally masked) over the paint layer
      this.sctx.clearRect(rect.x, rect.y, rect.w, rect.h);
      drawSplat(this.sctx, x, y, shape, color, 1);
      if (bits) this.applyMasked(this.stroke, rect, 0, 1, bits);
      else if (maskId && this.regionMap) this.applyMasked(this.stroke, rect, maskId, 1);
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

  // ------------------------------------------------------------ layers

  private makeLayer(m: LayerMeta): EngineLayer {
    const canvas = makeCanvas(this.width, this.height);
    return { ...m, canvas, ctx: ctx2d(canvas), dirty: false };
  }

  private cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
    const c = makeCanvas(this.width, this.height);
    ctx2d(c).drawImage(src, 0, 0);
    return c;
  }

  /** An undoable step made of two functions. */
  private mkOp(revert: () => void, reapply: () => void, bytes = 0): OpEntry {
    return {
      bytes,
      run: () => {
        revert();
        this.afterLayerChange();
        return this.mkOp(reapply, revert, bytes);
      }
    };
  }
  private push(e: Entry) {
    this.history.push(e);
    this.blank = false;
    this.afterLayerChange();
  }
  private afterLayerChange() {
    this.layoutDom();
    this.onChange();
    this.onHistory();
    this.onLayers();
  }

  /** Why painting is not possible right now, or null when it is. */
  paintBlockedReason(): 'locked' | 'hidden' | null {
    const l = this.active;
    if (l.locked) return 'locked';
    if (!l.visible) return 'hidden';
    return null;
  }

  get layerCount() {
    return this.layers.length;
  }
  getLayer(id: string): EngineLayer | undefined {
    return this.layers.find((l) => l.id === id);
  }
  layerMetas(): LayerMeta[] {
    return this.layers.map(({ id, name, visible, locked, opacity, blend }) => ({ id, name, visible, locked, opacity, blend }));
  }

  /** Puts the canvases in the page: background, the layers (bottom to top), the line art, the effects. */
  attach(host: HTMLElement) {
    this.host = host;
    for (const c of [this.bg, this.lines, this.fx]) c.className = 'layer';
    this.layoutDom();
  }

  private layoutDom() {
    const host = this.host;
    if (!host) return;
    host.appendChild(this.bg);
    for (const l of this.layers) {
      l.canvas.className = 'layer';
      l.canvas.style.opacity = String(l.opacity);
      l.canvas.style.mixBlendMode = blendOf(l.blend).css;
      l.canvas.style.display = l.visible ? '' : 'none';
      host.appendChild(l.canvas);
    }
    host.appendChild(this.lines);
    host.appendChild(this.fx);
  }

  selectLayer(id: string): boolean {
    if (!this.getLayer(id) || this.drawing) return false;
    this.activeId = id;
    this.layoutDom();
    this.onLayers();
    return true;
  }

  /** Adds an empty layer above the one being painted on. Returns its id, or null (too many layers, or not a Free Draw). */
  addLayer(id?: string, name?: string): string | null {
    if (!this.allowLayers || this.layers.length >= MAX_LAYERS || this.drawing) return null;
    const newId = id && !this.getLayer(id) ? id : nextLayerId(this.layers.map((l) => l.id));
    const layer = this.makeLayer({ id: newId, name: cleanName(name, defaultLayerName(this.layers.map((l) => l.name))), visible: true, locked: false, opacity: 1, blend: 'normal' });
    const index = this.layers.indexOf(this.active) + 1;
    const before = this.activeId;
    const apply = () => {
      this.layers.splice(Math.min(index, this.layers.length), 0, layer);
      this.activeId = layer.id;
    };
    const revert = () => {
      this.layers = this.layers.filter((l) => l !== layer);
      this.activeId = this.getLayer(before) ? before : this.layers[this.layers.length - 1].id;
    };
    apply();
    layer.dirty = true;
    this.push(this.mkOp(revert, apply));
    return layer.id;
  }

  duplicateLayer(id: string, newId?: string, name?: string): string | null {
    const src = this.getLayer(id);
    if (!src || !this.allowLayers || this.layers.length >= MAX_LAYERS || this.drawing) return null;
    const copyId = newId && !this.getLayer(newId) ? newId : nextLayerId(this.layers.map((l) => l.id));
    const layer = this.makeLayer({ ...this.layerMetas().find((m) => m.id === id)!, id: copyId, name: cleanName(name, cleanName(`${src.name} copy`, 'Layer copy')), locked: false });
    layer.ctx.drawImage(src.canvas, 0, 0);
    const index = this.layers.indexOf(src) + 1;
    const before = this.activeId;
    const apply = () => {
      this.layers.splice(Math.min(index, this.layers.length), 0, layer);
      this.activeId = layer.id;
    };
    const revert = () => {
      this.layers = this.layers.filter((l) => l !== layer);
      this.activeId = this.getLayer(before) ? before : this.layers[this.layers.length - 1].id;
    };
    apply();
    layer.dirty = true;
    this.push(this.mkOp(revert, apply, this.width * this.height * 4));
    return layer.id;
  }

  /** Removes a layer (the last one cannot be removed). The step can be undone, and the painting comes back with it. */
  deleteLayer(id: string): boolean {
    const layer = this.getLayer(id);
    if (!layer || this.layers.length <= 1 || this.drawing) return false;
    const index = this.layers.indexOf(layer);
    const before = this.activeId;
    const apply = () => {
      this.layers = this.layers.filter((l) => l !== layer);
      if (this.activeId === layer.id) this.activeId = this.layers[Math.min(index, this.layers.length - 1)].id;
    };
    const revert = () => {
      this.layers.splice(index, 0, layer);
      this.activeId = before;
      layer.dirty = true;
    };
    apply();
    this.push(this.mkOp(revert, apply, this.width * this.height * 4));
    return true;
  }

  /** Moves a layer one place up (by 1) or down (by -1) in the stack. */
  moveLayer(id: string, by: -1 | 1): boolean {
    const i = this.layers.findIndex((l) => l.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= this.layers.length || this.drawing) return false;
    const swapPlaces = () => {
      const a = this.layers[i];
      this.layers[i] = this.layers[j];
      this.layers[j] = a;
    };
    swapPlaces();
    this.push(this.mkOp(swapPlaces, swapPlaces));
    return true;
  }

  /** Changes a layer's name, visibility, lock, opacity or blend mode. `record: false` is for dragging a slider; call recordLayerChange when it ends. */
  setLayerProps(id: string, p: Partial<Pick<LayerMeta, 'name' | 'visible' | 'locked' | 'opacity' | 'blend'>>, record = true): boolean {
    const l = this.getLayer(id);
    if (!l || this.drawing) return false;
    const before: Partial<LayerMeta> = {};
    const after: Partial<LayerMeta> = {};
    if (p.name !== undefined && cleanName(p.name, l.name) !== l.name) (before.name = l.name), (after.name = cleanName(p.name, l.name));
    if (p.visible !== undefined && p.visible !== l.visible) (before.visible = l.visible), (after.visible = p.visible);
    if (p.locked !== undefined && p.locked !== l.locked) (before.locked = l.locked), (after.locked = p.locked);
    if (p.opacity !== undefined && cleanOpacity(p.opacity, l.opacity) !== l.opacity) (before.opacity = l.opacity), (after.opacity = cleanOpacity(p.opacity, l.opacity));
    if (p.blend !== undefined && p.blend !== l.blend) (before.blend = l.blend), (after.blend = p.blend as BlendId);
    if (!Object.keys(after).length) return false;
    const put = (v: Partial<LayerMeta>) => Object.assign(l, v);
    put(after);
    if (record) this.push(this.mkOp(() => put(before), () => put(after)));
    else {
      this.layoutDom();
      this.onChange();
      this.onLayers();
    }
    return true;
  }

  /** Records, as one undo step, a change that was made with `record: false` (a slider that was dragged). */
  recordLayerChange(id: string, before: Partial<LayerMeta>) {
    const l = this.getLayer(id);
    if (!l) return;
    const after: Partial<LayerMeta> = {};
    for (const k of Object.keys(before) as (keyof LayerMeta)[]) (after as Record<string, unknown>)[k] = l[k];
    const put = (v: Partial<LayerMeta>) => Object.assign(l, v);
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    this.push(this.mkOp(() => put(before), () => put(after)));
  }

  /** Paints a layer onto the one beneath it (with its opacity and blend mode) and removes it. */
  mergeDown(id: string): boolean {
    const i = this.layers.findIndex((l) => l.id === id);
    if (i <= 0 || this.drawing) return false;
    const top = this.layers[i];
    const below = this.layers[i - 1];
    if (top.locked || below.locked) return false;
    const belowBefore = this.cloneCanvas(below.canvas);
    const before = this.activeId;
    const apply = () => {
      below.ctx.save();
      below.ctx.globalAlpha = top.visible ? top.opacity : 0;
      below.ctx.globalCompositeOperation = blendOf(top.blend).op as GlobalCompositeOperation;
      below.ctx.drawImage(top.canvas, 0, 0);
      below.ctx.restore();
      this.layers = this.layers.filter((l) => l !== top);
      this.activeId = below.id;
      below.dirty = true;
    };
    const revert = () => {
      below.ctx.clearRect(0, 0, this.width, this.height);
      below.ctx.drawImage(belowBefore, 0, 0);
      this.layers.splice(i, 0, top);
      this.activeId = before;
      below.dirty = true;
      top.dirty = true;
    };
    apply();
    this.push(this.mkOp(revert, apply, this.width * this.height * 8));
    return true;
  }

  /** The one entry point for layer actions, used by the panel and by timelapse replay. */
  layerCommand(c: LayerCommand): boolean {
    switch (c.c) {
      case 'add':
        return this.addLayer(c.id, c.name) !== null;
      case 'dup':
        return this.duplicateLayer(c.from, c.id, c.name) !== null;
      case 'del':
        return this.deleteLayer(c.id);
      case 'sel':
        return this.selectLayer(c.id);
      case 'mv':
        return this.moveLayer(c.id, c.by);
      case 'merge':
        return this.mergeDown(c.id);
      case 'set':
        return this.setLayerProps(c.id, c.p);
    }
  }

  /** Replaces the layers with saved ones (when a painting is opened). */
  async loadLayers(metas: LayerMeta[], pngs: Record<string, Uint8Array | null>, active: string) {
    const made: EngineLayer[] = [];
    for (const m of metas.slice(0, MAX_LAYERS)) {
      const layer = this.makeLayer(m);
      const bytes = pngs[m.id];
      if (bytes && bytes.byteLength) {
        const bmp = await pngToBitmap(bytes);
        layer.ctx.drawImage(bmp, 0, 0, this.width, this.height);
        bmp.close();
      }
      made.push(layer);
    }
    if (!made.length) return;
    this.layers = made;
    this.activeId = made.some((l) => l.id === active) ? active : made[made.length - 1].id;
    this.history.clear();
    this.blank = false;
    this.layoutDom();
    this.onHistory();
    this.onLayers();
  }

  /** The pictures of layers changed since the last save, by id (null = empty). */
  async dirtyLayerPngs(): Promise<Record<string, Uint8Array | null>> {
    const out: Record<string, Uint8Array | null> = {};
    for (const l of this.layers) {
      if (!l.dirty) continue;
      // cleared first: anything painted while this is being written marks the layer changed again
      l.dirty = false;
      out[l.id] = await canvasToPng(l.canvas);
    }
    return out;
  }
  /** When a save failed: the layers that were taken for saving still need saving. */
  markLayersDirty(ids: string[]) {
    for (const l of this.layers) if (ids.includes(l.id)) l.dirty = true;
  }
  /** True when a layer has any paint at all, for the panel. */
  layerThumb(id: string, into: HTMLCanvasElement) {
    const l = this.getLayer(id);
    const c = into.getContext('2d');
    if (!l || !c) return;
    c.clearRect(0, 0, into.width, into.height);
    c.drawImage(l.canvas, 0, 0, into.width, into.height);
  }

  dispose() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.anims = [];
    this.history.clear();
    // Release the canvas backing stores right away instead of waiting for garbage collection.
    for (const c of [this.bg, ...this.layers.map((l) => l.canvas), this.lines, this.fx, this.stroke, this.snap, this.tmp]) {
      c.width = 0;
      c.height = 0;
    }
  }
}
