/**
 * Avatar frames: rings and little scenes drawn around the round portrait. They are my own designs,
 * in three groups: plain rings, soft themes that are free from the start, and "earned" themes that
 * unlock by finishing stories, finding adventure endings or completing game levels (the rules and
 * counters are in `unlocks.ts`). The portrait fills a circle of radius 59 in a 120 x 120 picture; a
 * frame lives in the margin around it, out to radius 74.
 */

export type FrameGroup = 'Plain rings' | 'Soft themes' | 'Earned';
export type UnlockKind = 'stories' | 'endings' | 'levels';

export interface FrameDef {
  id: string;
  label: string;
  group: FrameGroup;
  /** Earned frames only: what has to be done to unlock it. */
  unlock?: { kind: UnlockKind; need: number };
}

export const FRAMES: FrameDef[] = [
  { id: 'silver', label: 'Silver', group: 'Plain rings' },
  { id: 'gold', label: 'Gold', group: 'Plain rings' },
  { id: 'sky', label: 'Blue', group: 'Plain rings' },
  { id: 'rose', label: 'Rose', group: 'Plain rings' },
  { id: 'rainbow', label: 'Rainbow', group: 'Plain rings' },
  { id: 'twin', label: 'Twin ring', group: 'Plain rings' },
  { id: 'clouds', label: 'Clouds', group: 'Soft themes' },
  { id: 'sakura', label: 'Blossoms', group: 'Soft themes' },
  { id: 'flowers', label: 'Daisies', group: 'Soft themes' },
  // earned by finishing cozy stories
  { id: 'night', label: 'Night sky', group: 'Earned', unlock: { kind: 'stories', need: 1 } },
  { id: 'leaves', label: 'Autumn leaves', group: 'Earned', unlock: { kind: 'stories', need: 3 } },
  { id: 'snow', label: 'Snowfall', group: 'Earned', unlock: { kind: 'stories', need: 6 } },
  { id: 'fireflies', label: 'Fireflies', group: 'Earned', unlock: { kind: 'stories', need: 10 } },
  // earned by finding story adventure endings
  { id: 'butterflies', label: 'Butterflies', group: 'Earned', unlock: { kind: 'endings', need: 3 } },
  { id: 'aurora', label: 'Aurora', group: 'Earned', unlock: { kind: 'endings', need: 8 } },
  { id: 'lanterns', label: 'Lanterns', group: 'Earned', unlock: { kind: 'endings', need: 15 } },
  // earned by completing game levels
  { id: 'bubbles', label: 'Bubbles', group: 'Earned', unlock: { kind: 'levels', need: 5 } },
  { id: 'waves', label: 'Ocean waves', group: 'Earned', unlock: { kind: 'levels', need: 15 } },
  { id: 'galaxy', label: 'Galaxy', group: 'Earned', unlock: { kind: 'levels', need: 30 } },
  { id: 'confetti', label: 'Confetti', group: 'Earned', unlock: { kind: 'levels', need: 50 } }
];

export const FRAME_GROUPS: FrameGroup[] = ['Plain rings', 'Soft themes', 'Earned'];

/** Frames from earlier versions that were removed, and the frame they become. */
const RETIRED: Record<string, string> = { 'ornate-gold': 'gold', 'ornate-star': 'gold', 'ornate-leaf': 'gold' };

export const isFrame = (id: unknown): id is string => id === 'none' || (typeof id === 'string' && FRAMES.some((f) => f.id === id));
export const cleanFrame = (id: unknown): string => (typeof id === 'string' && RETIRED[id] ? RETIRED[id] : isFrame(id) ? (id as string) : 'none');

/** How far the picture grows on every side to make room for the frame. */
export const FRAME_MARGIN = 14;

const CX = 60;
const CY = 60;
const f2 = (n: number) => Math.round(n * 100) / 100;

