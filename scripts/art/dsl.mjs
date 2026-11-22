// Tiny vector-drawing DSL used to author the coloring pages and Splash Wall
// walls. Everything returns SVG path data in a 1000 x 750 coordinate space.
// The generator turns a Scene into lineart.svg, thumbnail.svg and regions.json.

export const LINE = '#6e6a8e';
const f = (n) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- shapes

export const circle = (cx, cy, r) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`;

export const ellipse = (cx, cy, rx, ry) =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0z`;

export function rect(x, y, w, h, r = 0) {
  r = Math.min(r, w / 2, h / 2);
  if (!r) return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}z`;
}

/** Rect with a half-circle top (doors, windows). */
export function arch(x, y, w, h) {
  const r = w / 2;
  return `M${f(x)} ${f(y + h)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h)}z`;
}

export const poly = (pts) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'z';

/** Polygon with softly rounded corners. */
export function rpoly(pts, r = 10) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const l1 = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const k = Math.min(r, l1 / 2.2, l2 / 2.2);
    const p1 = [p[0] + ((a[0] - p[0]) / l1) * k, p[1] + ((a[1] - p[1]) / l1) * k];
    const p2 = [p[0] + ((b[0] - p[0]) / l2) * k, p[1] + ((b[1] - p[1]) / l2) * k];
    d += `${i === 0 ? 'M' : 'L'}${f(p1[0])} ${f(p1[1])}Q${f(p[0])} ${f(p[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'z';
}

export function star(cx, cy, R, r = R * 0.5, n = 5, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rad = i % 2 === 0 ? R : r;
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return rpoly(pts, R * 0.16);
}

/** Smooth closed curve through points (Catmull-Rom). */
export function blob(pts, tension = 0.5) {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'z';
}

/** Smooth open curve through points. */
export function curve(pts, tension = 0.5) {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Ground/hill: smooth top edge through points, closed down to `bottom`. */
export function ground(pts, bottom = 750, x0 = -10, x1 = 1010) {
  const first = pts[0];
  const last = pts[pts.length - 1];
  return curve(pts) + `L${f(x1)} ${f(last[1])}V${f(bottom)}H${f(x0)}V${f(first[1])}L${f(first[0])} ${f(first[1])}z`;
}

/** Wavy band between two y positions (water, sky bands). */
export function band(y0, y1, amp = 0, waves = 4, x0 = -10, x1 = 1010) {
  if (!amp) return `M${x0} ${y0}H${x1}V${y1}H${x0}z`;
  const step = (x1 - x0) / (waves * 2);
  let top = `M${x0} ${f(y0)}`;
  for (let i = 0; i < waves * 2; i++) top += `Q${f(x0 + step * i + step / 2)} ${f(y0 + (i % 2 ? amp : -amp))} ${f(x0 + step * (i + 1))} ${f(y0)}`;
  return top + `V${y1}H${x0}z`;
}

/** Crescent moon. */
export function crescent(cx, cy, r, bite = 0.62) {
  const ir = r * 0.82;
  const ox = r * bite;
  // outer circle, minus an offset inner circle, as a single outline
  const y = Math.sqrt(Math.max(0, r * r - Math.pow((r * r - ir * ir + ox * ox) / (2 * ox), 2)));
  const x = (r * r - ir * ir + ox * ox) / (2 * ox);
  const p1 = [cx + x, cy - y];
  const p2 = [cx + x, cy + y];
  return `M${f(p1[0])} ${f(p1[1])}A${f(r)} ${f(r)} 0 1 0 ${f(p2[0])} ${f(p2[1])}A${f(ir)} ${f(ir)} 0 1 1 ${f(p1[0])} ${f(p1[1])}z`;
}

/** Flat-bottomed cloud made of circles resting on a base line. */
export function cloud(cx, cy, w, shape = 0) {
  const sets = [
    { xs: [-0.36, -0.18, 0.05, 0.25, 0.39], rs: [0.1, 0.17, 0.22, 0.16, 0.1] },
    { xs: [-0.33, -0.1, 0.16, 0.35], rs: [0.13, 0.2, 0.18, 0.11] },
    { xs: [-0.34, -0.12, 0.1, 0.3], rs: [0.12, 0.19, 0.24, 0.13] },
    { xs: [-0.42, -0.3, -0.17, -0.05, 0.09, 0.22, 0.34, 0.44], rs: [0.05, 0.08, 0.1, 0.12, 0.1, 0.09, 0.08, 0.05] }
  ];
  const s = sets[shape % sets.length];
  const base = cy + w * 0.12;
  const cs = s.xs.map((x, i) => ({ x: cx + x * w, y: base - s.rs[i] * w, r: s.rs[i] * w }));
  const ang = (c, p) => (Math.atan2(p[1] - c.y, p[0] - c.x) * 180) / Math.PI;
  const cross = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const aa = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, a.r * a.r - aa * aa));
    const mx = a.x + (aa * dx) / d;
    const my = a.y + (aa * dy) / d;
    const p = [mx + (h * dy) / d, my - (h * dx) / d];
    const q = [mx - (h * dy) / d, my + (h * dx) / d];
    return p[1] < q[1] ? p : q;
  };
  const sweep = (a1, a2) => ((a2 - a1) % 360 + 360) % 360;
  let d = `M${f(cs[0].x)} ${f(base)}`;
  let prev = [cs[0].x, base];
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    const next = i < cs.length - 1 ? cross(c, cs[i + 1]) : [c.x, base];
    const sw = sweep(ang(c, prev), ang(c, next));
    d += `A${f(c.r)} ${f(c.r)} 0 ${sw > 180 ? 1 : 0} 1 ${f(next[0])} ${f(next[1])}`;
    prev = next;
  }
  return d + 'z';
}

