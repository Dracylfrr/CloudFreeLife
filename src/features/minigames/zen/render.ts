/**
 * Drawing for Zen Garden. Nothing here animates: the screen only redraws when you change
 * something, so the garden uses almost no power while you simply sit and look at it.
 */
import type { ZenLevel } from '../../../core/manifests14';
import { FIELD_H, FIELD_W, type Garden, type Stroke, type ZenObject } from './gardens';

const LINE = 'rgba(110,106,142,0.6)';

/** A faint grain, drawn once per background and reused. */
const grainCache = new Map<string, HTMLCanvasElement>();
function grain(level: ZenLevel): HTMLCanvasElement {
  const key = level.id + level.ground.join();
  let c = grainCache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = FIELD_W;
  c.height = FIELD_H;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, FIELD_H);
  grad.addColorStop(0, level.ground[0]);
  grad.addColorStop(1, level.ground[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, FIELD_W, FIELD_H);
  // deterministic speckles so the grain is the same every time
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(120,100,80,0.07)';
    g.fillRect(rnd() * FIELD_W, rnd() * FIELD_H, 2, 2);
  }
  if (grainCache.size > 12) grainCache.clear();
  grainCache.set(key, c);
  return c;
}

function frame(g: CanvasRenderingContext2D, level: ZenLevel) {
  switch (level.scenery) {
    case 'moon': {
      g.fillStyle = 'rgba(255,244,196,0.18)';
      g.beginPath();
      g.arc(FIELD_W - 120, 90, 90, 0, 7);
      g.fill();
      g.fillStyle = 'rgba(255,248,214,0.9)';
      g.beginPath();
      g.arc(FIELD_W - 120, 90, 28, 0, 7);
      g.fill();
      break;
    }
    case 'sea': {
      g.strokeStyle = 'rgba(255,255,255,0.4)';
      g.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        for (let x = 0; x <= FIELD_W; x += 20) g.lineTo(x, 26 + k * 18 + Math.sin(x / 40 + k) * 5);
        g.stroke();
      }
      break;
    }
    case 'garden':
      g.fillStyle = 'rgba(150,200,150,0.35)';
      g.fillRect(0, 0, FIELD_W, 14);
      g.fillRect(0, FIELD_H - 14, FIELD_W, 14);
      g.fillRect(0, 0, 14, FIELD_H);
      g.fillRect(FIELD_W - 14, 0, 14, FIELD_H);
      break;
    default:
      break;
  }
}

/** Draws one raked line as three soft parallel grooves. */
export function drawStroke(g: CanvasRenderingContext2D, s: Stroke, level: ZenLevel, from = 0) {
  const p = s.pts;
  if (p.length < 4) return;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (let i = Math.max(0, from); i + 3 < p.length; i += 2) {
    const x0 = p[i];
    const y0 = p[i + 1];
    const x1 = p[i + 2];
    const y1 = p[i + 3];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    for (const k of [-1, 0, 1]) {
      const o = k * 9;
      g.strokeStyle = level.groove;
      g.lineWidth = 3.4;
      g.beginPath();
      g.moveTo(x0 + nx * o, y0 + ny * o);
      g.lineTo(x1 + nx * o, y1 + ny * o);
      g.stroke();
      g.strokeStyle = level.light;
      g.globalAlpha = 0.75;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(x0 + nx * (o + 3), y0 + ny * (o + 3));
      g.lineTo(x1 + nx * (o + 3), y1 + ny * (o + 3));
      g.stroke();
      g.globalAlpha = 1;
    }
  }
}

const STONE = ['#c9c4dc', '#d4cdc0', '#bdc9d8', '#d8c6cf'];
const LEAF = ['#9fd3a8', '#b5deb0', '#86c79a', '#a8d8c0'];
const PETAL = ['#ffd3e2', '#fff2bd', '#e6d8f8', '#ffdcc8'];

