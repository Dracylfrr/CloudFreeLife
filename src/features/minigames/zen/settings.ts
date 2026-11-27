/**
 * The place a Zen Garden sits in: a Japanese house, a tea garden, a cottage, the seaside, a moonlit
 * night. Each has a sand bed (where you rake) with a visible edge, and a surrounding that is drawn once
 * and reused, so the garden still uses almost no power. The colors follow the sand you chose, so every
 * setting looks different on every sand.
 */
import type { ZenLevel } from '../../../core/manifests14';
import { mix } from '../../../core/util';

const W = 900;
const H = 580;

export const ZEN_SETTINGS = ['plain', 'japanese', 'tea', 'cottage', 'seaside', 'moonlit'] as const;
export type ZenSetting = (typeof ZEN_SETTINGS)[number];
export const ZEN_SETTING_LABEL: Record<ZenSetting, string> = {
  plain: 'Open sand',
  japanese: 'Japanese house',
  tea: 'Tea garden',
  cottage: 'Cottage',
  seaside: 'Seaside',
  moonlit: 'Moonlit night'
};
export const isZenSetting = (v: unknown): v is ZenSetting => (ZEN_SETTINGS as readonly string[]).includes(v as string);

export interface Bed {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

/** Where the sand is: the part that can be raked. */
export function bedOf(s: ZenSetting): Bed {
  switch (s) {
    case 'japanese':
      return { x: 70, y: 168, w: 760, h: 372, r: 26 };
    case 'tea':
      return { x: 74, y: 120, w: 752, h: 420, r: 34 };
    case 'cottage':
      return { x: 96, y: 118, w: 708, h: 380, r: 30 };
    case 'seaside':
      return { x: 70, y: 150, w: 760, h: 380, r: 40 };
    case 'moonlit':
      return { x: 90, y: 130, w: 720, h: 400, r: 40 };
    default:
      return { x: 0, y: 0, w: W, h: H, r: 0 };
  }
}

export function clipToBed(g: CanvasRenderingContext2D, s: ZenSetting) {
  const b = bedOf(s);
  g.beginPath();
  if (b.r) g.roundRect(b.x, b.y, b.w, b.h, b.r);
  else g.rect(b.x, b.y, b.w, b.h);
  g.clip();
}

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 2;
    g.stroke();
  }
};
const dot = (g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) => {
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fillStyle = fill;
  g.fill();
};
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

const INK = 'rgba(110,106,142,0.55)';

function japanese(g: CanvasRenderingContext2D, tint: string) {
  const grass = mix('#a9d4a0', tint, 0.18);
  const wood = mix('#c79a6b', tint, 0.15);
  const woodDark = mix('#9a7049', tint, 0.15);
  g.fillStyle = grass;
  g.fillRect(0, 0, W, H);
  // the house: a curved tiled roof, white walls, paper screens
  g.fillStyle = mix('#7f86a8', tint, 0.1);
  g.beginPath();
  g.moveTo(0, 56);
  g.quadraticCurveTo(W / 2, -10, W, 56);
  g.lineTo(W, 78);
  g.quadraticCurveTo(W / 2, 10, 0, 78);
  g.closePath();
  g.fill();
  g.fillStyle = mix('#5f6688', tint, 0.1);
  g.fillRect(0, 0, W, 34);
  for (let x = 0; x < W; x += 30) {
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(x, 4, 3, 26);
  }
  g.fillStyle = '#fbf6ea';
  g.fillRect(0, 78, W, 40);
  for (let i = 0; i < 6; i++) {
    const x = 30 + i * 144;
    rr(g, x, 84, 120, 30, 3, '#fffdf6', woodDark);
    g.strokeStyle = 'rgba(154,112,73,0.7)';
    g.lineWidth = 1.5;
    for (let k = 1; k < 4; k++) {
      g.beginPath();
      g.moveTo(x + k * 30, 84);
      g.lineTo(x + k * 30, 114);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x, 99);
    g.lineTo(x + 120, 99);
    g.stroke();
  }
  // the wooden veranda
  g.fillStyle = wood;
  g.fillRect(0, 118, W, 34);
  g.fillStyle = woodDark;
  g.fillRect(0, 118, W, 4);
  for (let x = 40; x < W; x += 90) g.fillRect(x, 122, 2, 30);
  // a maple and a stone lantern in the grass
  const leaf = mix('#e8806f', tint, 0.1);
  dot(g, 36, 232, 34, leaf);
  dot(g, 56, 214, 26, mix(leaf, '#ffd0a8', 0.4));
  g.fillStyle = '#8b6a4a';
  g.fillRect(32, 250, 8, 50);
  rr(g, 842, 360, 28, 14, 4, '#c8c4d4', INK);
  rr(g, 848, 336, 16, 26, 3, '#d9d5e4', INK);
  rr(g, 842, 322, 28, 14, 7, '#bdb8cc', INK);
  dot(g, 856, 349, 4, '#ffe9a8');
}

