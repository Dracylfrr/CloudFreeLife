/**
 * Avatar frames: rings and little scenes drawn around the round portrait. They are my own designs,
 * in three groups: plain rings (silver, gold, blue, rose, rainbow, double), ornate fantasy frames
 * (gold with gems, stars and leaves) and soft themes (clouds, blossoms, night sky, flowers).
 * The portrait fills a circle of radius 59 in a 120 x 120 picture; a frame lives in the margin
 * around it, out to radius 74.
 */

export interface FrameDef {
  id: string;
  label: string;
  group: 'Plain rings' | 'Ornate' | 'Soft themes';
}

export const FRAMES: FrameDef[] = [
  { id: 'silver', label: 'Silver', group: 'Plain rings' },
  { id: 'gold', label: 'Gold', group: 'Plain rings' },
  { id: 'sky', label: 'Blue', group: 'Plain rings' },
  { id: 'rose', label: 'Rose', group: 'Plain rings' },
  { id: 'rainbow', label: 'Rainbow', group: 'Plain rings' },
  { id: 'twin', label: 'Twin ring', group: 'Plain rings' },
  { id: 'ornate-gold', label: 'Gilded', group: 'Ornate' },
  { id: 'ornate-star', label: 'Starlit', group: 'Ornate' },
  { id: 'ornate-leaf', label: 'Laurel', group: 'Ornate' },
  { id: 'clouds', label: 'Clouds', group: 'Soft themes' },
  { id: 'sakura', label: 'Blossoms', group: 'Soft themes' },
  { id: 'night', label: 'Night sky', group: 'Soft themes' },
  { id: 'flowers', label: 'Daisies', group: 'Soft themes' }
];

export const FRAME_GROUPS = ['Plain rings', 'Ornate', 'Soft themes'] as const;
export const isFrame = (id: unknown): id is string => id === 'none' || (typeof id === 'string' && FRAMES.some((f) => f.id === id));
export const cleanFrame = (id: unknown): string => (isFrame(id) ? (id as string) : 'none');

/** How far the picture grows on every side to make room for the frame. */
export const FRAME_MARGIN = 14;

const CX = 60;
const CY = 60;

const polar = (deg: number, r: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.round((CX + Math.cos(a) * r) * 100) / 100, Math.round((CY + Math.sin(a) * r) * 100) / 100];
};
const at = (deg: number, r: number, draw: (x: number, y: number, deg: number) => string): string => {
  const [x, y] = polar(deg, r);
  return draw(x, y, deg);
};

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

const gem = (x: number, y: number, r: number, c = '#6aa6dc') =>
  `<path d="M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z" fill="${c}" stroke="#7a5b12" stroke-width="1.1" stroke-linejoin="round"/><path d="M${x - r * 0.35} ${y - r * 0.3}L${x} ${y - r * 0.7}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity="0.8"/>`;

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
      return `<ellipse cx="${(x + Math.cos(rad) * r * 0.6).toFixed(2)}" cy="${(y + Math.sin(rad) * r * 0.6).toFixed(2)}" rx="${(r * 0.38).toFixed(2)}" ry="${(r * 0.2).toFixed(2)}" transform="rotate(${a} ${(x + Math.cos(rad) * r * 0.6).toFixed(2)} ${(y + Math.sin(rad) * r * 0.6).toFixed(2)})" fill="#ffffff" stroke="#d4dccb" stroke-width="0.6"/>`;
    })
    .join('');
  return ps + `<circle cx="${x}" cy="${y}" r="${(r * 0.3).toFixed(2)}" fill="#ffd45e" stroke="#e0a93a" stroke-width="0.6"/>`;
}

function cloud(x: number, y: number, s: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 4a5 5 0 0 1 1-9.4a6.4 6.4 0 0 1 11.4-1a5 5 0 0 1 4.6 6a4.2 4.2 0 0 1-1 4.4Z" fill="#ffffff" stroke="#9fb7e0" stroke-width="1.1" stroke-linejoin="round"/></g>`;
}