export function drawObject(g: CanvasRenderingContext2D, o: ZenObject) {
  g.save();
  g.translate(o.x, o.y);
  g.scale(o.size, o.size);
  g.lineWidth = 2.6;
  g.strokeStyle = LINE;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // soft shadow
  g.fillStyle = 'rgba(90,70,110,0.16)';
  g.beginPath();
  g.ellipse(4, 14, 30, 10, 0, 0, 7);
  g.fill();
  g.rotate(o.rot * 0.15);
  const v = o.variant % 4;
  switch (o.kind) {
    case 'stone': {
      g.fillStyle = STONE[v];
      g.beginPath();
      g.moveTo(-26, 6);
      g.bezierCurveTo(-30, -14, -8, -26, 12, -22);
      g.bezierCurveTo(32, -18, 34, 4, 22, 14);
      g.bezierCurveTo(8, 20, -18, 20, -26, 6);
      g.closePath();
      g.fill();
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(-6, -6, 12, Math.PI * 1.05, Math.PI * 1.6);
      g.stroke();
      break;
    }
    case 'plant': {
      g.fillStyle = LEAF[v];
      const blades = 4 + v;
      for (let i = 0; i < blades; i++) {
        const a = -Math.PI / 2 + (i - (blades - 1) / 2) * 0.42;
        g.beginPath();
        g.moveTo(0, 10);
        g.quadraticCurveTo(Math.cos(a) * 14, Math.sin(a) * 18, Math.cos(a) * 30, Math.sin(a) * 34);
        g.quadraticCurveTo(Math.cos(a) * 9 + 8, Math.sin(a) * 18, 2, 10);
        g.fill();
        g.stroke();
      }
      break;
    }
    case 'flower': {
      g.strokeStyle = '#8ccaa0';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(0, 14);
      g.quadraticCurveTo(6, -4, 0, -22);
      g.stroke();
      g.strokeStyle = LINE;
      g.lineWidth = 2.4;
      g.fillStyle = PETAL[v];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.beginPath();
        g.ellipse(Math.cos(a) * 11, -26 + Math.sin(a) * 11, 8, 5, a, 0, 7);
        g.fill();
        g.stroke();
      }
      g.fillStyle = '#fff2bd';
      g.beginPath();
      g.arc(0, -26, 6, 0, 7);
      g.fill();
      g.stroke();
      break;
    }
    case 'bush': {
      g.fillStyle = LEAF[(v + 1) % 4];
      for (const [dx, dy, r] of [[-16, 0, 15], [0, -10, 19], [17, 0, 15]] as const) {
        g.beginPath();
        g.arc(dx, dy, r, 0, 7);
        g.fill();
        g.stroke();
      }
      g.fillStyle = PETAL[v];
      for (const [dx, dy] of [[-12, -4], [8, -14], [14, 4]] as const) {
        g.beginPath();
        g.arc(dx, dy, 3.4, 0, 7);
        g.fill();
      }
      break;
    }
  }
  g.restore();
}

/** Draws the whole garden. Pass `sand` to reuse an already-drawn layer of raked lines. */
export function drawGarden(g: CanvasRenderingContext2D, garden: Garden, level: ZenLevel, sand?: HTMLCanvasElement) {
  g.drawImage(grain(level), 0, 0);
  frame(g, level);
  if (sand) g.drawImage(sand, 0, 0, FIELD_W, FIELD_H);
  else for (const s of garden.strokes) drawStroke(g, s, level);
  for (const o of [...garden.objects].sort((a, b) => a.y - b.y)) drawObject(g, o);
}

/** Draws just the raked lines onto a transparent layer. */
export function drawSand(layer: HTMLCanvasElement, garden: Garden, level: ZenLevel) {
  const g = layer.getContext('2d')!;
  g.clearRect(0, 0, layer.width, layer.height);
  for (const s of garden.strokes) drawStroke(g, s, level);
}
