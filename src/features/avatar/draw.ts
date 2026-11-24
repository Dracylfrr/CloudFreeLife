/**
 * Draws the avatar's portrait as SVG, in four art styles. Everything is built from the config, in a
 * 120 x 120 picture. The head (and everything on it) sits in a group that is stretched by the head
 * width and height; the body sits in a group moved down by the neck length and widened by the body
 * type. The result is placed inside a circle by `render.ts`.
 */
import { mix, shade, type AvatarConfig, type Chin, type EyeShape } from './avatar';

interface Ctx {
  c: AvatarConfig;
  uid: string;
  /** Outline color ("none" in the flat style). */
  line: string;
  /** Attributes that outline a shape. */
  st: string;
  /** Attributes that outline hair. */
  hst: string;
  flat: boolean;
  real: boolean;
  anime: boolean;
}

function makeCtx(c: AvatarConfig, uid: string): Ctx {
  const flat = c.style === 'flat';
  const real = c.style === 'real';
  const anime = c.style === 'anime';
  const line = flat ? 'none' : real ? shade(c.skin, -0.55) : anime ? '#463c5a' : '#5b5678';
  const lw = flat ? 0 : real ? 1.1 : anime ? 1.8 : 2.4;
  const st = flat ? 'stroke="none"' : `stroke="${line}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round"`;
  const hline = flat ? 'none' : real ? shade(c.hair, -0.5) : line;
  const hst = flat ? 'stroke="none"' : `stroke="${hline}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round"`;
  return { c, uid, line, st, hst, flat, real, anime };
}

// ---------------------------------------------------------------- head shape

/** The face outline: an ellipse, with a chin that can be rounder or more pointed. */
export function headPath(chin: Chin, rx = 31, ry = 29.5): string {
  const cx = 60;
  const cy = 57;
  const k = chin === 'round' ? 0 : chin === 'soft' ? 0.5 : 1;
  const a = 0.5523;
  const f = (n: number) => Math.round(n * 100) / 100;
  const botY = cy + ry * (1 + 0.035 * k);
  return (
    `M${f(cx - rx)} ${cy}` +
    `C${f(cx - rx)} ${f(cy - ry * a)} ${f(cx - rx * a)} ${f(cy - ry)} ${cx} ${f(cy - ry)}` +
    `C${f(cx + rx * a)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ry * a)} ${f(cx + rx)} ${cy}` +
    `C${f(cx + rx - rx * 0.1 * k)} ${f(cy + ry * (a - 0.14 * k))} ${f(cx + rx * (a - 0.42 * k))} ${f(botY)} ${cx} ${f(botY)}` +
    `C${f(cx - rx * (a - 0.42 * k))} ${f(botY)} ${f(cx - rx + rx * 0.1 * k)} ${f(cy + ry * (a - 0.14 * k))} ${f(cx - rx)} ${cy}Z`
  );
}

// ---------------------------------------------------------------- hair

function effectiveHairStyle(c: AvatarConfig) {
  // a hat sits where a bun or tall spikes would be, so those fall back to simple hair under a hat
  if (c.hat !== 'none' && c.hairStyle === 'messy') return 'short';
  if (c.hat !== 'none' && c.hairStyle === 'bun') return 'short';
  return c.hairStyle;
}

