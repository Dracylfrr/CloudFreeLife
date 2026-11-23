/**
 * Soft painted backdrops for the relaxing games. Each backdrop is drawn once into a small
 * off-screen canvas and then simply copied every frame, so scenery costs almost nothing.
 */
import type { Scenery } from '../../core/manifests14';

const cache = new Map<string, HTMLCanvasElement>();

function cloudShape(c: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number) {
  c.fillStyle = `rgba(255,255,255,${alpha})`;
  c.beginPath();
  c.arc(x, y, 26 * s, 0, 7);
  c.arc(x + 32 * s, y - 14 * s, 34 * s, 0, 7);
  c.arc(x + 68 * s, y, 26 * s, 0, 7);
  c.rect(x - 4 * s, y - 2 * s, 76 * s, 26 * s);
  c.fill();
}

function hill(c: CanvasRenderingContext2D, w: number, h: number, base: number, amp: number, color: string, phase = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) c.lineTo(x, base + Math.sin(x / (w / 4.2) + phase) * amp);
  c.lineTo(w, h);
  c.closePath();
  c.fill();
}

function paint(c: CanvasRenderingContext2D, w: number, h: number, sky: [string, string], scenery: Scenery) {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, sky[0]);
  g.addColorStop(1, sky[1]);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const dots = (n: number, color: string, maxY: number) => {
    c.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const x = (i * 197 + 61) % w;
      const y = (i * 89 + 23) % maxY;
      c.beginPath();
      c.arc(x, y, 1.4 + (i % 3), 0, 7);
      c.fill();
    }
  };
  switch (scenery) {
    case 'morning':
      c.fillStyle = 'rgba(255,248,214,0.7)';
      c.beginPath();
      c.arc(w - 120, 90, 56, 0, 7);
      c.fill();
      cloudShape(c, 140, 100, 1, 0.8);
      cloudShape(c, w * 0.55, 160, 0.8, 0.7);
      cloudShape(c, w * 0.8, 260, 0.9, 0.6);
      hill(c, w, h, h - 70, 14, 'rgba(190,230,196,0.8)');
      break;
    case 'garden':
      cloudShape(c, 120, 90, 0.9, 0.7);
      hill(c, w, h, h - 150, 26, 'rgba(176,222,184,0.85)', 0.5);
      hill(c, w, h, h - 90, 20, 'rgba(160,214,172,0.95)', 2);
      for (let i = 0; i < 14; i++) {
        c.fillStyle = ['#ffd3e2', '#fff2bd', '#e6d8f8'][i % 3];
        c.beginPath();
        c.arc((i * 71 + 40) % w, h - 40 - ((i * 37) % 36), 7, 0, 7);
        c.fill();
      }
      break;
    case 'ocean':
      cloudShape(c, w * 0.7, 90, 0.9, 0.6);
      for (let k = 0; k < 4; k++) hill(c, w, h, h - 190 + k * 52, 12, `rgba(${120 + k * 14},${190 + k * 8},${225 - k * 6},0.55)`, k);
      break;
    case 'evening':
    case 'sunset':
      c.fillStyle = 'rgba(255,214,170,0.55)';
      c.beginPath();
      c.arc(w * 0.5, h - 150, 150, 0, 7);
      c.fill();
      cloudShape(c, 160, 130, 1, 0.45);
      cloudShape(c, w * 0.75, 190, 0.8, 0.4);
      hill(c, w, h, h - 100, 18, 'rgba(150,120,170,0.55)');
      break;
    case 'night':
      dots(40, 'rgba(255,248,214,0.85)', h * 0.7);
      c.fillStyle = 'rgba(255,244,196,0.9)';
      c.beginPath();
      c.arc(w - 130, 100, 40, 0, 7);
      c.fill();
      c.fillStyle = sky[0];
      c.beginPath();
      c.arc(w - 112, 90, 36, 0, 7);
      c.fill();
      hill(c, w, h, h - 90, 16, 'rgba(70,70,130,0.55)');
      break;
  }
}

/** Draws the backdrop (cached) onto the visible canvas. */
export function drawScenery(ctx: CanvasRenderingContext2D, w: number, h: number, sky: [string, string], scenery: Scenery) {
  const key = `${w}x${h}|${sky[0]}|${sky[1]}|${scenery}`;
  let buf = cache.get(key);
  if (!buf) {
    buf = document.createElement('canvas');
    buf.width = w;
    buf.height = h;
    paint(buf.getContext('2d')!, w, h, sky, scenery);
    if (cache.size > 24) cache.clear();
    cache.set(key, buf);
  }
  ctx.drawImage(buf, 0, 0, w, h);
}