function tea(g: CanvasRenderingContext2D, tint: string) {
  const moss = mix('#9ccb98', tint, 0.2);
  g.fillStyle = moss;
  g.fillRect(0, 0, W, H);
  // a bamboo fence along the back, with a little wooden gate
  const bam = mix('#8fc08a', tint, 0.1);
  for (let x = 6; x < W; x += 30) {
    rr(g, x, 8, 22, 100, 8, bam, INK);
    g.fillStyle = 'rgba(70,110,70,0.35)';
    g.fillRect(x, 40, 22, 3);
    g.fillRect(x, 74, 22, 3);
  }
  g.fillStyle = '#9a7049';
  g.fillRect(0, 54, W, 8);
  g.fillRect(0, 88, W, 8);
  rr(g, 390, 22, 120, 92, 10, '#c79a6b', '#9a7049');
  g.strokeStyle = '#9a7049';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(450, 22);
  g.lineTo(450, 114);
  g.stroke();
  // bamboo tufts and stepping stones in the corners
  const r = rng(11);
  for (let i = 0; i < 14; i++) dot(g, 20 + r() * 36, 150 + r() * 380, 6 + r() * 8, mix('#7fbb88', tint, 0.15));
  for (let i = 0; i < 14; i++) dot(g, 844 + r() * 40, 150 + r() * 380, 6 + r() * 8, mix('#7fbb88', tint, 0.15));
  for (let i = 0; i < 6; i++) rr(g, 380 + (i % 2) * 14, 548 + 0, 50, 28, 14, '#d2cee0', INK);
}

function cottage(g: CanvasRenderingContext2D, tint: string) {
  g.fillStyle = mix('#b4dba8', tint, 0.2);
  g.fillRect(0, 0, W, H);
  // a hedge with flowers along the back
  g.fillStyle = mix('#7cbb82', tint, 0.1);
  g.beginPath();
  g.roundRect(0, 0, W, 96, [0, 0, 40, 40]);
  g.fill();
  const r = rng(5);
  const bloom = ['#ffd3e2', '#fff2bd', '#e6d8f8', '#ffffff'];
  for (let i = 0; i < 46; i++) dot(g, r() * W, 8 + r() * 82, 5 + r() * 3, bloom[i % 4]);
  // a white picket fence
  for (let x = 14; x < W; x += 32) {
    g.beginPath();
    g.moveTo(x, 520);
    g.lineTo(x, 566);
    g.lineTo(x + 20, 566);
    g.lineTo(x + 20, 520);
    g.lineTo(x + 10, 508);
    g.closePath();
    g.fillStyle = '#fffdf8';
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    g.stroke();
  }
  rr(g, 0, 534, W, 8, 3, '#f1ece0', INK);
  // flower beds on the sides
  for (let i = 0; i < 22; i++) {
    dot(g, 14 + r() * 64, 120 + r() * 380, 5 + r() * 4, bloom[i % 4]);
    dot(g, 822 + r() * 64, 120 + r() * 380, 5 + r() * 4, bloom[(i + 1) % 4]);
  }
}

function seaside(g: CanvasRenderingContext2D, tint: string) {
  g.fillStyle = mix('#efe0c0', tint, 0.2);
  g.fillRect(0, 0, W, H);
  const sea = mix('#9ed2ea', tint, 0.12);
  g.fillStyle = sea;
  g.fillRect(0, 0, W, 98);
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = `rgba(255,255,255,${0.55 - k * 0.1})`;
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= W; x += 16) g.lineTo(x, 20 + k * 20 + Math.sin(x / 38 + k * 1.3) * 5);
    g.stroke();
  }
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.beginPath();
  for (let x = 0; x <= W; x += 14) g.lineTo(x, 100 + Math.sin(x / 22) * 6);
  g.lineTo(W, 116);
  g.lineTo(0, 116);
  g.fill();
  // shells and a few pebbles on the beach
  const r = rng(23);
  for (let i = 0; i < 16; i++) {
    const x = r() < 0.5 ? 12 + r() * 40 : 848 + r() * 40;
    const y = 130 + r() * 420;
    dot(g, x, y, 4 + r() * 5, ['#fff2f4', '#ffd9c9', '#e8e2f4'][i % 3]);
  }
  // a little driftwood
  g.save();
  g.translate(450, 556);
  g.rotate(-0.04);
  rr(g, -90, -8, 180, 16, 8, '#b99372', INK);
  g.restore();
}

