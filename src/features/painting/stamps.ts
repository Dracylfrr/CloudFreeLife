/**
 * Stamps (added in 1.6): small soft shapes you press onto the painting. They are drawn from simple
 * shapes in code, so they cost nothing to download and always match the color you picked.
 */
import { mix } from '../../core/util';

export const STAMPS = [
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
  { id: 'flower', label: 'Flower' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'leaf', label: 'Leaf' },
  { id: 'paw', label: 'Paw' },
  { id: 'moon', label: 'Moon' },
  { id: 'drop', label: 'Drop' }
] as const;

export type StampId = (typeof STAMPS)[number]['id'];
export const STAMP_IDS: string[] = STAMPS.map((s) => s.id);
export const isStamp = (v: unknown): v is StampId => typeof v === 'string' && STAMP_IDS.includes(v);

/** How far from the center a stamp of radius `r` can reach. */
export const stampExtent = (r: number) => r * 1.5 + 4;

/** Radius of a stamp for a brush size from the size slider. */
export const stampRadius = (size: number) => Math.max(8, size * 1.6);

export function drawStamp(ctx: CanvasRenderingContext2D, shape: StampId, x: number, y: number, r: number, rot: number, color: string) {
  const edge = mix(color, '#6e6a8e', 0.28);
  const light = mix(color, '#ffffff', 0.55);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.2, r * 0.07);
  ctx.fillStyle = color;
  ctx.strokeStyle = edge;
  const finish = () => {
    ctx.fill();
    ctx.stroke();
  };
  switch (shape) {
    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? r : r * 0.48;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      finish();
      break;
    }
    case 'heart':
      ctx.beginPath();
      ctx.moveTo(0, r * 0.8);
      ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.7, -r * 1.0, 0, -r * 0.35);
      ctx.bezierCurveTo(r * 0.7, -r * 1.0, r * 1.3, -r * 0.1, 0, r * 0.8);
      ctx.closePath();
      finish();
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.4, 0, Math.PI * 2);
        finish();
      }
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      finish();
      break;
    case 'cloud':
      ctx.beginPath();
      ctx.arc(-r * 0.5, r * 0.15, r * 0.42, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(-r * 0.1, -r * 0.2, r * 0.5, Math.PI * 1.05, Math.PI * 1.95);
      ctx.arc(r * 0.45, -r * 0.02, r * 0.4, Math.PI * 1.3, Math.PI * 0.5);
      ctx.closePath();
      finish();
      break;
    case 'leaf':
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 1.1, -r * 0.1, 0, r);
      ctx.quadraticCurveTo(-r * 1.1, -r * 0.1, 0, -r);
      ctx.closePath();
      finish();
      ctx.strokeStyle = light;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.8);
      ctx.lineTo(0, r * 0.9);
      ctx.stroke();
      break;
    case 'paw':
      ctx.beginPath();
      ctx.ellipse(0, r * 0.35, r * 0.52, r * 0.42, 0, 0, Math.PI * 2);
      finish();
      for (const [dx, dy] of [[-0.72, -0.05], [-0.26, -0.55], [0.26, -0.55], [0.72, -0.05]]) {
        ctx.beginPath();
        ctx.ellipse(dx * r, dy * r, r * 0.2, r * 0.26, 0, 0, Math.PI * 2);
        finish();
      }
      break;
    case 'moon':
      ctx.beginPath();
      // a crescent: the big circle with a smaller, shifted circle taken out of one side
      ctx.arc(0, 0, r, 0.991, -0.991, false);
      ctx.arc(r * 0.4, 0, r * 0.85, -1.4, 1.4, true);
      ctx.closePath();
      finish();
      break;
    case 'drop':
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.9, -r * 0.1, r * 0.9, r * 0.9, 0, r * 0.9);
      ctx.bezierCurveTo(-r * 0.9, r * 0.9, -r * 0.9, -r * 0.1, 0, -r);
      ctx.closePath();
      finish();
      break;
  }
  ctx.restore();
}
