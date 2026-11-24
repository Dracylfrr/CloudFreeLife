/**
 * The "Illustrated" avatar style: a painterly anime look in the spirit of modern illustrated
 * portraits. Hair is built from layered, pointed locks in several tones with a glossy highlight
 * and a colored rim light; eyes are large and detailed; the skin has flat cel shadows; and the
 * background is a few sweeping brush strokes. Hair and strokes get a slightly rough edge from an
 * SVG filter, so nothing looks like clean vector shapes.
 */
import { mix, shade } from './avatar';
import type { Ctx } from './draw';
import { EYE_LASH, EYE_SCLERA } from './eyeShapes';

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A pointed lock of hair from (x0,y0) to the tip (x1,y1), `w` wide at the root and curved by `bend`. */
export function lock(x0: number, y0: number, x1: number, y1: number, w: number, bend = 0): string {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (x0 + x1) / 2 + nx * bend;
  const my = (y0 + y1) / 2 + ny * bend;
  const t = w * 0.38;
  return `M${r1(x0 + (nx * w) / 2)} ${r1(y0 + (ny * w) / 2)}Q${r1(mx + nx * t)} ${r1(my + ny * t)} ${r1(x1)} ${r1(y1)}Q${r1(mx - nx * t)} ${r1(my - ny * t)} ${r1(x0 - (nx * w) / 2)} ${r1(y0 - (ny * w) / 2)}Z`;
}

interface Pal {
  base: string;
  deep: string;
  mid: string;
  lite: string;
  edge: string;
  rim: string;
  ink: string;
}
const pal = (x: Ctx): Pal => {
  const b = x.c.hair;
  return {
    base: b,
    deep: shade(b, -0.4),
    mid: shade(b, -0.2),
    lite: shade(b, 0.28),
    edge: shade(b, -0.55),
    // the colored rim light: a bright tint of the eye color, like energy glancing off the hair
    rim: mix(shade(x.c.eyes, 0.35), '#ffffff', 0.25),
    ink: '#2a2233'
  };
};

/** Gradients and the rough-edge filter this style needs. */
export function illusDefs(x: Ctx): string {
  const p = pal(x);
  const c = x.c;
  return (
    `<linearGradient id="hg-${x.uid}" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="118"><stop offset="0" stop-color="${p.lite}"/><stop offset="0.38" stop-color="${p.base}"/><stop offset="1" stop-color="${p.deep}"/></linearGradient>` +
    `<linearGradient id="ig-${x.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c.eyes, -0.5)}"/><stop offset="0.5" stop-color="${c.eyes}"/><stop offset="1" stop-color="${shade(c.eyes, 0.5)}"/></linearGradient>` +
    `<linearGradient id="sg-${x.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bfd6"/><stop offset="0.4" stop-color="#ffffff"/><stop offset="1" stop-color="#f4f1fb"/></linearGradient>` +
    `<filter id="rough-${x.uid}" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>`
  );
}

/** Sweeping translucent brush strokes behind the portrait, in a bright tint of the eye color. */
export function illusBackground(x: Ctx): string {
  const c = x.c;
  const tint = mix(shade(c.eyes, 0.4), c.background, 0.15);
  const soft = mix(shade(c.hair, 0.5), c.background, 0.4);
  const blades: [number, number, number, number, number, string, number][] = [
    [4, 36, 50, 8, 3.6, tint, 0.8],
    [66, 4, 118, 34, 3.2, tint, 0.75],
    [2, 74, 38, 52, 2.6, soft, 0.7],
    [84, 66, 120, 42, 3.4, tint, 0.8],
    [14, 108, 58, 86, 2.8, tint, 0.55],
    [92, 104, 122, 80, 2.4, soft, 0.6],
    [26, 6, 62, -2, 2, soft, 0.6],
    [100, 20, 122, 8, 1.8, tint, 0.7]
  ];
  const strokes = blades.map(([x0, y0, x1, y1, w, col, op]) => `<path d="${lock(x0, y0, x1, y1, w, w * 2.2)}" fill="${col}" opacity="${op}"/>`).join('');
  const specks = [[20, 22, 1.6], [104, 52, 1.4], [10, 92, 1.2], [112, 98, 1.5], [96, 8, 1.1]]
    .map(([sx, sy, sr]) => `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="${tint}" opacity="0.85"/>`)
    .join('');
  return `<g filter="url(#rough-${x.uid})">${strokes}</g>${specks}`;
}

// ---------------------------------------------------------------- hair