/** Several petals as separate overlapping ellipses (one region, drawn with visible overlaps). */
export function petals(cx, cy, n, dist, rx, ry, rot = 0) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = ((rot + (i * 360) / n) * Math.PI) / 180;
    const px = cx + Math.cos(a) * dist;
    const py = cy + Math.sin(a) * dist;
    // ellipse rotated to point outward, approximated by a rotated path
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const pts = [];
    for (let k = 0; k < 16; k++) {
      const t = (k / 16) * Math.PI * 2;
      const ex = Math.cos(t) * rx;
      const ey = Math.sin(t) * ry;
      pts.push([px + ex * cos - ey * sin, py + ex * sin + ey * cos]);
    }
    d += blob(pts, 0.55);
  }
  return d;
}

/** Sun rays as one multi-part path. */
export function rays(cx, cy, r1, r2, n = 10, width = 0.2) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const a1 = a - width / 2;
    const a2 = a + width / 2;
    d += rpoly(
      [
        [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1],
        [cx + Math.cos(a) * r2, cy + Math.sin(a) * r2],
        [cx + Math.cos(a2) * r1, cy + Math.sin(a2) * r1]
      ],
      6
    );
  }
  return d;
}

// ---------------------------------------------------------------- scene

export class Scene {
  constructor(id, name, vb = [1000, 750]) {
    this.id = id;
    this.name = name;
    this.vb = vb;
    this.items = [];
    this.ids = new Set();
  }

  /** A colorable region. `color` is only used for the colored thumbnail. */
  region(id, name, d, color, o = {}) {
    if (this.ids.has(id)) throw new Error(`duplicate region id ${id} in ${this.id}`);
    if (!/^[a-z0-9_]+$/.test(id)) throw new Error(`bad region id ${id}`);
    this.ids.add(id);
    this.items.push({ kind: 'region', id, name, d, color, w: o.w ?? 5, transform: o.transform });
    return this;
  }