function leaf(x: number, y: number, deg: number, c = '#8fcfa6'): string {
  return `<g transform="translate(${x} ${y}) rotate(${deg})"><path d="M0 0C-4.2 -3 -4.4 -9 0 -13C4.4 -9 4.2 -3 0 0Z" fill="${c}" stroke="#4f9a73" stroke-width="0.9" stroke-linejoin="round"/><path d="M0 -1.5L0 -10.5" stroke="#4f9a73" stroke-width="0.7" opacity="0.7"/></g>`;
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
    case 'rainbow': {
      const colors = ['#ff9aa8', '#ffc78a', '#fff1a0', '#a8e6b8', '#9ad3ff', '#c4a8f5'];
      const C = 2 * Math.PI * 65;
      const arc = C / colors.length;
      const arcs = colors
        .map((c, i) => `<circle cx="${CX}" cy="${CY}" r="65" fill="none" stroke="${c}" stroke-width="9" stroke-dasharray="${arc.toFixed(2)} ${(C - arc).toFixed(2)}" stroke-dashoffset="${(-i * arc).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})"/>`)
        .join('');
      return {
        defs: '',
        body: `<circle cx="${CX}" cy="${CY}" r="65" fill="none" stroke="#a79bc0" stroke-width="10.6"/>` + arcs + `<circle cx="${CX}" cy="${CY}" r="63" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.4"/>`
      };
    }
    case 'twin':
      return {
        defs: grad(g('fr'), ['#e0f1ff', '#6aa6dc', '#cfe8fc', '#4a86c4']),
        body: band(68.4, 4.6, `url(#${g('fr')})`, '#3a6ea6') + `<circle cx="${CX}" cy="${CY}" r="61.4" fill="none" stroke="#ffffff" stroke-width="2.2" opacity="0.9"/><circle cx="${CX}" cy="${CY}" r="61.4" fill="none" stroke="#9fc4ea" stroke-width="0.8"/>`
      };
    case 'ornate-gold': {
      const diamonds = [0, 90, 180, 270].map((d) => at(d, 66, (x, y) => gem(x, y, 5.4, d % 180 === 0 ? '#6aa6dc' : '#e88fae'))).join('');
      const dots = [45, 135, 225, 315].map((d) => at(d, 66, (x, y) => `<circle cx="${x}" cy="${y}" r="2.1" fill="#fff6bd" stroke="#8a6414" stroke-width="0.9"/>`)).join('');
      return {
        defs: grad(g('fr'), ['#fff6bd', '#e0b13f', '#fbe58b', '#b88721']),
        body: band(65, 8, `url(#${g('fr')})`, '#8a6414') + `<circle cx="${CX}" cy="${CY}" r="60.4" fill="none" stroke="#8a6414" stroke-width="0.9" stroke-dasharray="1.2 2.4"/>` + dots + diamonds
      };
    }
    case 'ornate-star': {
      const side = [-62, 62].map((d) => at(d, 66, (x, y) => star(x, y, 4.6, '#fff1a6', '#8a6414'))).join('');
      return {
        defs: grad(g('fr'), ['#fff6bd', '#e0b13f', '#fbe58b', '#b88721']),
        body:
          band(65, 8, `url(#${g('fr')})`, '#8a6414') +
          side +
          at(0, 66, (x, y) => star(x, y - 0.4, 9.4, '#ffe37a', '#8a6414') + `<circle cx="${x}" cy="${y + 0.4}" r="2.4" fill="#6aa6dc" stroke="#7a5b12" stroke-width="0.9"/>`) +
          at(180, 66, (x, y) => `<path d="M${x - 4} ${y - 2.6}A4.8 4.8 0 1 0 ${x + 3.4} ${y + 3}A3.8 3.8 0 1 1 ${x - 4} ${y - 2.6}Z" fill="#fff1a6" stroke="#8a6414" stroke-width="0.9" stroke-linejoin="round"/>`)
      };
    }
    case 'ornate-leaf': {
      const leaves = [-50, -30, -10, 10, 30, 50].map((d) => at(d + 180, 66, (x, y, deg) => leaf(x, y, deg - 90 + 90 + 0, '#8fcfa6'))).join('');
      const top = [-50, -30, -10, 10, 30, 50].map((d) => at(d, 66, (x, y, deg) => leaf(x, y, deg + 0, '#8fcfa6'))).join('');
      return {
        defs: grad(g('fr'), ['#fff6bd', '#e0b13f', '#fbe58b', '#b88721']),
        body: band(65, 7, `url(#${g('fr')})`, '#8a6414') + top + leaves + at(0, 66, (x, y) => `<circle cx="${x}" cy="${y + 0.5}" r="3.2" fill="#e88fae" stroke="#8a6414" stroke-width="0.9"/>`)
      };
    }
    case 'clouds': {
      const puffs = [
        at(-40, 66, (x, y) => cloud(x, y, 1.15)),
        at(40, 66, (x, y) => cloud(x, y, 1)),
        at(132, 66, (x, y) => cloud(x, y, 1.2)),
        at(-125, 66, (x, y) => cloud(x, y, 0.95))
      ].join('');
      return {
        defs: grad(g('fr'), ['#e5f2ff', '#bcdcf7', '#e5f2ff']),
        body: band(65, 7.6, `url(#${g('fr')})`, '#8fb3da', 'rgba(255,255,255,0.7)') + puffs + at(90, 66, (x, y) => star(x, y, 3.2, '#fff1a6', '#d8b84c'))
      };
    }
    case 'sakura': {
      const flowers = [-70, -35, 12, 48, 100, 150, 205, 252].map((d, i) => at(d, 66, (x, y) => blossom(x, y, i % 3 === 0 ? 6.6 : 5.2))).join('');
      return {
        defs: grad(g('fr'), ['#ffe9f1', '#f9b8cf', '#ffe3ec']),
        body: band(65, 6.4, `url(#${g('fr')})`, '#e58aa8', 'rgba(255,255,255,0.7)') + flowers
      };
    }
    case 'night': {
      const stars = [-70, -30, 20, 70, 120, 200, 250, 300].map((d, i) => at(d, 66, (x, y) => star(x, y, i % 2 ? 3 : 4.4, '#fff1a6', '#c9a73e'))).join('');
      return {
        defs: grad(g('fr'), ['#5b5aa8', '#2f2f6e', '#6a62b8', '#2b2b60']),
        body: band(65, 9, `url(#${g('fr')})`, '#1f1f4d', 'rgba(190,190,255,0.5)') + stars + at(0, 66, (x, y) => `<path d="M${x - 3.6} ${y - 5.2}A6.4 6.4 0 1 0 ${x + 4.8} ${y + 3.4}A5.2 5.2 0 1 1 ${x - 3.6} ${y - 5.2}Z" fill="#ffe9a8" stroke="#c9a73e" stroke-width="0.9" stroke-linejoin="round"/>`)
      };
    }
    case 'flowers': {
      const lv = [-55, -20, 28, 80, 130, 175, 230, 285].map((d) => at(d, 65, (x, y, deg) => leaf(x, y, deg + 40))).join('');
      const fl = [-70, -30, 12, 60, 110, 160, 215, 265].map((d, i) => at(d, 66, (x, y) => daisy(x, y, i % 2 ? 4.6 : 6))).join('');
      return {
        defs: grad(g('fr'), ['#c9ecc9', '#8fcfa6', '#c9ecc9']),
        body: band(65, 6, `url(#${g('fr')})`, '#4f9a73', 'rgba(255,255,255,0.6)') + lv + fl
      };
    }
    default:
      return { defs: '', body: '' };
  }
}