function moonlit(g: CanvasRenderingContext2D, tint: string) {
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, mix('#2f3566', tint, 0.1));
  sky.addColorStop(1, mix('#4b4f86', tint, 0.1));
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const r = rng(3);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.5})`;
    g.fillRect(r() * W, r() * 118, 2, 2);
  }
  dot(g, 760, 70, 64, 'rgba(255,244,196,0.16)');
  dot(g, 760, 70, 30, '#fff4c8');
  dot(g, 772, 62, 26, mix('#2f3566', tint, 0.1));
  // paper lanterns that glow at the corners
  for (const [x, y] of [[36, 200], [864, 200], [36, 460], [864, 460]] as const) {
    dot(g, x, y, 34, 'rgba(255,214,140,0.16)');
    rr(g, x - 13, y - 17, 26, 34, 12, '#ffd48a', 'rgba(150,100,60,0.5)');
    g.fillStyle = 'rgba(150,100,60,0.5)';
    g.fillRect(x - 10, y - 20, 20, 4);
    g.fillRect(x - 10, y + 16, 20, 4);
  }
}

const PAINT: Partial<Record<ZenSetting, (g: CanvasRenderingContext2D, tint: string) => void>> = { japanese, tea, cottage, seaside, moonlit };

const EDGE: Record<ZenSetting, { line: string; stones: boolean }> = {
  plain: { line: 'transparent', stones: false },
  japanese: { line: '#8a8699', stones: true },
  tea: { line: '#a98e6c', stones: true },
  cottage: { line: '#c9b79a', stones: false },
  seaside: { line: '#d6c39b', stones: false },
  moonlit: { line: '#8a8fc2', stones: true }
};

/** The setting around the sand and the border of the sand bed. The sand itself is drawn by the caller, inside the bed. */
export function drawSetting(g: CanvasRenderingContext2D, setting: ZenSetting, level: ZenLevel) {
  const paint = PAINT[setting];
  if (!paint) return;
  paint(g, level.ground[0]);
}

/** The edge of the sand bed, drawn over the sand so that it has a clear border. */
export function drawBedEdge(g: CanvasRenderingContext2D, setting: ZenSetting) {
  if (setting === 'plain') return;
  const b = bedOf(setting);
  const e = EDGE[setting];
  g.save();
  g.lineWidth = 9;
  g.strokeStyle = e.line;
  g.beginPath();
  g.roundRect(b.x, b.y, b.w, b.h, b.r);
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(70,64,100,0.35)';
  g.beginPath();
  g.roundRect(b.x - 4.5, b.y - 4.5, b.w + 9, b.h + 9, b.r + 4);
  g.stroke();
  g.beginPath();
  g.roundRect(b.x + 4.5, b.y + 4.5, b.w - 9, b.h - 9, Math.max(0, b.r - 4));
  g.stroke();
  if (e.stones) {
    const r = rng(41);
    for (let i = 0; i < 38; i++) {
      const t = i / 38;
      const per = 2 * (b.w + b.h);
      let d = t * per;
      let x: number;
      let y: number;
      if (d < b.w) [x, y] = [b.x + d, b.y];
      else if ((d -= b.w) < b.h) [x, y] = [b.x + b.w, b.y + d];
      else if ((d -= b.h) < b.w) [x, y] = [b.x + b.w - d, b.y + b.h];
      else [x, y] = [b.x, b.y + b.h - (d - b.w)];
      g.beginPath();
      g.ellipse(x, y, 11 + r() * 5, 7 + r() * 3, r(), 0, 7);
      g.fillStyle = ['#cfcbdd', '#d9d3c4', '#c3ccd9'][i % 3];
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 1.6;
      g.stroke();
    }
  }
  g.restore();
}