const polar = (deg: number, r: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [f2(CX + Math.cos(a) * r), f2(CY + Math.sin(a) * r)];
};
const at = (deg: number, r: number, draw: (x: number, y: number, deg: number) => string): string => {
  const [x, y] = polar(deg, r);
  return draw(x, y, deg);
};
/** Evenly spaced angles, optionally nudged. */
const ring = (n: number, start = 0): number[] => Array.from({ length: n }, (_, i) => start + (360 / n) * i);

const grad = (id: string, stops: string[]): string =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;

/** A bevelled ring: a dark edge, the main band, then a thin highlight. */
function band(r: number, w: number, paint: string, edge: string, shine = 'rgba(255,255,255,0.6)'): string {
  return (
    `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${edge}" stroke-width="${w + 1.6}"/>` +
    `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${paint}" stroke-width="${w}"/>` +
    `<circle cx="${CX}" cy="${CY}" r="${r - w * 0.28}" fill="none" stroke="${shine}" stroke-width="${Math.max(0.8, w * 0.16)}"/>`
  );
}

/** A ring cut into colored arcs. */
function arcs(colors: string[], r: number, w: number): string {
  const C = 2 * Math.PI * r;
  const arc = C / colors.length;
  return colors
    .map((c, i) => `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="${arc.toFixed(2)} ${(C - arc).toFixed(2)}" stroke-dashoffset="${(-i * arc).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})"/>`)
    .join('');
}

function star(cx: number, cy: number, r: number, fill: string, stroke = 'none'): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (Math.PI / 5) * i;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `<path d="M${pts.join('L')}Z" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>`;
}

function blossom(x: number, y: number, r: number, petal = '#ffc4d6', mid = '#ff8fb0'): string {
  const ps = [0, 72, 144, 216, 288]
    .map((a) => {
      const rad = ((a - 90) * Math.PI) / 180;
      return `<circle cx="${(x + Math.cos(rad) * r * 0.62).toFixed(2)}" cy="${(y + Math.sin(rad) * r * 0.62).toFixed(2)}" r="${(r * 0.55).toFixed(2)}" fill="${petal}" stroke="#e58aa8" stroke-width="0.7"/>`;
    })
    .join('');
  return ps + `<circle cx="${x}" cy="${y}" r="${(r * 0.28).toFixed(2)}" fill="${mid}"/>`;
}

function daisy(x: number, y: number, r: number): string {
  const ps = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const px = (x + Math.cos(rad) * r * 0.6).toFixed(2);
      const py = (y + Math.sin(rad) * r * 0.6).toFixed(2);
      return `<ellipse cx="${px}" cy="${py}" rx="${(r * 0.38).toFixed(2)}" ry="${(r * 0.2).toFixed(2)}" transform="rotate(${a} ${px} ${py})" fill="#ffffff" stroke="#d4dccb" stroke-width="0.6"/>`;
    })
    .join('');
  return ps + `<circle cx="${x}" cy="${y}" r="${(r * 0.3).toFixed(2)}" fill="#ffd45e" stroke="#e0a93a" stroke-width="0.6"/>`;
}

function cloud(x: number, y: number, s: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 4a5 5 0 0 1 1-9.4a6.4 6.4 0 0 1 11.4-1a5 5 0 0 1 4.6 6a4.2 4.2 0 0 1-1 4.4Z" fill="#ffffff" stroke="#9fb7e0" stroke-width="1.1" stroke-linejoin="round"/></g>`;
}

function leaf(x: number, y: number, deg: number, c = '#8fcfa6', edge = '#4f9a73'): string {
  return `<g transform="translate(${x} ${y}) rotate(${deg})"><path d="M0 0C-4.2 -3 -4.4 -9 0 -13C4.4 -9 4.2 -3 0 0Z" fill="${c}" stroke="${edge}" stroke-width="0.9" stroke-linejoin="round"/><path d="M0 -1.5L0 -10.5" stroke="${edge}" stroke-width="0.7" opacity="0.7"/></g>`;
}