function backHair(x: Ctx): string {
  const { c, hst } = x;
  const f = `fill="${c.hair}" ${hst}`;
  const strands = x.flat ? '' : `stroke="${shade(c.hair, -0.25)}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.55"`;
  switch (effectiveHairStyle(c)) {
    case 'long':
      return (
        `<path d="M26 58C21 86 27 106 40 112L80 112C93 106 99 86 94 58C94 29 78 19 60 19C42 19 26 29 26 58Z" ${f}/>` +
        (x.real || x.anime ? `<path d="M33 74C31 92 34 104 40 109M87 74C89 92 86 104 80 109M27 70C26 90 30 104 36 110" ${strands}/>` : '')
      );
    case 'bob':
      return (
        `<path d="M27 58C25 80 29 91 38 94L82 94C91 91 95 80 93 58C93 30 78 20 60 20C42 20 27 30 27 58Z" ${f}/>` +
        (x.real || x.anime ? `<path d="M32 70C31 82 33 90 37 93M88 70C89 82 87 90 83 93" ${strands}/>` : '')
      );
    case 'pigtails':
      return `<path d="M34 42C15 48 9 80 18 99C31 95 39 78 39 58Z" ${f}/><path d="M86 42C105 48 111 80 102 99C89 95 81 78 81 58Z" ${f}/>`;
    case 'bun':
      return `<circle cx="60" cy="16" r="12" ${f}/><path d="M52 14Q60 10 68 14" fill="none" stroke="${shade(c.hair, 0.3)}" stroke-width="2.4" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

function frontHair(x: Ctx): string {
  const { c, hst } = x;
  const f = `fill="${c.hair}" ${hst}`;
  const hi = `fill="none" stroke="${shade(c.hair, 0.32)}" stroke-width="3" stroke-linecap="round" opacity="0.75"`;
  const strands = x.flat ? '' : `<path d="M44 29Q47.5 36 45.5 43M60 25Q61.5 33 60 39.5M76 29Q72.5 36 74.5 43" fill="none" stroke="${shade(c.hair, -0.28)}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>`;
  const fringe = `<path d="M28 58C25 33 42 21 60 21C78 21 95 33 92 58C90 49 86 44 80 41C74 47 66 47 60 40C54 47 46 47 40 41C34 44 30 49 28 58Z" ${f}/><path d="M42 30Q60 22 78 30" ${hi}/>${x.real || x.anime ? strands : ''}`;
  const spiky = `<path d="M27 60C21 40 30 28 38 25L36 15L47 22L52 11L60 21L68 11L73 22L84 15L82 25C90 28 99 40 93 60C91 51 87 45 81 42C75 47 66 46 60 40C54 46 45 47 39 42C33 45 29 51 27 60Z" ${f}/><path d="M44 31Q60 25 76 31" ${hi}/>`;
  const side = (to: number) =>
    `<path d="M28 54C26 68 27 ${to - 12} 32 ${to}L38 ${to - 3}C35.5 ${to - 16} 35.5 66 37.5 52Z" ${f}/><path d="M92 54C94 68 93 ${to - 12} 88 ${to}L82 ${to - 3}C84.5 ${to - 16} 84.5 66 82.5 52Z" ${f}/>`;
  switch (effectiveHairStyle(c)) {
    case 'messy':
      return spiky;
    case 'bob':
      return fringe + side(90);
    case 'long':
      return fringe + side(106);
    case 'pigtails':
      return fringe + side(72) + `<circle cx="32.5" cy="45" r="4.4" fill="${c.outfitColor}" ${x.st} stroke-width="2"/><circle cx="87.5" cy="45" r="4.4" fill="${c.outfitColor}" ${x.st} stroke-width="2"/>`;
    case 'bun':
      return fringe + side(72) + `<circle cx="60" cy="25" r="3.6" fill="${c.outfitColor}" ${x.st} stroke-width="2"/>`;
    default:
      return fringe;
  }
}

// ---------------------------------------------------------------- face

const SCLERA: Record<EyeShape, string> = {
  round: 'M-6.9 0A6.9 8.3 0 1 0 6.9 0A6.9 8.3 0 1 0 -6.9 0Z',
  sparkle: 'M-6.9 0A6.9 8.3 0 1 0 6.9 0A6.9 8.3 0 1 0 -6.9 0Z',
  sleepy: 'M-6.9 0A6.9 8.3 0 1 0 6.9 0A6.9 8.3 0 1 0 -6.9 0Z',
  almond: 'M-8.4 1.2C-6 -6.4 5 -8.2 8.8 -1.8C5.4 5.8 -5 7.4 -8.4 1.2Z',
  cat: 'M-8 2.4C-5 -5.6 3.8 -8.4 10 -4.2C6.4 4.6 -3.8 7 -8 2.4Z'
};
const LASH: Record<EyeShape, string> = {
  round: 'M-7.6 -3.6Q0 -11.6 7.6 -3.6',
  sparkle: 'M-7.6 -3.6Q0 -11.6 7.6 -3.6',
  sleepy: 'M-7.8 -1.4Q0 -5.4 7.8 -1.4',
  almond: 'M-8.9 1C-6.4 -7.2 5.2 -9 9.8 -2.2',
  cat: 'M-8.4 2.2C-5.2 -6.4 4 -9.4 10.4 -4.6L11.9 -7.4'
};

/** One eye. `sign` is +1 for the right eye and -1 for the left, so the outer corner points outward. */
function eye(x: Ctx, cx: number, sign: 1 | -1, n: number): string {
  const { c } = x;
  const shape = c.eyeShape;
  const s = c.eyeSize / 100;
  const pupil = shade(c.eyes, -0.6);
  const glow = shade(c.eyes, 0.35);
  const id = `ec-${x.uid}-${n}`;
  const path = SCLERA[shape];
  const lashW = x.flat ? 1.8 : x.real ? 1.4 : x.anime ? 2.3 : 2.7;
  const lashColor = x.flat ? pupil : x.line;
  // the iris, by style
  let iris: string;
  if (x.real) {
    iris = `<circle cx="0" cy="0.3" r="3.9" fill="${c.eyes}"/><circle cx="0" cy="0.5" r="1.9" fill="${pupil}"/><circle cx="-1.2" cy="-1.3" r="1" fill="#fff"/>`;
  } else if (x.flat) {
    iris = `<ellipse cy="0.6" rx="4.6" ry="5.8" fill="${pupil}"/><circle cx="-1.5" cy="-1.8" r="1.7" fill="#fff"/>`;
  } else {
    const rx = x.anime ? 5.1 : 5.7;
    const ry = x.anime ? 6.5 : 7.2;
    const spark =
      shape === 'sparkle'
        ? `<path d="M-2.3 -6.2L-1.5 -3.6L1.2 -2.9L-1.5 -2.2L-2.3 0.5L-3.1 -2.2L-5.8 -2.9L-3.1 -3.6Z" fill="#fff"/><circle cx="2.6" cy="3.2" r="1.2" fill="#fff" opacity="0.9"/><circle cx="3.6" cy="-1.6" r="0.8" fill="#fff" opacity="0.8"/>`
        : `<circle cx="-2.2" cy="-2.8" r="2.3" fill="#fff"/><circle cx="2.4" cy="3" r="1.1" fill="#fff" opacity="0.85"/>`;
    iris =
      `<ellipse cy="0.6" rx="${rx}" ry="${ry}" fill="${c.eyes}"/>` +
      `<ellipse cy="1.6" rx="${x.anime ? 2.8 : 3.1}" ry="${x.anime ? 4.1 : 4.4}" fill="${pupil}"/>` +
      `<ellipse cy="4" rx="${rx - 1.5}" ry="2.6" fill="${glow}" opacity="0.55"/>` +
      spark;
  }
  const scleraAttrs = x.flat ? 'fill="none"' : `fill="#ffffff" ${x.real || x.anime ? `stroke="${x.line}" stroke-width="${x.real ? 0.7 : 1}"` : `stroke="${x.line}" stroke-width="1.3"`}`;
  const lid = shape === 'sleepy' ? `<path d="M-9 -11H9V-1.6Q0 -5.6 -9 -1.6Z" fill="${c.skin}"/>` : '';
  const crease = x.real ? `<path d="M-7.4 -5.8Q0 -11.4 7.6 -5.8" fill="none" stroke="${shade(c.skin, -0.3)}" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>` : '';
  const showLash = !x.flat || shape === 'almond' || shape === 'cat' || shape === 'sleepy';
  return (
    `<g transform="translate(${cx} 62) scale(${sign * s} ${s})">` +
    `<clipPath id="${id}"><path d="${path}"/></clipPath>` +
    `<path d="${path}" ${scleraAttrs}/>` +
    `<g clip-path="url(#${id})">${iris}${lid}</g>` +
    crease +
    (showLash ? `<path d="${LASH[shape]}" fill="none" stroke="${lashColor}" stroke-width="${lashW}" stroke-linecap="round" stroke-linejoin="round"/>` : '') +
    `</g>`
  );
}

function mouth(x: Ctx): string {
  const { c } = x;
  const lipTone = mix(c.skin, '#d46a7e', 0.5);
  const lw = x.flat ? 2 : x.real ? 1.2 : x.anime ? 1.8 : 2.2;
  const stroke = x.flat ? shade(c.skin, -0.55) : x.line;
  const line = `fill="none" stroke="${stroke}" stroke-width="${lw}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (c.mouth) {
    case 'grin':
      return `<path d="M53.6 73Q60 84 66.4 73Z" fill="#ffffff" stroke="${stroke}" stroke-width="${lw}" stroke-linejoin="round"/><path d="M57 78.6Q60 76.6 63 78.6" fill="${mix(c.skin, '#e0707f', 0.7)}" stroke="none"/>`;
    case 'calm':
      return x.real ? `<path d="M54 75.2Q57 73.6 60 74.4Q63 73.6 66 75.2Q60 77.4 54 75.2Z" fill="${lipTone}" stroke="${stroke}" stroke-width="0.9" stroke-linejoin="round"/>` : `<path d="M56 75.6Q60 77 64 75.6" ${line}/>`;
    case 'open':
      return `<ellipse cx="60" cy="76" rx="2.9" ry="3.5" fill="${mix(c.skin, '#7a2f45', 0.75)}" stroke="${stroke}" stroke-width="${lw * 0.8}"/>`;
    default:
      return x.real
        ? `<path d="M53.4 74.4Q56.6 72.4 60 73.6Q63.4 72.4 66.6 74.4Q60 80.2 53.4 74.4Z" fill="${lipTone}" stroke="${stroke}" stroke-width="0.9" stroke-linejoin="round"/>`
        : `<path d="M54.5 74.2Q60 80 65.5 74.2" ${line}/>`;
  }
}

function nose(x: Ctx): string {
  const { c } = x;
  if (x.flat) return '';
  const tone = shade(c.skin, -0.3);
  if (x.real) return `<path d="M60.4 61.5Q59 68 56.8 70.4Q60 72.4 63.2 70.4Q61.4 68.6 60.6 63" fill="none" stroke="${tone}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`;
  if (x.anime) return `<path d="M59.4 69.4Q60 70.4 60.8 69.4" fill="none" stroke="${tone}" stroke-width="1.2" stroke-linecap="round"/>`;
  return `<path d="M59 69.2Q60 70.8 61 69.2" fill="none" stroke="${tone}" stroke-width="1.6" stroke-linecap="round"/>`;
}

function brows(x: Ctx): string {
  const { c } = x;
  const dx = 13 * (c.eyeGap / 100 - 1);
  const lift = x.anime ? -0.8 : 0;
  const w = x.real ? 2.3 : x.flat ? 2 : x.anime ? 1.5 : 1.7;
  const col = x.real ? shade(c.hair, -0.1) : x.flat ? shade(c.hair, -0.2) : shade(c.hair, 0.05);
  const common = `fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${x.real ? 0.9 : 0.85}"`;
  const l = x.real ? 'M40.5 50.6Q46.5 46.4 53 48.8' : 'M41.5 49.2Q47 46 52.5 48.2';
  const r = x.real ? 'M67 48.8Q73.5 46.4 79.5 50.6' : 'M67.5 48.2Q73 46 78.5 49.2';
  return `<path transform="translate(${-dx} ${lift})" d="${l}" ${common}/><path transform="translate(${dx} ${lift})" d="${r}" ${common}/>`;
}

function blush(x: Ctx): string {
  const o = x.real ? 0.2 : x.anime ? 0.32 : x.flat ? 0.4 : 0.5;
  return `<ellipse cx="37.5" cy="72" rx="5.8" ry="3.4" fill="#ff9fb4" opacity="${o}"/><ellipse cx="82.5" cy="72" rx="5.8" ry="3.4" fill="#ff9fb4" opacity="${o}"/>`;
}

function ears(x: Ctx): string {
  const { c, st } = x;
  const fill = `fill="${c.skin}" ${st}`;
  const inner = x.real ? `<path d="M28.6 58Q26.6 61 28.8 64M91.4 58Q93.4 61 91.2 64" fill="none" stroke="${shade(c.skin, -0.3)}" stroke-width="0.8" stroke-linecap="round" opacity="0.7"/>` : '';
  switch (c.ears) {
    case 'small':
      return `<ellipse cx="30.4" cy="61" rx="3.4" ry="4.8" ${fill}/><ellipse cx="89.6" cy="61" rx="3.4" ry="4.8" ${fill}/>`;
    case 'pointed':
      return `<path d="M32 63C25 62 21 55 21 46C26 49 31 53 32.4 58Z" ${fill}/><path d="M88 63C95 62 99 55 99 46C94 49 89 53 87.6 58Z" ${fill}/>`;
    default:
      return `<ellipse cx="29.5" cy="61" rx="4.6" ry="6.2" ${fill}/><ellipse cx="90.5" cy="61" rx="4.6" ry="6.2" ${fill}/>${inner}`;
  }
}

// ---------------------------------------------------------------- accessories

function hatSvg(x: Ctx): string {
  const { c, st } = x;
  const hc = c.hatColor;
  const hd = shade(hc, -0.14);
  switch (c.hat) {
    case 'cap':
      return (
        `<path d="M27 40C27 16 43 10 60 10C77 10 93 16 93 40C80 35 40 35 27 40Z" fill="${hc}" ${st}/>` +
        `<path d="M60 11.5L60 35" stroke="${hd}" stroke-width="1.4" fill="none" opacity="0.55"/><circle cx="60" cy="10.6" r="2.4" fill="${hd}" ${st} stroke-width="1.4"/>` +
        `<path d="M24 38Q60 48 96 38Q96 33 90 33Q60 41 30 33Q24 33 24 38Z" fill="${hd}" ${st}/>`
      );
    case 'beanie':
      return (
        `<path d="M26 44C26 17 42 9 60 9C78 9 94 17 94 44Z" fill="${hc}" ${st}/>` +
        `<path d="M40 14Q39 28 40 40M52 10Q51 26 52 40M68 10Q69 26 68 40M80 14Q81 28 80 40" fill="none" stroke="${hd}" stroke-width="1" opacity="0.5"/>` +
        `<rect x="24.5" y="33" width="71" height="12" rx="6" fill="${hd}" ${st}/>` +
        `<circle cx="60" cy="8" r="6.2" fill="${shade(hc, 0.45)}" ${st}/>`
      );
    case 'bucket':
      return (
        `<path d="M33 38C33 16 45 10 60 10C75 10 87 16 87 38Z" fill="${hc}" ${st}/>` +
        `<path d="M33.6 30Q60 35 86.4 30" fill="none" stroke="${hd}" stroke-width="3" opacity="0.8"/>` +
        `<path d="M12 40Q60 28 108 40Q108 47 98 47Q60 37 22 47Q12 47 12 40Z" fill="${hd}" ${st}/>`
      );
    default:
      return '';
  }
}

function glassesSvg(x: Ctx): string {
  const { c } = x;
  if (c.glasses === 'none') return '';
  const ex = 13 * (c.eyeGap / 100);
  const xs: [number, number] = [60 - ex, 60 + ex];
  const col = c.glassesColor;
  const fr = `stroke="${col}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"`;
  const dark = c.glasses === 'sun' || c.glasses === 'heart';
  const lensFill = dark ? `fill="${col}" fill-opacity="0.88"` : 'fill="#ffffff" fill-opacity="0.16"';
  const lens = (cx: number, side: 1 | -1): string => {
    switch (c.glasses) {
      case 'round':
        return `<circle cx="${cx}" cy="62" r="10.4" ${lensFill} ${fr}/>`;
      case 'square':
        return `<rect x="${cx - 10.4}" y="53.6" width="20.8" height="17" rx="4.4" ${lensFill} ${fr}/>`;
      case 'cat': {
        // the outer corner (away from the nose) is lifted
        const o = side; // +1 right lens: outer is +x
        const p = (dx: number, y: number) => `${cx + o * dx} ${y}`;
        return `<path d="M${p(-10.4, 58.5)}Q${p(-8, 53.2)} ${p(1, 53.4)}L${p(11, 51.6)}Q${p(12.4, 61)} ${p(7.2, 67)}Q${p(0, 71)} ${p(-7.6, 67)}Q${p(-10.8, 63)} ${p(-10.4, 58.5)}Z" ${lensFill} ${fr}/>`;
      }
      case 'sun':
        return `<rect x="${cx - 10.6}" y="54" width="21.2" height="16" rx="6.5" ${lensFill} ${fr}/><path d="M${cx - 6.5} 58.6L${cx - 2.5} 56.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>`;
      default:
        return `<path d="M${cx} 70.4C${cx - 12.4} 62 ${cx - 10.6} 52.6 ${cx - 4.6} 52.6C${cx - 2} 52.6 ${cx} 54.4 ${cx} 56C${cx} 54.4 ${cx + 2} 52.6 ${cx + 4.6} 52.6C${cx + 10.6} 52.6 ${cx + 12.4} 62 ${cx} 70.4Z" ${lensFill} ${fr}/><path d="M${cx - 6.6} 57.4L${cx - 3.6} 55.8" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`;
    }
  };
  const shine = dark ? '' : `<path d="M${xs[0] - 5} 57.5L${xs[0] - 1.4} 55M${xs[1] - 5} 57.5L${xs[1] - 1.4} 55" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>`;
  const reach = c.glasses === 'square' || c.glasses === 'sun' ? 10.6 : 10.4;
  return (
    `<path d="M${xs[0] + reach} 60.6Q60 56.4 ${xs[1] - reach} 60.6" fill="none" ${fr}/>` +
    `<path d="M${xs[0] - reach} 59.6L30.6 58M${xs[1] + reach} 59.6L89.4 58" fill="none" ${fr}/>` +
    lens(xs[0], -1) +
    lens(xs[1], 1) +
    shine
  );
}

function star5(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.46;
    const a = -Math.PI / 2 + (Math.PI / 5) * i;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

function earringsSvg(x: Ctx): string {
  const { c } = x;
  if (c.earrings === 'none') return '';
  const col = c.earringColor;
  const dk = shade(col, -0.3);
  const one = (cx: number): string => {
    const y = 66.6;
    switch (c.earrings) {
      case 'studs':
        return `<circle cx="${cx}" cy="${y - 0.4}" r="2.3" fill="${col}" stroke="${dk}" stroke-width="0.9"/><circle cx="${cx - 0.7}" cy="${y - 1.1}" r="0.7" fill="#fff" opacity="0.8"/>`;
      case 'hoops':
        return `<circle cx="${cx}" cy="${y + 4.2}" r="4.4" fill="none" stroke="${dk}" stroke-width="2.6"/><circle cx="${cx}" cy="${y + 4.2}" r="4.4" fill="none" stroke="${col}" stroke-width="1.5"/>`;
      case 'drops':
        return `<circle cx="${cx}" cy="${y - 0.4}" r="1.6" fill="${col}" stroke="${dk}" stroke-width="0.8"/><path d="M${cx} ${y} L${cx} ${y + 3.6}" stroke="${dk}" stroke-width="1"/><path d="M${cx} ${y + 3.2}C${cx - 3.2} ${y + 6.4} ${cx - 2.4} ${y + 9.6} ${cx} ${y + 9.6}C${cx + 2.4} ${y + 9.6} ${cx + 3.2} ${y + 6.4} ${cx} ${y + 3.2}Z" fill="${col}" stroke="${dk}" stroke-width="0.9"/>`;
      default:
        return `<path d="${star5(cx, y + 2.2, 4.1)}" fill="${col}" stroke="${dk}" stroke-width="0.9" stroke-linejoin="round"/>`;
    }
  };
  const left = c.ears === 'small' ? 30.4 : 29.5;
  const right = c.ears === 'small' ? 89.6 : 90.5;
  return one(left) + one(right);
}

function hairAccSvg(x: Ctx): string {
  const { c, st } = x;
  const col = c.hairAccColor;
  const dk = shade(col, -0.18);
  switch (c.hairAcc) {
    case 'bow':
      return `<g transform="translate(85 30) rotate(14)"><path d="M0 0L-12 -7.6C-14 -2 -14 2 -12 7.6Z" fill="${col}" ${st}/><path d="M0 0L12 -7.6C14 -2 14 2 12 7.6Z" fill="${col}" ${st}/><circle r="3.2" fill="${dk}" ${st}/></g>`;
    case 'headband':
      return (x.flat ? '' : `<path d="M28.5 47C30 24 44 14.5 60 14.5C76 14.5 90 24 91.5 47" fill="none" stroke="${x.line}" stroke-width="7" stroke-linecap="round"/>`) + `<path d="M28.5 47C30 24 44 14.5 60 14.5C76 14.5 90 24 91.5 47" fill="none" stroke="${col}" stroke-width="${x.flat ? 5 : 4.2}" stroke-linecap="round"/>`;
    case 'clips':
      return `<g transform="translate(82 37) rotate(-26)"><rect x="-6.5" y="-1.9" width="13" height="3.8" rx="1.9" fill="${col}" ${st} stroke-width="1.4"/></g><g transform="translate(85.5 43.5) rotate(-26)"><rect x="-6.5" y="-1.9" width="13" height="3.8" rx="1.9" fill="${dk}" ${st} stroke-width="1.4"/></g>`;
    case 'flower': {
      const petals = [0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos(((a - 90) * Math.PI) / 180) * 4.6).toFixed(2)}" cy="${(Math.sin(((a - 90) * Math.PI) / 180) * 4.6).toFixed(2)}" r="3.5" fill="${col}" ${st} stroke-width="1.3"/>`).join('');
      return `<g transform="translate(84 31)">${petals}<circle r="2.5" fill="#ffe37a" ${st} stroke-width="1.2"/></g>`;
    }
    default:
      return '';
  }
}

// ---------------------------------------------------------------- body

const BODY_WIDTH = { slim: 0.84, average: 1, broad: 1.2, soft: 1.1 } as const;

function clothes(x: Ctx): { behind: string; body: string; front: string } {
  const { c, st } = x;
  const col = c.outfitColor;
  const cd = shade(col, -0.12);
  const bodyPath = `<path d="M12 121C12 102 31 94 52 93L68 93C89 94 108 102 108 121Z" fill="${col}" ${st}/>`;
  const neckline = `<path d="M47 93Q60 109 73 93Z" fill="${c.skin}" ${st}/>`;
  if (c.outfit === 'hoodie') {
    return {
      behind: `<path d="M28 100C20 80 34 70 60 70C86 70 100 80 92 100Z" fill="${cd}" ${st}/>`,
      body: bodyPath,
      front:
        neckline +
        `<path d="M53 101L51 114M67 101L69 114" fill="none" ${st} stroke-width="2.2"/><circle cx="51" cy="115" r="2.2" fill="#ffffff" ${st} stroke-width="1.6"/><circle cx="69" cy="115" r="2.2" fill="#ffffff" ${st} stroke-width="1.6"/>` +
        `<path d="M32 121L38 110L82 110L88 121" fill="none" stroke="${cd}" stroke-width="2.2" stroke-linejoin="round"/>`
    };
  }
  if (c.outfit === 'dress') {
    return {
      behind: '',
      body: bodyPath + `<ellipse cx="21" cy="106" rx="11" ry="9" fill="${col}" ${st}/><ellipse cx="99" cy="106" rx="11" ry="9" fill="${col}" ${st}/>`,
      front:
        neckline +
        `<path d="M47 93Q60 109 73 93" fill="none" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M60 104L52 98L52 110Z M60 104L68 98L68 110Z" fill="${cd}" ${st} stroke-width="2"/><circle cx="60" cy="104" r="2.6" fill="#ffffff" ${st} stroke-width="1.8"/>`
    };
  }
  return {
    behind: '',
    body: bodyPath,
    front:
      neckline +
      `<path d="M47 93Q60 109 73 93" fill="none" stroke="${cd}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M52 118a4 4 0 0 1 1-8a5.4 5.4 0 0 1 10-1.2a4 4 0 0 1 0 9.2z" fill="#ffffff" opacity="0.85"/>`
  };
}

// ---------------------------------------------------------------- the whole portrait

/** Everything inside the round picture (background, body, neck, head and accessories). */
export function portraitInner(c: AvatarConfig, uid: string): { defs: string; body: string } {
  const x = makeCtx(c, uid);
  const cl = clothes(x);
  const hw = c.headW / 100;
  const hh = c.headH / 100;
  const nl = c.neckLen;
  const nw = c.neckWidth;
  const headT = `translate(60 57) scale(${hw} ${hh}) translate(-60 -57)`;
  const bodyT = `translate(60 ${nl}) scale(${BODY_WIDTH[c.body]} 1) translate(-60 0)`;
  const bgTop = shade(c.background, 0.4);
  const chinY = 57 + 29.5 * hh;
  const shaded = x.anime || x.real;
  const faceFill = shaded ? `url(#face-${uid})` : c.skin;
  const defs =
    `<linearGradient id="bg-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${c.background}"/></linearGradient>` +
    (shaded ? `<radialGradient id="face-${uid}" cx="0.5" cy="0.42" r="0.62"><stop offset="0" stop-color="${shade(c.skin, 0.1)}"/><stop offset="0.7" stop-color="${c.skin}"/><stop offset="1" stop-color="${shade(c.skin, -0.09)}"/></radialGradient>` : '');
  const neckPath = `<path d="M${60 - nw} 72L${60 - nw} ${95 + nl}C${60 - nw} ${100 + nl} ${60 + nw} ${100 + nl} ${60 + nw} ${95 + nl}L${60 + nw} 72Z" fill="${c.skin}" ${x.st}/>`;
  const chinShadow = `<ellipse cx="60" cy="${(chinY - 0.5).toFixed(1)}" rx="9.5" ry="4" fill="${shade(c.skin, -0.22)}" opacity="${x.real ? 0.5 : 0.35}"/>`;
  const ex = 13 * (c.eyeGap / 100);
  const body =
    `<rect width="120" height="120" fill="url(#bg-${uid})"/>` +
    `<circle cx="22" cy="22" r="3" fill="#ffffff" opacity="0.7"/><circle cx="100" cy="30" r="2" fill="#ffffff" opacity="0.7"/>` +
    `<g transform="${headT}">${backHair(x)}</g>` +
    `<g transform="${bodyT}">${cl.behind}${cl.body}</g>` +
    neckPath +
    chinShadow +
    `<g transform="${bodyT}">${cl.front}</g>` +
    `<g transform="${headT}">` +
    ears(x) +
    `<path d="${headPath(c.chin)}" fill="${faceFill}" ${x.st}/>` +
    eye(x, 60 - ex, -1, 0) +
    eye(x, 60 + ex, 1, 1) +
    brows(x) +
    blush(x) +
    nose(x) +
    mouth(x) +
    frontHair(x) +
    hairAccSvg(x) +
    hatSvg(x) +
    glassesSvg(x) +
    earringsSvg(x) +
    `</g>`;
  return { defs, body };
}