function hairStyleKey(x: Ctx): string {
  const c = x.c;
  // a hat sits where a bun or tall spikes would be
  if (c.hat !== 'none' && (c.hairStyle === 'messy' || c.hairStyle === 'bun')) return 'short';
  return c.hairStyle;
}

export function illusBackHair(x: Ctx): string {
  const p = pal(x);
  const fill = `fill="url(#hg-${x.uid})" stroke="${p.edge}" stroke-width="0.9" stroke-linejoin="round" opacity="1"`;
  const lines = (d: string) => `<path d="${d}" fill="none" stroke="${p.edge}" stroke-width="1" stroke-linecap="round" opacity="0.35"/>`;
  let body = '';
  switch (hairStyleKey(x)) {
    case 'long':
      body =
        `<path d="M25 58C19 30 40 13 60 13C80 13 101 30 95 58C99 80 102 102 97 118L90 110L86 120L78 106L68 114L60 108L52 114L42 106L34 120L30 110L23 118C18 102 21 80 25 58Z" ${fill}/>` +
        lines('M32 62C29 84 31 102 35 114M88 62C91 84 89 102 85 114M44 40C40 70 40 96 44 110M76 40C80 70 80 96 76 110');
      break;
    case 'bob':
      body =
        `<path d="M26 58C22 30 41 14 60 14C79 14 98 30 94 58C97 74 96 90 90 100C84 95 80 91 78 84L42 84C40 91 36 95 30 100C24 90 23 74 26 58Z" ${fill}/>` +
        lines('M31 62C29 76 30 88 32 96M89 62C91 76 90 88 88 96');
      break;
    case 'pigtails':
      body =
        `<path d="M34 42C14 48 7 80 15 106C20 100 24 102 28 108C37 92 41 76 40 58Z" ${fill}/><path d="M86 42C106 48 113 80 105 106C100 100 96 102 92 108C83 92 79 76 80 58Z" ${fill}/>` +
        `<path d="M27 58C24 32 42 16 60 16C78 16 96 32 93 58C95 70 90 80 82 82L38 82C30 80 25 70 27 58Z" ${fill}/>` +
        lines('M22 60C18 78 18 92 20 100M98 60C102 78 102 92 100 100');
      break;
    case 'bun':
      body = `<circle cx="60" cy="14" r="12.5" ${fill}/><path d="M52 12Q60 7 69 12" fill="none" stroke="${p.rim}" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/><path d="M27 58C24 32 42 16 60 16C78 16 96 32 93 58C95 70 90 80 82 82L38 82C30 80 25 70 27 58Z" ${fill}/>`;
      break;
    default:
      body = `<path d="M27 58C24 32 42 16 60 16C78 16 96 32 93 58C95 70 90 80 82 82L38 82C30 80 25 70 27 58Z" ${fill}/>`;
  }
  return `<g filter="url(#rough-${x.uid})">${body}</g>`;
}