function snowflake(x: number, y: number, r: number): string {
  const arms = [0, 60, 120].map((a) => {
    const rad = (a * Math.PI) / 180;
    const dx = (Math.cos(rad) * r).toFixed(2);
    const dy = (Math.sin(rad) * r).toFixed(2);
    return `M${(x - Number(dx)).toFixed(2)} ${(y - Number(dy)).toFixed(2)}L${(x + Number(dx)).toFixed(2)} ${(y + Number(dy)).toFixed(2)}`;
  });
  return `<path d="${arms.join('')}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="${arms.join('')}" stroke="#8fb7e8" stroke-width="0.5" stroke-linecap="round" fill="none" opacity="0.7"/><circle cx="${x}" cy="${y}" r="${(r * 0.18).toFixed(2)}" fill="#ffffff"/>`;
}

function firefly(x: number, y: number, r: number): string {
  return `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="#fff7a0" opacity="0.28"/><circle cx="${x}" cy="${y}" r="${r * 1.5}" fill="#fff7a0" opacity="0.5"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fffbd0" stroke="#e0c84a" stroke-width="0.6"/>`;
}

function butterfly(x: number, y: number, s: number, deg: number, c1: string, c2: string): string {
  return `<g transform="translate(${x} ${y}) rotate(${deg}) scale(${s})"><path d="M0 0C-6 -9 -13 -6 -10 0C-13 6 -6 8 0 0Z" fill="${c1}" stroke="#7a5aa8" stroke-width="0.8" stroke-linejoin="round"/><path d="M0 0C6 -9 13 -6 10 0C13 6 6 8 0 0Z" fill="${c2}" stroke="#7a5aa8" stroke-width="0.8" stroke-linejoin="round"/><path d="M0 -4L0 5" stroke="#5b4a7a" stroke-width="1.2" stroke-linecap="round"/></g>`;
}

function lantern(x: number, y: number, s: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><circle r="9" fill="#ffd27a" opacity="0.28"/><path d="M-4.4 -4.6L4.4 -4.6L5.4 4L-5.4 4Z" fill="#ff9a62" stroke="#b5532e" stroke-width="0.9" stroke-linejoin="round"/><path d="M-3.4 -6.4h6.8v1.8h-6.8zM-3.4 4h6.8v1.6h-6.8z" fill="#b5532e"/><path d="M-1 -3.4L-1.4 3M1.4 -3.4L1.2 3" stroke="#ffd9a8" stroke-width="0.7" opacity="0.8"/></g>`;
}

function bubble(x: number, y: number, r: number): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(190,230,250,0.35)" stroke="#8fcbe8" stroke-width="0.9"/><path d="M${x - r * 0.5} ${y - r * 0.1}A${r * 0.55} ${r * 0.55} 0 0 1 ${x - r * 0.05} ${y - r * 0.55}" stroke="#ffffff" stroke-width="${Math.max(0.8, r * 0.2)}" stroke-linecap="round" fill="none" opacity="0.9"/>`;
}

function sparkle(x: number, y: number, r: number, fill = '#ffffff'): string {
  return `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" stroke="#c9b8f0" stroke-width="0.4"/>`;
}