  /** Line-only detail (stems, ropes, smiles, hatching). */
  line(d, o = {}) {
    this.items.push({ kind: 'line', d, w: o.w ?? 4, transform: o.transform, dash: o.dash });
    return this;
  }

  dot(cx, cy, r = 6) {
    this.items.push({ kind: 'dot', cx, cy, r });
    return this;
  }

  /** Cute face: two eyes and a smile. */
  face(cx, cy, s = 1, o = {}) {
    const gap = 34 * s;
    if (o.sleepy) {
      this.line(`M${f(cx - gap - 12 * s)} ${f(cy)}q${f(12 * s)} ${f(10 * s)} ${f(24 * s)} 0`, { w: 4.5 });
      this.line(`M${f(cx + gap - 12 * s)} ${f(cy)}q${f(12 * s)} ${f(10 * s)} ${f(24 * s)} 0`, { w: 4.5 });
    } else {
      this.dot(cx - gap, cy, 7.5 * s);
      this.dot(cx + gap, cy, 7.5 * s);
    }
    this.line(`M${f(cx - 15 * s)} ${f(cy + 18 * s)}q${f(15 * s)} ${f(17 * s)} ${f(30 * s)} 0`, { w: 4.5 });
    return this;
  }

  attrs(it) {
    return it.transform ? ` transform="${it.transform}"` : '';
  }

  /** mode: 'line' (blank page) or 'color' (suggested colors, for thumbnails) */
  svg(mode = 'line') {
    const [w, h] = this.vb;
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`];
    out.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
    out.push(`<g stroke="${LINE}" stroke-linejoin="round" stroke-linecap="round">`);
    for (const it of this.items) {
      if (it.kind === 'region') {
        const fill = mode === 'color' ? it.color : '#ffffff';
        out.push(`<path data-region="${it.id}" data-name="${it.name.replace(/"/g, "")}" d="${it.d}" fill="${fill}" stroke-width="${it.w}"${this.attrs(it)}/>`);
      } else if (it.kind === 'line') {
        out.push(`<path d="${it.d}" fill="none" stroke-width="${it.w}"${it.dash ? ` stroke-dasharray="${it.dash}"` : ''}${this.attrs(it)}/>`);
      } else {
        out.push(`<circle cx="${f(it.cx)}" cy="${f(it.cy)}" r="${f(it.r)}" fill="${LINE}" stroke="none"/>`);
      }
    }
    out.push('</g></svg>');
    return out.join('\n');
  }

  regionsJson() {
    return {
      viewBox: this.vb,
      regions: this.items.filter((i) => i.kind === 'region').map((i) => ({ id: i.id, name: i.name, suggested: i.color }))
    };
  }
}

// ---------------------------------------------------------------- colors
export const C = {
  sky: '#bfe4f7',
  skyDeep: '#a4d2f2',
  skyPale: '#dff0fb',
  lavender: '#d9cdf6',
  lilac: '#e6d8f8',
  mint: '#c6ecda',
  leaf: '#a9dcb4',
  grass: '#c2e8c4',
  peach: '#ffdcc8',
  coral: '#ffc3b0',
  pink: '#ffd3e2',
  rose: '#f6b8cf',
  butter: '#fff2bd',
  cream: '#fff8ec',
  turq: '#bdeeea',
  sand: '#f8e4c2',
  wood: '#e9c7a3',
  stone: '#e3e0f0',
  white: '#ffffff',
  night: '#8d8ed0',
  nightDeep: '#7a7bbd',
  nightPale: '#aeb0e6',
  moon: '#fff3c4',
  sun: '#ffe9a8',
  sunset: '#ffd0b5',
  dusk: '#e8c4e4'
};

// ---------------------------------------------------------------- more shapes

/** Pointed leaf/petal from (x,y) along `angle` degrees. */
export function leaf(x, y, len, wid, angle = 0) {
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const raw = [[0, 0], [len * 0.28, -wid * 0.95], [len * 0.68, -wid * 0.7], [len, 0], [len * 0.68, wid * 0.7], [len * 0.28, wid * 0.95]];
  return blob(raw.map(([px, py]) => [x + px * cos - py * sin, y + px * sin + py * cos]), 0.6);
}