export function illusFrontHair(x: Ctx): string {
  const p = pal(x);
  const key = hairStyleKey(x);
  const fill = `fill="url(#hg-${x.uid})" stroke="${p.edge}" stroke-width="0.9" stroke-linejoin="round"`;
  const lockFill = `fill="${p.base}" stroke="${p.edge}" stroke-width="0.8" stroke-linejoin="round"`;
  const lockDark = `fill="${p.mid}" stroke="${p.edge}" stroke-width="0.8" stroke-linejoin="round"`;
  const L = (a: number[], f = lockFill) => `<path d="${lock(a[0], a[1], a[2], a[3], a[4], a[5] ?? 0)}" ${f}/>`;
  const rim = (d: string, w = 1.5, o = 0.85) => `<path d="${d}" fill="none" stroke="${p.rim}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
  const streak = (d: string, o = 0.5) => `<path d="${d}" fill="${p.lite}" opacity="${o}"/>`;
  let body = '';

  if (key === 'short' || key === 'messy') {
    const wild = key === 'messy';
    // the crown, then spiky locks swept to one side
    body += `<path d="M26 60C22 32 42 15 60 15C78 15 98 32 94 60C91 49 85 41 78 38L74 46L68 38L62 47L56 38L50 47L44 38L38 46L33 41C29 47 27 53 26 60Z" ${fill}/>`;
    const spikes: number[][] = wild
      ? [[30, 30, 14, 20, 9, 3], [36, 22, 28, 4, 9, 3], [45, 17, 42, -3, 9, 4], [55, 15, 58, -5, 10, 4], [65, 15, 76, -4, 10, 4], [75, 18, 94, 0, 9, 5], [84, 25, 106, 14, 8, 5], [90, 36, 112, 36, 7, 4], [27, 42, 10, 46, 6, -3]]
      : [[33, 24, 25, 8, 9, 3], [42, 18, 38, 2, 9, 3], [52, 15, 54, -1, 10, 4], [62, 15, 70, -1, 10, 4], [72, 18, 86, 4, 9, 4], [82, 25, 98, 16, 8, 4]];
    body += spikes.map((s) => L(s)).join('');
    const fringe: number[][] = wild
      ? [[34, 38, 29, 56, 7, 2], [43, 39, 42, 59, 7, 2], [52, 40, 56, 55, 7, 3], [61, 40, 67, 58, 7, 3], [70, 40, 80, 56, 7, 3], [79, 40, 91, 52, 6, 3]]
      : [[35, 39, 31, 54, 7, 2], [44, 40, 43, 57, 7, 2], [54, 40, 58, 54, 7, 3], [64, 40, 70, 56, 7, 3], [73, 40, 84, 53, 6, 3]];
    body += fringe.map((s) => L(s, lockDark)).join('');
    body += streak('M38 22C46 14 60 13 72 16C60 16 48 20 38 22Z') + streak('M30 40C34 30 42 24 50 22C42 28 36 34 30 40Z', 0.4);
    body += rim('M31 40C28 27 41 20 60 19', 1.5) + rim('M62 19C76 19 88 26 91 38', 1.3, 0.7);
    if (wild) body += rim('M10 46C14 46 20 44 26 42', 1.2, 0.8);
  } else {
    // smooth, glossy hair with a blunt fringe
    body += `<path d="M26 60C22 31 42 14 60 14C78 14 98 31 94 60L91 46C84 48 78 45 72 47C66 50 62 45 60 47C56 45 52 50 46 47C40 45 34 48 29 46Z" ${fill}/>`;
    const long = key === 'long';
    const sideEnd = long ? 118 : key === 'bob' ? 98 : 78;
    body += `<path d="M28 42C21 66 23 ${sideEnd - 22} 29 ${sideEnd}L38 ${sideEnd - 14}C36 ${sideEnd - 30} 37 66 38 46Z" ${lockFill}/>`;
    body += `<path d="M92 42C99 66 97 ${sideEnd - 22} 91 ${sideEnd}L82 ${sideEnd - 14}C84 ${sideEnd - 30} 83 66 82 46Z" ${lockFill}/>`;
    body += `<path d="M44 22C42 32 42 40 44 47M60 18C60 30 60 40 60 47M76 22C78 32 78 40 76 47" fill="none" stroke="${p.edge}" stroke-width="1" stroke-linecap="round" opacity="0.4"/>`;
    // the glossy band across the crown
    body += `<path d="M31 36C41 20 79 20 89 36C79 27 41 27 31 36Z" fill="#ffffff" opacity="0.38"/>`;
    body += streak('M40 24C48 17 66 17 76 22C64 21 50 22 40 24Z', 0.35);
    body += rim('M30 44C27 31 41 20 60 19', 1.4, 0.75) + rim('M91 43C93 32 80 21 62 19', 1.3, 0.6);
    if (key === 'pigtails') body += `<circle cx="32.5" cy="45" r="4.4" fill="${x.c.outfitColor}" stroke="${p.edge}" stroke-width="1.2"/><circle cx="87.5" cy="45" r="4.4" fill="${x.c.outfitColor}" stroke="${p.edge}" stroke-width="1.2"/>`;
    if (key === 'bun') body += `<circle cx="60" cy="22" r="3.6" fill="${x.c.outfitColor}" stroke="${p.edge}" stroke-width="1.2"/>`;
  }
  return `<g filter="url(#rough-${x.uid})">${body}</g>`;
}

// ---------------------------------------------------------------- face

/** One large, detailed eye. `sign` is +1 for the right eye and -1 for the left. */
export function illusEye(x: Ctx, cx: number, sign: 1 | -1, n: number): string {
  const { c, uid } = x;
  const s = (c.eyeSize / 100) * 1.02;
  const shape = c.eyeShape;
  const id = `ec-${uid}-${n}`;
  const ink = '#2a2233';
  const pupil = shade(c.eyes, -0.7);
  const path = EYE_SCLERA[shape];
  const lash = EYE_LASH[shape];
  const lid = shape === 'sleepy' ? `<path d="M-10 -12H10V-1.4Q0 -5.6 -10 -1.4Z" fill="${c.skin}"/>` : '';
  const sparkle =
    shape === 'sparkle'
      ? `<path d="M-2.6 -6.4L-1.7 -3.6L1.2 -2.8L-1.7 -1.9L-2.6 1L-3.5 -1.9L-6.4 -2.8L-3.5 -3.6Z" fill="#fff"/>`
      : `<ellipse cx="-2.6" cy="-2.6" rx="2.2" ry="2.9" fill="#fff"/>`;
  return (
    `<g transform="translate(${cx} 62) scale(${sign * s} ${s})">` +
    `<clipPath id="${id}"><path d="${path}"/></clipPath>` +
    `<path d="${path}" fill="url(#sg-${uid})"/>` +
    `<g clip-path="url(#${id})">` +
    `<circle cx="0.6" cy="0.6" r="6.4" fill="url(#ig-${uid})"/>` +
    `<circle cx="0.6" cy="0.6" r="6.4" fill="none" stroke="${shade(c.eyes, -0.65)}" stroke-width="1.1"/>` +
    `<ellipse cx="0.8" cy="0.8" rx="2.5" ry="3.4" fill="${pupil}"/>` +
    sparkle +
    `<circle cx="3" cy="3" r="1.1" fill="#fff" opacity="0.9"/><circle cx="-4" cy="2.8" r="0.6" fill="#fff" opacity="0.7"/>` +
    // the shadow the upper lid casts
    `<path d="M-11 -12H11V-3.2Q0 -6.6 -11 -3.2Z" fill="${ink}" opacity="0.18"/>` +
    lid +
    `</g>` +
    `<path d="${lash}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M-6.4 -5.6C-3 -9.6 3 -10.4 8 -6.4" fill="none" stroke="${ink}" stroke-width="0.9" stroke-linecap="round" opacity="0.55"/>` +
    `<path d="M-7.2 4.6C-3 7.8 4 7.6 8 3.6" fill="none" stroke="${ink}" stroke-width="0.8" stroke-linecap="round" opacity="0.5"/>` +
    `<path d="M-7.6 -7.8C-3 -12.2 4 -12.4 9.6 -7.6" fill="none" stroke="${shade(c.skin, -0.4)}" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>` +
    `</g>`
  );
}

/** Angular, slightly thick eyebrows in the hair's darker tone. */
export function illusBrows(x: Ctx): string {
  const c = x.c;
  const dx = 13 * (c.eyeGap / 100 - 1);
  const col = shade(c.hair, -0.25);
  const l = `<path transform="translate(${-dx} 0)" d="M39 51.4C43.6 47 49.6 46 55 47.8C50 47.8 44.6 49.6 40.4 53Z" fill="${col}"/>`;
  const r = `<path transform="translate(${dx} 0)" d="M81 51.4C76.4 47 70.4 46 65 47.8C70 47.8 75.4 49.6 79.6 53Z" fill="${col}"/>`;
  return l + r;
}

/** Flat, warm cel shadows on the face (drawn inside the head outline), and a soft cheek light. */
export function illusFaceShading(x: Ctx, head: string): string {
  const c = x.c;
  const shadow = mix(c.skin, '#a85a52', 0.32);
  const id = `hc-${x.uid}`;
  return (
    `<clipPath id="${id}"><path d="${head}"/></clipPath>` +
    `<g clip-path="url(#${id})">` +
    // under the fringe
    `<path d="M26 28L94 28L94 53C86 51 80 55 74 52C68 56 60 55 56 52C50 56 42 52 36 55C32 53 28 53 26 55Z" fill="${shadow}" opacity="0.55"/>` +
    // the side of the face turned away from the light
    `<path d="M92 42C99 62 94 82 72 90C84 78 88 60 82 46Z" fill="${shadow}" opacity="0.5"/>` +
    // under the jaw
    `<path d="M30 78C42 92 78 92 90 78L96 96L24 96Z" fill="${shadow}" opacity="0.42"/>` +
    // light on the cheek and nose
    `<ellipse cx="41" cy="71" rx="5.2" ry="3" fill="#ffffff" opacity="0.2"/>` +
    `<path d="M60.4 63C60 66 59.6 68 59 69" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.35"/>` +
    `</g>`
  );
}

/** A flat shadow on the clothes, matching the light from the left. */
export function illusBodyShade(x: Ctx): string {
  const col = shade(x.c.outfitColor, -0.17);
  return `<path d="M62 93C90 96 108 104 108 121L70 121C72 108 68 100 62 93Z" fill="${col}" opacity="0.55"/><path d="M52 94C56 100 58 104 58 108" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>`;
}