/** The frame as an SVG fragment (in the 120 x 120 picture space) plus any definitions it needs. */
export function frameSvg(id: string, uid: string): { defs: string; body: string } {
  const g = (n: string) => `${n}-${uid}`;
  switch (id) {
    case 'silver':
      return { defs: grad(g('fr'), ['#f7f9fc', '#a9b2c3', '#eef1f7', '#8b95a9']), body: band(65, 9, `url(#${g('fr')})`, '#7d879b') };
    case 'gold':
      return { defs: grad(g('fr'), ['#fff6bd', '#e0b13f', '#fbe58b', '#b88721']), body: band(65, 9, `url(#${g('fr')})`, '#8a6414') };
    case 'sky':
      return { defs: grad(g('fr'), ['#e0f1ff', '#6aa6dc', '#cfe8fc', '#4a86c4']), body: band(65, 9, `url(#${g('fr')})`, '#3a6ea6') };
    case 'rose':
      return { defs: grad(g('fr'), ['#ffe6ee', '#e88fae', '#ffd5e1', '#cf6f92']), body: band(65, 9, `url(#${g('fr')})`, '#b45678') };
    case 'rainbow':
      return {
        defs: '',
        body: `<circle cx="${CX}" cy="${CY}" r="65" fill="none" stroke="#a79bc0" stroke-width="10.6"/>` + arcs(['#ff9aa8', '#ffc78a', '#fff1a0', '#a8e6b8', '#9ad3ff', '#c4a8f5'], 65, 9) + `<circle cx="${CX}" cy="${CY}" r="63" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.4"/>`
      };
    case 'twin':
      return {
        defs: grad(g('fr'), ['#e0f1ff', '#6aa6dc', '#cfe8fc', '#4a86c4']),
        body: band(68.4, 4.6, `url(#${g('fr')})`, '#3a6ea6') + `<circle cx="${CX}" cy="${CY}" r="61.4" fill="none" stroke="#ffffff" stroke-width="2.2" opacity="0.9"/><circle cx="${CX}" cy="${CY}" r="61.4" fill="none" stroke="#9fc4ea" stroke-width="0.8"/>`
      };
    case 'clouds': {
      const puffs = [at(-40, 66, (x, y) => cloud(x, y, 1.15)), at(40, 66, (x, y) => cloud(x, y, 1)), at(132, 66, (x, y) => cloud(x, y, 1.2)), at(-125, 66, (x, y) => cloud(x, y, 0.95))].join('');
      return { defs: grad(g('fr'), ['#e5f2ff', '#bcdcf7', '#e5f2ff']), body: band(65, 7.6, `url(#${g('fr')})`, '#8fb3da', 'rgba(255,255,255,0.7)') + puffs + at(90, 66, (x, y) => star(x, y, 3.2, '#fff1a6', '#d8b84c')) };
    }
    case 'sakura': {
      const flowers = [-70, -35, 12, 48, 100, 150, 205, 252].map((d, i) => at(d, 66, (x, y) => blossom(x, y, i % 3 === 0 ? 6.6 : 5.2))).join('');
      return { defs: grad(g('fr'), ['#ffe9f1', '#f9b8cf', '#ffe3ec']), body: band(65, 6.4, `url(#${g('fr')})`, '#e58aa8', 'rgba(255,255,255,0.7)') + flowers };
    }
    case 'flowers': {
      const lv = [-55, -20, 28, 80, 130, 175, 230, 285].map((d) => at(d, 65, (x, y, deg) => leaf(x, y, deg + 40))).join('');
      const fl = [-70, -30, 12, 60, 110, 160, 215, 265].map((d, i) => at(d, 66, (x, y) => daisy(x, y, i % 2 ? 4.6 : 6))).join('');
      return { defs: grad(g('fr'), ['#c9ecc9', '#8fcfa6', '#c9ecc9']), body: band(65, 6, `url(#${g('fr')})`, '#4f9a73', 'rgba(255,255,255,0.6)') + lv + fl };
    }
    case 'night': {
      const stars = [-70, -30, 20, 70, 120, 200, 250, 300].map((d, i) => at(d, 66, (x, y) => star(x, y, i % 2 ? 3 : 4.4, '#fff1a6', '#c9a73e'))).join('');
      return {
        defs: grad(g('fr'), ['#5b5aa8', '#2f2f6e', '#6a62b8', '#2b2b60']),
        body: band(65, 9, `url(#${g('fr')})`, '#1f1f4d', 'rgba(190,190,255,0.5)') + stars + at(0, 66, (x, y) => `<path d="M${x - 3.6} ${y - 5.2}A6.4 6.4 0 1 0 ${x + 4.8} ${y + 3.4}A5.2 5.2 0 1 1 ${x - 3.6} ${y - 5.2}Z" fill="#ffe9a8" stroke="#c9a73e" stroke-width="0.9" stroke-linejoin="round"/>`)
      };
    }
    case 'leaves': {
      const cols: [string, string][] = [['#f2a65a', '#b5642a'], ['#e0683f', '#9a3a1c'], ['#f6c75a', '#b58a1c'], ['#c9743a', '#8a4a1c']];
      const lv = ring(14, 6).map((d, i) => at(d, 66, (x, y, deg) => leaf(x, y, deg + (i % 2 ? 30 : -30), cols[i % 4][0], cols[i % 4][1]))).join('');
      return { defs: grad(g('fr'), ['#f6d9a6', '#d9954a', '#f6d9a6']), body: band(65, 6.4, `url(#${g('fr')})`, '#9a5a1c', 'rgba(255,255,255,0.5)') + lv };
    }
    case 'snow': {
      const flakes = ring(9, 10).map((d, i) => at(d, 66, (x, y) => snowflake(x, y, i % 2 ? 4 : 5.6))).join('');
      const dots = ring(9, 30).map((d) => at(d, 69, (x, y) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#ffffff"/>`)).join('');
      return { defs: grad(g('fr'), ['#dcecff', '#9cc3ee', '#eaf4ff', '#86b0e0']), body: band(65, 7.4, `url(#${g('fr')})`, '#5f8fc4', 'rgba(255,255,255,0.8)') + flakes + dots };
    }
    case 'fireflies': {
      const flies = [-80, -45, -10, 25, 62, 100, 140, 185, 225, 265].map((d, i) => at(d, 66 + (i % 2) * 2, (x, y) => firefly(x, y, i % 3 === 0 ? 2.6 : 1.9))).join('');
      return { defs: grad(g('fr'), ['#2b4a3a', '#173026', '#33573f', '#10261c']), body: band(65, 8.4, `url(#${g('fr')})`, '#0c1c14', 'rgba(170,230,170,0.35)') + flies };
    }
    case 'butterflies': {
      const cs: [string, string][] = [['#ffb3d1', '#ffd1e6'], ['#a8d4ff', '#cfe6ff'], ['#ffe08a', '#fff0b8'], ['#c9b3f5', '#e2d6fb']];
      const fl = ring(7, 18).map((d, i) => at(d, 66, (x, y, deg) => butterfly(x, y, i % 2 ? 0.6 : 0.78, deg + 90, cs[i % 4][0], cs[i % 4][1]))).join('');
      return { defs: grad(g('fr'), ['#e6f6e0', '#b6e0b0', '#e6f6e0']), body: band(65, 5.8, `url(#${g('fr')})`, '#6aa66a', 'rgba(255,255,255,0.7)') + fl };
    }
    case 'aurora': {
      const wisps = ring(12, 5).map((d, i) => at(d, 66, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="${i % 2 ? 3.2 : 5}" ry="1.6" transform="rotate(${d} ${x} ${y})" fill="${['#7ff0d0', '#a98cff', '#ff9ad0'][i % 3]}" opacity="0.7"/>`)).join('');
      const sp = [-60, 40, 150, 250].map((d) => at(d, 70.5, (x, y) => sparkle(x, y, 2.6))).join('');
      return { defs: '', body: `<circle cx="${CX}" cy="${CY}" r="65" fill="none" stroke="#28305c" stroke-width="10.6"/>` + arcs(['#5de0c0', '#7fc4ff', '#a98cff', '#ff9ad0', '#a98cff', '#7fc4ff'], 65, 8.6) + wisps + sp };
    }
    case 'lanterns': {
      const ls = [-70, -30, 12, 52, 100, 145, 190, 235, 275].map((d, i) => at(d, 66, (x, y) => lantern(x, y, i % 2 ? 0.8 : 1))).join('');
      return { defs: grad(g('fr'), ['#4a2f5c', '#2c1c40', '#5a3a6e', '#26173a']), body: band(65, 7.6, `url(#${g('fr')})`, '#1a0f2a', 'rgba(255,200,150,0.35)') + ls };
    }
    case 'bubbles': {
      const bs = [-75, -48, -20, 15, 48, 82, 118, 150, 190, 225, 262, 298].map((d, i) => at(d, 66 + (i % 3), (x, y) => bubble(x, y, [4.2, 5.6, 3.2][i % 3]))).join('');
      return { defs: grad(g('fr'), ['#e3f6ff', '#a6dcf5', '#eaf9ff']), body: band(65, 6, `url(#${g('fr')})`, '#6fb7da', 'rgba(255,255,255,0.8)') + bs };
    }
    case 'waves': {
      const crests = ring(16, 4).map((d) => at(d, 65, (x, y, deg) => `<path d="M-4 1.4Q-2 -2.4 0 0Q2 2.4 4 -1" transform="translate(${x} ${y}) rotate(${deg})" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round"/>`)).join('');
      const shells = [-60, 70, 200].map((d) => at(d, 67, (x, y) => `<path d="M${x - 3.6} ${y + 2.4}A3.8 3.8 0 0 1 ${x + 3.6} ${y + 2.4}Z" fill="#ffd9c4" stroke="#d99a7c" stroke-width="0.8"/><path d="M${x} ${y + 2.4}L${x} ${y - 0.8}M${x - 1.8} ${y + 2.4}L${x - 2.1} ${y - 0.2}M${x + 1.8} ${y + 2.4}L${x + 2.1} ${y - 0.2}" stroke="#d99a7c" stroke-width="0.5"/>`)).join('');
      return { defs: grad(g('fr'), ['#7fd1f2', '#3a8fd1', '#8fdcf6', '#2f7bbf']), body: band(65, 8.8, `url(#${g('fr')})`, '#245f98', 'rgba(255,255,255,0.45)') + crests + shells };
    }
    case 'galaxy': {
      const stars = ring(14, 8).map((d, i) => at(d, 66 + ((i * 7) % 4), (x, y) => (i % 3 === 0 ? sparkle(x, y, 3.2, '#fff4b0') : `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1 : 1.6}" fill="#ffffff" opacity="0.9"/>`))).join('');
      const planet = at(-50, 66, (x, y) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#ff9ad0" stroke="#7a3a8a" stroke-width="0.8"/><ellipse cx="${x}" cy="${y}" rx="8" ry="2.2" transform="rotate(-20 ${x} ${y})" fill="none" stroke="#ffe08a" stroke-width="1.1"/>`);
      return { defs: grad(g('fr'), ['#3a2a7a', '#1c1450', '#5a3a9a', '#150f3e']), body: band(65, 9.2, `url(#${g('fr')})`, '#0d0a2a', 'rgba(180,160,255,0.45)') + stars + planet };
    }
    case 'confetti': {
      const cols = ['#ff9aa8', '#ffc78a', '#fff1a0', '#a8e6b8', '#9ad3ff', '#c4a8f5'];
      const bits = ring(24, 3).map((d, i) => at(d, 65 + ((i * 5) % 6) - 2, (x, y) => `<rect x="${x - 2.2}" y="${y - 1}" width="4.4" height="2" rx="0.6" transform="rotate(${(i * 47) % 180} ${x} ${y})" fill="${cols[i % 6]}"/>`)).join('');
      return { defs: grad(g('fr'), ['#fff6fb', '#f3e3ff', '#fff6fb']), body: band(65, 8.4, `url(#${g('fr')})`, '#c9a8e8', 'rgba(255,255,255,0.9)') + bits + ring(8, 20).map((d) => at(d, 66, (x, y) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${cols[Math.floor(d) % 6]}" stroke="#ffffff" stroke-width="0.5"/>`)).join('') };
    }
    default:
      return { defs: '', body: '' };
  }
}
