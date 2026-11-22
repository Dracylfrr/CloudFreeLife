/**
 * Cute randomised paint splatters, shared by the Paintball tool and the
 * Splash Wall mini-game. Rounded blobs, soft drips and little droplets,
 * with a lighter highlight so it reads as playful paint rather than mess.
 */
import { createRng, rrange, type Rng } from './rng';
import { mix } from './util';

export interface SplatBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SplatOptions {
  /** 0..1 how much of the splat is drawn (animates the spread). */
  progress?: number;
  seed?: number;
}

export interface SplatShape {
  blob: { x: number; y: number }[];
  arms: { a: number; len: number; width: number }[];
  drops: { x: number; y: number; r: number }[];
  shines: { x: number; y: number; r: number }[];
  extent: number;
}

/** Deterministic geometry for a splat of a given radius. */
export function makeSplat(radius: number, seed: number): SplatShape {
  const rng: Rng = createRng(seed);
  const n = 18;
  const blob: { x: number; y: number }[] = [];
  const base = rrange(rng, 0.8, 0.95);
  let prev = base;
  for (let i = 0; i < n; i++) {
    // smooth radial noise keeps the outline soft and round
    prev = prev * 0.45 + rrange(rng, 0.72, 1.12) * 0.55;
    const a = (i / n) * Math.PI * 2;
    blob.push({ x: Math.cos(a) * radius * prev, y: Math.sin(a) * radius * prev });
  }
  const arms: SplatShape['arms'] = [];
  const armCount = 4 + Math.floor(rng() * 3);
  let ang = rng() * Math.PI * 2;
  for (let i = 0; i < armCount; i++) {
    ang += (Math.PI * 2) / armCount + rrange(rng, -0.55, 0.55);
    arms.push({ a: ang, len: radius * rrange(rng, 0.85, 1.3), width: radius * rrange(rng, 0.22, 0.4) });
  }
  const drops: SplatShape['drops'] = [];
  const dropCount = 6 + Math.floor(rng() * 5);
  for (let i = 0; i < dropCount; i++) {
    const a = rng() * Math.PI * 2;
    const d = radius * rrange(rng, 1.15, 2.05);
    drops.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: radius * rrange(rng, 0.05, 0.13) * (1.5 - d / (radius * 2)) });
  }
  const shines: SplatShape['shines'] = [];
  for (let i = 0; i < 3; i++) {
    const a = rrange(rng, -Math.PI * 0.95, -Math.PI * 0.35);
    const d = radius * rrange(rng, 0.2, 0.55);
    shines.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: radius * rrange(rng, 0.06, 0.15) });
  }
  return { blob, arms, drops, shines, extent: radius * 2.35 };
}

function blobPath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], scale: number) {
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % n];
    const mx = ((p0.x + p1.x) / 2) * scale;
    const my = ((p0.y + p1.y) / 2) * scale;
    if (i === 0) {
      const l = pts[n - 1];
      ctx.moveTo(((l.x + p0.x) / 2) * scale, ((l.y + p0.y) / 2) * scale);
    }
    ctx.quadraticCurveTo(p0.x * scale, p0.y * scale, mx, my);
  }
  ctx.closePath();
}

/** Draws the splat centred at (x, y). */
export function drawSplat(ctx: CanvasRenderingContext2D, x: number, y: number, shape: SplatShape, color: string, progress = 1) {
  const p = Math.max(0, Math.min(1, progress));
  const ease = 1 - Math.pow(1 - p, 3);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  // main blob
  blobPath(ctx, shape.blob, 0.35 + 0.65 * ease);
  ctx.fill();
  // arms: soft tapered drips (wide at the base, rounded at the tip)
  for (const arm of shape.arms) {
    const len = arm.len * ease;
    const r0 = arm.width * 0.62 * (0.6 + 0.4 * ease);
    const r1 = arm.width * 0.34 * (0.6 + 0.4 * ease);
    const cos = Math.cos(arm.a);
    const sin = Math.sin(arm.a);
    const bx = cos * len * 0.35;
    const by = sin * len * 0.35;
    const tx = cos * len;
    const ty = sin * len;
    ctx.beginPath();
    ctx.moveTo(bx - sin * r0, by + cos * r0);
    ctx.lineTo(tx - sin * r1, ty + cos * r1);
    ctx.lineTo(tx + sin * r1, ty - cos * r1);
    ctx.lineTo(bx + sin * r0, by - cos * r0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tx, ty, r1, 0, Math.PI * 2);
    ctx.fill();
  }
  // droplets fly out slightly later
  const dp = Math.max(0, (ease - 0.25) / 0.75);
  for (const d of shape.drops) {
    ctx.beginPath();
    ctx.arc(d.x * dp, d.y * dp, Math.max(0.5, d.r * dp), 0, Math.PI * 2);
    ctx.fill();
  }
  // soft highlights
  ctx.fillStyle = mix(color, '#ffffff', 0.62);
  ctx.globalAlpha = 0.55 * ease;
  for (const s of shape.shines) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const PAINTBALL_SIZES = { small: 30, medium: 54, large: 88 } as const;
export type PaintballSize = keyof typeof PAINTBALL_SIZES;