/** Horizontal band of a circle between y1 and y2 (stays inside the circle). */
export function circleBand(cx, cy, r, y1, y2) {
  const dx = (y) => Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
  const a = dx(y1);
  const b = dx(y2);
  return `M${f(cx - a)} ${f(y1)}L${f(cx + a)} ${f(y1)}A${f(r)} ${f(r)} 0 0 1 ${f(cx + b)} ${f(y2)}L${f(cx - b)} ${f(y2)}A${f(r)} ${f(r)} 0 0 1 ${f(cx - a)} ${f(y1)}z`;
}

/** Full ring (ellipse minus ellipse). */
export function annulus(cx, cy, ox, oy, ix, iy) {
  return (
    `M${f(cx - ox)} ${f(cy)}a${f(ox)} ${f(oy)} 0 1 0 ${f(2 * ox)} 0a${f(ox)} ${f(oy)} 0 1 0 ${f(-2 * ox)} 0z` +
    `M${f(cx - ix)} ${f(cy)}a${f(ix)} ${f(iy)} 0 1 1 ${f(2 * ix)} 0a${f(ix)} ${f(iy)} 0 1 1 ${f(-2 * ix)} 0z`
  );
}

/** Lower half of a ring. */
export function annulusLower(cx, cy, ox, oy, ix, iy) {
  return `M${f(cx - ox)} ${f(cy)}A${f(ox)} ${f(oy)} 0 0 0 ${f(cx + ox)} ${f(cy)}L${f(cx + ix)} ${f(cy)}A${f(ix)} ${f(iy)} 0 0 1 ${f(cx - ix)} ${f(cy)}z`;
}

/** Irregular rounded blob (foliage, bushes) with deterministic wobble. */
export function crown(cx, cy, r, seed = 1, n = 9) {
  const pts = [];
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.9 + rnd() * 0.22;
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * 0.92]);
  }
  return blob(pts, 0.55);
}

/** Half disc (domes, umbrellas, mushroom caps). */
export const dome = (cx, cy, rx, ry = rx) => `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx)} ${f(cy)}z`;

/** A tiny 'v' bird. */
export const bird = (x, y, s = 1) => `M${f(x - 22 * s)} ${f(y)}q${f(11 * s)} ${f(-16 * s)} ${f(22 * s)} ${f(2 * s)}q${f(11 * s)} ${f(-18 * s)} ${f(22 * s)} ${f(-2 * s)}`;

/** Sun with a ring of rays (two regions). */
export function addSun(S, cx, cy, r, withRays = true) {
  if (withRays) S.region('sun_rays', 'Sun rays', rays(cx, cy, r + 16, r + 46, 10, 0.3), C.butter);
  S.region('sun', 'Sun', circle(cx, cy, r), C.sun);
}

/** A flower: petals + center + stem line. */
export function addFlower(S, key, cx, cy, s = 1, color = C.pink, stemTo = null) {
  if (stemTo !== null) S.line(`M${f(cx)} ${f(cy + 14 * s)}Q${f(cx + 10 * s)} ${f((cy + stemTo) / 2)} ${f(cx)} ${f(stemTo)}`, { w: 6 });
  S.region(`${key}_petals`, 'Flower petals', petals(cx, cy, 5, 24 * s, 21 * s, 15 * s, -90), color, { w: 4 });
  S.region(`${key}_center`, 'Flower center', circle(cx, cy, 15 * s), C.butter, { w: 4 });
}

export function addStars(S, list, prefix = 'star', color = C.moon) {
  list.forEach(([x, y, r], i) => S.region(`${prefix}${i + 1}`, 'Star', star(x, y, r, r * 0.48, 5), color, { w: 4 }));
}
