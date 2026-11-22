/**
 * Splash Wall: throw cartoon water balloons at an illustrated wall.
 * Paint spreads inside the region you hit (so each wall colours in neatly),
 * with bubbles and sparkles on impact. Everything is drawn in a 1000 x 750 space.
 */
import type { SplashLevel } from '../../../core/manifests';
import { clamp, easeOutCubic, lerp, mix } from '../../../core/util';
import { randomSeed } from '../../../core/rng';
import { drawSplat, makeSplat, type SplatShape } from '../../../core/splat';
import { RegionMap, buildRegionSvg, extractRegions } from '../../painting/regionMap';
import { ctx2d, makeCanvas, rasterizeSvg, sizeSvg } from '../../painting/raster';
import { ParticleSystem } from '../particles';
import { WALL_H, WALL_W, WallState, evaluateGoal, type GoalStatus } from './wall';

const LINE = '#6e6a8e';
const PAPER = '#fffdf8';

interface Flight {
  t: number;
  dur: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  colorIdx: number;
  radius: number;
}
interface SplatAnim {
  t: number;
  dur: number;
  x: number;
  y: number;
  shape: SplatShape;
  color: string;
  colorIdx: number;
  region: number;
}
interface Squash {
  t: number;
  dur: number;
  x: number;
  y: number;
  color: string;
}

export interface SplashEvents {
  onThrow?: () => void;
  onImpact?: () => void;
  onProgress?: (g: GoalStatus) => void;
  onComplete?: () => void;
}

export class SplashGame {
  readonly paint = makeCanvas(WALL_W, WALL_H);
  private pctx = ctx2d(this.paint);
  private lines: HTMLCanvasElement | null = null;
  private hint: HTMLCanvasElement | null = null;
  private tmp = makeCanvas(WALL_W, WALL_H);
  private tctx = ctx2d(this.tmp, { willReadFrequently: true });
  map!: RegionMap;
  wall!: WallState;
  names: Record<string, string> = {};
  palette: string[] = [];
  particles = new ParticleSystem(180);
  goal: SplashLevel['goal'] = { type: 'free' };
  status: GoalStatus = { done: false, progress: 0, label: '', items: [] };
  completed = false;

  // input
  aim = { x: WALL_W / 2, y: WALL_H / 2, inside: false };
  charging = false;
  power = 0;
  colorIdx = 1;
  surprise = false;
  reducedMotion = false;

  private flights: Flight[] = [];
  private splats: SplatAnim[] = [];
  private squashes: Squash[] = [];
  private chargeT = 0;
  private time = 0;

  constructor(private events: SplashEvents = {}) {}

  get busy(): boolean {
    return this.flights.length > 0 || this.splats.length > 0 || this.squashes.length > 0 || this.particles.count > 0 || this.charging;
  }

  async load(svg: string, level: SplashLevel['goal'], colors: string[]) {
    const regions = extractRegions(svg);
    this.names = Object.fromEntries(regions.map((r) => [r.id, r.name]));
    const ids = regions.map((r) => r.id);
    const art = await rasterizeSvg(sizeSvg(svg, WALL_W, WALL_H), WALL_W, WALL_H, true);
    this.lines = art;
    const regionSvg = buildRegionSvg(svg, ids, WALL_W, WALL_H);
    const rc = await rasterizeSvg(regionSvg, WALL_W, WALL_H, false);
    const data = ctx2d(rc, { willReadFrequently: true }).getImageData(0, 0, WALL_W, WALL_H);
    this.map = RegionMap.fromRgba(data.data, WALL_W, WALL_H, ids);
    const pal = [...colors];
    if (level.type === 'color_match') for (const hex of Object.values(level.targets)) if (!pal.some((c) => c.toLowerCase() === hex.toLowerCase())) pal.push(hex);
    this.palette = pal.slice(0, 12);
    this.wall = new WallState(this.map, this.palette);
    this.goal = level;
    this.colorIdx = 1;
    this.buildHint(level);
    this.resetWall();
  }

