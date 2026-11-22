import type { BackgroundDef } from '../../core/manifests';
import { createRng } from '../../core/rng';

/** CSS approximation (used for previews and thumbnails before rendering). */
export function backgroundCss(def: BackgroundDef): string {
  if (def.type === 'solid' || def.colors.length === 1) return def.colors[0];
  return `linear-gradient(180deg, ${def.colors.join(', ')})`;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function softCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 34 * s, 0, Math.PI * 2);
  ctx.arc(x + 44 * s, y - 18 * s, 46 * s, 0, Math.PI * 2);
  ctx.arc(x + 96 * s, y - 2 * s, 38 * s, 0, Math.PI * 2);
  ctx.roundRect(x - 34 * s, y - 6 * s, 170 * s, 40 * s, 20 * s);
  ctx.fill();
  ctx.restore();
}

/** Paints a background definition into a canvas context. Deterministic per background id. */
export function drawBackground(ctx: CanvasRenderingContext2D, def: BackgroundDef, w: number, h: number) {
  ctx.save();
  if (def.type === 'solid' || def.colors.length === 1) {
    ctx.fillStyle = def.colors[0];
    ctx.fillRect(0, 0, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    def.colors.forEach((c, i) => g.addColorStop(i / (def.colors.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  const rng = createRng(hashString(def.id));
  if (def.type === 'stars') {
    for (let i = 0; i < 150; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 0.8 + rng() * 2.2;
      ctx.globalAlpha = 0.35 + rng() * 0.6;
      ctx.fillStyle = rng() < 0.2 ? '#fff2bd' : '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 9; i++) {
      const x = rng() * w;
      const y = rng() * h;
      const r = 6 + rng() * 8;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#fff6cf';
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const rad = k % 2 === 0 ? r : r * 0.28;
        const a = (Math.PI / 4) * k - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
    }
  } else if (def.type === 'clouds') {
    for (let i = 0; i < 9; i++) {
      softCloud(ctx, rng() * w, 60 + rng() * (h - 160), 0.8 + rng() * 1.3, 0.55 + rng() * 0.3);
    }
  }
  ctx.restore();
}