  /** Dotted tint on regions that have a target colour (color-match levels). */
  private buildHint(goal: SplashLevel['goal']) {
    this.hint = null;
    if (goal.type !== 'color_match') return;
    const c = makeCanvas(WALL_W, WALL_H);
    const g = ctx2d(c);
    const img = g.createImageData(WALL_W, WALL_H);
    const rgb: Record<number, [number, number, number]> = {};
    for (const [id, hex] of Object.entries(goal.targets)) {
      const n = parseInt(hex.slice(1), 16);
      rgb[this.wall.regionIndex(id)] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const ids = this.map.ids;
    for (let y = 0; y < WALL_H; y++) {
      for (let x = 0; x < WALL_W; x++) {
        const col = rgb[ids[y * WALL_W + x]];
        if (!col) continue;
        const on = (x + y) % 22 < 3;
        const o = (y * WALL_W + x) * 4;
        img.data[o] = col[0];
        img.data[o + 1] = col[1];
        img.data[o + 2] = col[2];
        img.data[o + 3] = on ? 255 : 70;
      }
    }
    g.putImageData(img, 0, 0);
    this.hint = c;
  }

  resetWall() {
    this.pctx.clearRect(0, 0, WALL_W, WALL_H);
    this.wall.reset();
    this.flights = [];
    this.splats = [];
    this.squashes = [];
    this.particles.clear();
    this.completed = false;
    this.refreshStatus(false);
  }

  private refreshStatus(announce = true) {
    this.status = evaluateGoal(this.goal, this.wall, this.names);
    this.events.onProgress?.(this.status);
    if (announce && this.status.done && !this.completed) {
      this.completed = true;
      this.events.onComplete?.();
    }
  }

  // ------------------------------------------------------------ input

  startCharge() {
    this.charging = true;
    this.chargeT = 0;
    this.power = 0.15;
  }

  /** Releases the throw. A quick click throws a small balloon, holding makes a big one. */
  release() {
    if (!this.charging) return;
    this.charging = false;
    const p = clamp(this.power, 0.15, 1);
    this.throwAt(this.aim.x, this.aim.y, p);
    this.power = 0;
  }

  throwAt(x: number, y: number, power: number) {
    const idx = this.surprise ? 1 + Math.floor(Math.random() * this.palette.length) : this.colorIdx;
    const color = this.palette[idx - 1];
    const radius = lerp(58, 150, power);
    const dur = this.reducedMotion ? 0.001 : lerp(0.52, 0.34, power);
    this.flights.push({ t: 0, dur, x0: WALL_W / 2 + (Math.random() - 0.5) * 120, y0: WALL_H + 50, x1: x, y1: y, color, colorIdx: idx, radius });
    this.events.onThrow?.();
  }

  // ------------------------------------------------------------ update

  update(dt: number) {
    this.time += dt;
    if (this.charging) {
      this.chargeT += dt;
      this.power = clamp(0.15 + this.chargeT / 1.1, 0.15, 1);
    }
    for (const f of this.flights) f.t += dt;
    const landed = this.flights.filter((f) => f.t >= f.dur);
    this.flights = this.flights.filter((f) => f.t < f.dur);
    for (const f of landed) this.impact(f);
    for (const s of this.squashes) s.t += dt;
    this.squashes = this.squashes.filter((s) => s.t < s.dur);
    for (const s of this.splats) s.t += dt;
    const done = this.splats.filter((s) => s.t >= s.dur);
    this.splats = this.splats.filter((s) => s.t < s.dur);
    for (const s of done) this.commit(s);
    this.particles.update(dt);
  }

  private impact(f: Flight) {
    const region = this.map.idNearest(f.x1, f.y1, 10);
    this.events.onImpact?.();
    this.squashes.push({ t: 0, dur: this.reducedMotion ? 0.001 : 0.16, x: f.x1, y: f.y1, color: f.color });
    this.particles.burst(f.x1, f.y1, f.color, 12);
    const shape = makeSplat(f.radius, randomSeed());
    const anim: SplatAnim = { t: 0, dur: this.reducedMotion ? 0.001 : 0.34, x: f.x1, y: f.y1, shape, color: f.color, colorIdx: f.colorIdx, region };
    this.splats.push(anim);
  }

  /** Draws a splat clipped to its region onto `g` (screen or paint layer). Returns painted pixel info when committing. */
  private drawMasked(g: CanvasRenderingContext2D, s: SplatAnim, progress: number, commit: boolean) {
    if (!s.region) return;
    const ext = s.shape.extent;
    const bx = Math.max(0, Math.floor(s.x - ext));
    const by = Math.max(0, Math.floor(s.y - ext));
    const bw = Math.min(WALL_W, Math.ceil(s.x + ext)) - bx;
    const bh = Math.min(WALL_H, Math.ceil(s.y + ext)) - by;
    if (bw <= 0 || bh <= 0) return;
    const t = this.tctx;
    t.clearRect(0, 0, bw, bh);
    drawSplat(t, s.x - bx, s.y - by, s.shape, s.color, progress);
    const img = t.getImageData(0, 0, bw, bh);
    const d = img.data;
    const ids = this.map.ids;
    for (let j = 0; j < bh; j++) {
      const row = (by + j) * WALL_W + bx;
      for (let i = 0; i < bw; i++) {
        const o = (j * bw + i) * 4 + 3;
        if (ids[row + i] !== s.region) d[o] = 0;
        else if (commit && d[o] > 90) this.wall.paint(row + i, s.region, s.colorIdx);
      }
    }
    t.putImageData(img, 0, 0);
    g.drawImage(this.tmp, 0, 0, bw, bh, bx, by, bw, bh);
  }

  private commit(s: SplatAnim) {
    this.drawMasked(this.pctx, s, 1, true);
    this.refreshStatus(true);
  }

  // ------------------------------------------------------------ render

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = PAPER;
    g.fillRect(0, 0, WALL_W, WALL_H);
    if (this.hint) g.drawImage(this.hint, 0, 0);
    g.drawImage(this.paint, 0, 0);
    for (const s of this.splats) this.drawMasked(g, s, easeOutCubic(clamp(s.t / s.dur, 0, 1)), false);
    if (this.lines) {
      g.save();
      g.globalCompositeOperation = 'multiply';
      g.drawImage(this.lines, 0, 0);
      g.restore();
    }
    for (const q of this.squashes) this.drawSquash(g, q);
    for (const f of this.flights) this.drawFlight(g, f);
    this.particles.draw(g);
    this.drawAim(g);
  }

  private drawBalloon(g: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, rot: number, squash = 0) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(s * (1 + squash * 0.7), s * (1 - squash * 0.6));
    // string
    g.strokeStyle = LINE;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 44);
    g.quadraticCurveTo(10, 60, -4, 76);
    g.stroke();
    // body
    const grad = g.createRadialGradient(-12, -16, 4, 0, 0, 46);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, mix(color, '#ffffff', 0.45));
    grad.addColorStop(1, color);
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(0, 0, 34, 42, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 2.6;
    g.strokeStyle = LINE;
    g.stroke();
    // knot
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(-6, 48);
    g.lineTo(6, 48);
    g.lineTo(0, 40);
    g.closePath();
    g.fill();
    g.stroke();
    // shine + tiny face
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath();
    g.ellipse(-13, -18, 6, 10, -0.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = LINE;
    g.beginPath();
    g.arc(-8, 2, 3.2, 0, 7);
    g.arc(8, 2, 3.2, 0, 7);
    g.fill();
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-6, 11);
    g.quadraticCurveTo(0, 18, 6, 11);
    g.stroke();
    g.restore();
  }

  private drawFlight(g: CanvasRenderingContext2D, f: Flight) {
    const k = clamp(f.t / f.dur, 0, 1);
    const e = k * k * (3 - 2 * k) * 0.35 + k * 0.65;
    const x = lerp(f.x0, f.x1, e);
    const y = lerp(f.y0, f.y1, e) - Math.sin(k * Math.PI) * 130;
    const s = lerp(1.15, 0.5, k);
    this.drawBalloon(g, x, y, s, f.color, Math.sin(k * 9) * 0.25);
  }

  private drawSquash(g: CanvasRenderingContext2D, q: Squash) {
    const k = clamp(q.t / q.dur, 0, 1);
    g.save();
    g.globalAlpha = 1 - k;
    this.drawBalloon(g, q.x, q.y, 0.55 + k * 0.5, q.color, 0, 0.5 + k);
    g.restore();
  }

  private drawAim(g: CanvasRenderingContext2D) {
    if (!this.aim.inside && !this.charging) return;
    const { x, y } = this.aim;
    const color = this.surprise ? '#c9bdf2' : (this.palette[this.colorIdx - 1] ?? '#c9bdf2');
    const r = lerp(58, 150, this.charging ? this.power : 0.15) * 0.62;
    g.save();
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    g.arc(x, y, 16, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = LINE;
    g.lineWidth = 2;
    g.setLineDash([6, 8]);
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = color;
    g.globalAlpha = 0.9;
    g.beginPath();
    g.arc(x, y, 8, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = LINE;
    g.lineWidth = 2;
    g.stroke();
    if (this.charging) {
      g.globalAlpha = 1;
      g.lineWidth = 7;
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.beginPath();
      g.arc(x, y, 28, -Math.PI / 2, Math.PI * 1.5);
      g.stroke();
      g.strokeStyle = color;
      g.beginPath();
      g.arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + (this.power - 0.15) / 0.85 * Math.PI * 2);
      g.stroke();
    }
    g.restore();
    // balloon waiting at the bottom
    this.drawBalloon(g, WALL_W / 2, WALL_H - 46 + Math.sin(this.time * 2) * 4, 0.9, color, 0);
  }

  async exportPng(): Promise<HTMLCanvasElement> {
    const out = makeCanvas(WALL_W, WALL_H);
    const g = ctx2d(out);
    g.fillStyle = PAPER;
    g.fillRect(0, 0, WALL_W, WALL_H);
    g.drawImage(this.paint, 0, 0);
    if (this.lines) {
      g.globalCompositeOperation = 'multiply';
      g.drawImage(this.lines, 0, 0);
    }
    return out;
  }
}
