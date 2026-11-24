/**
 * The player's avatar: a young, round-faced portrait that looks straight at the screen, drawn as
 * a small SVG so it needs no files and is easy to change. The person chooses a girl or boy to start
 * from, then changes the hair, eyes, skin, clothes and background freely. Everything here is pure
 * (no DOM), so it is easy to test.
 */

export const HAIR_STYLES = ['short', 'messy', 'bob', 'long', 'pigtails', 'bun'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const OUTFITS = ['tee', 'hoodie', 'dress'] as const;
export type Outfit = (typeof OUTFITS)[number];

export const BASES = ['girl', 'boy'] as const;
export type AvatarBase = (typeof BASES)[number];

export interface AvatarConfig {
  /** Only decides where the starting choices came from; everything can be changed afterwards. */
  base: AvatarBase;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  eyes: string;
  outfit: Outfit;
  outfitColor: string;
  background: string;
}

export const HAIR_STYLE_LABEL: Record<HairStyle, string> = {
  short: 'Short',
  messy: 'Messy',
  bob: 'Bob',
  long: 'Long',
  pigtails: 'Pigtails',
  bun: 'Bun'
};
export const OUTFIT_LABEL: Record<Outfit, string> = { tee: 'T-shirt', hoodie: 'Hoodie', dress: 'Dress' };

export interface Swatch {
  color: string;
  name: string;
}
export const SKIN_TONES: Swatch[] = [
  { color: '#ffe3d2', name: 'Porcelain' },
  { color: '#fbd3b8', name: 'Peach' },
  { color: '#f3c09d', name: 'Sand' },
  { color: '#e0a97f', name: 'Honey' },
  { color: '#c68a5f', name: 'Caramel' },
  { color: '#a86e49', name: 'Cinnamon' },
  { color: '#8a5636', name: 'Chestnut' },
  { color: '#6b3f28', name: 'Cocoa' }
];
export const HAIR_COLORS: Swatch[] = [
  { color: '#2f2a3a', name: 'Ink' },
  { color: '#5b3a29', name: 'Chocolate' },
  { color: '#8a5a3c', name: 'Chestnut' },
  { color: '#c9904f', name: 'Honey' },
  { color: '#e8c76a', name: 'Blonde' },
  { color: '#d7684f', name: 'Ginger' },
  { color: '#d9879f', name: 'Rose' },
  { color: '#9a88dc', name: 'Lavender' },
  { color: '#6aa6dc', name: 'Sky' },
  { color: '#7cc7a3', name: 'Mint' },
  { color: '#e6e2f0', name: 'Silver' }
];
export const EYE_COLORS: Swatch[] = [
  { color: '#6b4430', name: 'Brown' },
  { color: '#3d6fb5', name: 'Blue' },
  { color: '#3f8f6a', name: 'Green' },
  { color: '#8a6fd0', name: 'Violet' },
  { color: '#d0728a', name: 'Rose' },
  { color: '#d9973a', name: 'Amber' },
  { color: '#4fb0c4', name: 'Teal' },
  { color: '#5b5678', name: 'Slate' }
];
export const OUTFIT_COLORS: Swatch[] = [
  { color: '#ffd3e2', name: 'Blossom' },
  { color: '#bfe4f7', name: 'Cloud' },
  { color: '#c6ecda', name: 'Mint' },
  { color: '#fff2bd', name: 'Butter' },
  { color: '#d9cdf6', name: 'Lilac' },
  { color: '#ffdcc8', name: 'Peach' },
  { color: '#f4a0b5', name: 'Rose' },
  { color: '#7fb4e0', name: 'Sky' },
  { color: '#8fcfa6', name: 'Meadow' },
  { color: '#b8a4ec', name: 'Violet' }
];
export const BACKGROUNDS: Swatch[] = [
  { color: '#d9eefb', name: 'Morning' },
  { color: '#e6dcfa', name: 'Dusk' },
  { color: '#fde3ee', name: 'Blossom' },
  { color: '#dcf4e8', name: 'Meadow' },
  { color: '#fff2d6', name: 'Sunbeam' },
  { color: '#e2e6f6', name: 'Moonlight' }
];

/** The two starting points on the first screen. */
export const PRESETS: Record<AvatarBase, AvatarConfig> = {
  girl: { base: 'girl', skin: '#fbd3b8', hair: '#8a5a3c', hairStyle: 'long', eyes: '#3d6fb5', outfit: 'dress', outfitColor: '#ffd3e2', background: '#e6dcfa' },
  boy: { base: 'boy', skin: '#f3c09d', hair: '#5b3a29', hairStyle: 'short', eyes: '#3f8f6a', outfit: 'hoodie', outfitColor: '#7fb4e0', background: '#d9eefb' }
};

const HEX = /^#[0-9a-f]{6}$/i;
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback);
const color = (v: unknown, fallback: string): string => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fallback);

/** Anything that is not a sensible saved avatar becomes "no avatar yet" (null). */
export function sanitizeAvatar(raw: unknown): AvatarConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const base = oneOf(BASES, r.base, 'girl');
  const d = PRESETS[base];
  return {
    base,
    skin: color(r.skin, d.skin),
    hair: color(r.hair, d.hair),
    hairStyle: oneOf(HAIR_STYLES, r.hairStyle, d.hairStyle),
    eyes: color(r.eyes, d.eyes),
    outfit: oneOf(OUTFITS, r.outfit, d.outfit),
    outfitColor: color(r.outfitColor, d.outfitColor),
    background: color(r.background, d.background)
  };
}

export function sameAvatar(a: AvatarConfig | null, b: AvatarConfig | null): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------- drawing

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
/** Mixes a color toward black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const to = amount < 0 ? 0 : 255;
  const t = Math.min(1, Math.abs(amount));
  const out = [0, 1, 2].map((i) => Math.round(channel(hex, i) + (to - channel(hex, i)) * t));
  return '#' + out.map((n) => n.toString(16).padStart(2, '0')).join('');
}

const LINE = '#5b5678';

function backHair(a: AvatarConfig): string {
  const f = `fill="${a.hair}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"`;
  switch (a.hairStyle) {
    case 'long':
      return `<path d="M26 58C21 86 27 106 40 112L80 112C93 106 99 86 94 58C94 29 78 19 60 19C42 19 26 29 26 58Z" ${f}/>`;
    case 'bob':
      return `<path d="M27 58C25 80 29 91 38 94L82 94C91 91 95 80 93 58C93 30 78 20 60 20C42 20 27 30 27 58Z" ${f}/>`;
    case 'pigtails':
      return `<path d="M34 42C15 48 9 80 18 99C31 95 39 78 39 58Z" ${f}/><path d="M86 42C105 48 111 80 102 99C89 95 81 78 81 58Z" ${f}/>`;
    case 'bun':
      return `<circle cx="60" cy="16" r="12" ${f}/><path d="M52 14Q60 10 68 14" fill="none" stroke="${shade(a.hair, 0.3)}" stroke-width="2.4" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

function frontHair(a: AvatarConfig): string {
  const f = `fill="${a.hair}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"`;
  const hi = `fill="none" stroke="${shade(a.hair, 0.32)}" stroke-width="3" stroke-linecap="round" opacity="0.75"`;
  const fringe = `<path d="M28 58C25 33 42 21 60 21C78 21 95 33 92 58C90 49 86 44 80 41C74 47 66 47 60 40C54 47 46 47 40 41C34 44 30 49 28 58Z" ${f}/><path d="M42 30Q60 22 78 30" ${hi}/>`;
  const spiky = `<path d="M27 60C21 40 30 28 38 25L36 15L47 22L52 11L60 21L68 11L73 22L84 15L82 25C90 28 99 40 93 60C91 51 87 45 81 42C75 47 66 46 60 40C54 46 45 47 39 42C33 45 29 51 27 60Z" ${f}/><path d="M44 31Q60 25 76 31" ${hi}/>`;
  const side = (to: number) =>
    `<path d="M28 54C26 68 27 ${to - 12} 32 ${to}L38 ${to - 3}C35.5 ${to - 16} 35.5 66 37.5 52Z" ${f}/><path d="M92 54C94 68 93 ${to - 12} 88 ${to}L82 ${to - 3}C84.5 ${to - 16} 84.5 66 82.5 52Z" ${f}/>`;
  switch (a.hairStyle) {
    case 'messy':
      return spiky;
    case 'bob':
      return fringe + side(90);
    case 'long':
      return fringe + side(106);
    case 'pigtails':
      return fringe + side(72) + `<circle cx="32.5" cy="45" r="4.4" fill="${a.outfitColor}" stroke="${LINE}" stroke-width="2"/><circle cx="87.5" cy="45" r="4.4" fill="${a.outfitColor}" stroke="${LINE}" stroke-width="2"/>`;
    case 'bun':
      return fringe + side(72) + `<circle cx="60" cy="25" r="3.6" fill="${a.outfitColor}" stroke="${LINE}" stroke-width="2"/>`;
    default:
      return fringe;
  }
}

function clothes(a: AvatarConfig): { behind: string; body: string; front: string } {
  const c = a.outfitColor;
  const cd = shade(c, -0.12);
  const st = `stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
  const bodyPath = `<path d="M12 121C12 102 31 94 52 93L68 93C89 94 108 102 108 121Z" fill="${c}" ${st}/>`;
  const neckline = `<path d="M47 93Q60 109 73 93Z" fill="${a.skin}" ${st}/>`;
  if (a.outfit === 'hoodie') {
    return {
      behind: `<path d="M28 100C20 80 34 70 60 70C86 70 100 80 92 100Z" fill="${cd}" ${st}/>`,
      body: bodyPath,
      front:
        neckline +
        `<path d="M53 101L51 114M67 101L69 114" fill="none" ${st} stroke-width="2.2"/><circle cx="51" cy="115" r="2.2" fill="#ffffff" stroke="${LINE}" stroke-width="1.6"/><circle cx="69" cy="115" r="2.2" fill="#ffffff" stroke="${LINE}" stroke-width="1.6"/>` +
        `<path d="M32 121L38 110L82 110L88 121" fill="none" stroke="${cd}" stroke-width="2.2" stroke-linejoin="round"/>`
    };
  }
  if (a.outfit === 'dress') {
    return {
      behind: '',
      body:
        bodyPath +
        `<ellipse cx="21" cy="106" rx="11" ry="9" fill="${c}" ${st}/><ellipse cx="99" cy="106" rx="11" ry="9" fill="${c}" ${st}/>`,
      front:
        neckline +
        `<path d="M47 93Q60 109 73 93" fill="none" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M60 104L52 98L52 110Z M60 104L68 98L68 110Z" fill="${cd}" ${st} stroke-width="2"/><circle cx="60" cy="104" r="2.6" fill="#ffffff" stroke="${LINE}" stroke-width="1.8"/>`
    };
  }
  // t-shirt: a round neckline and a tiny cloud print
  return {
    behind: '',
    body: bodyPath,
    front:
      neckline +
      `<path d="M47 93Q60 109 73 93" fill="none" stroke="${cd}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M52 118a4 4 0 0 1 1-8a5.4 5.4 0 0 1 10-1.2a4 4 0 0 1 0 9.2z" fill="#ffffff" opacity="0.85"/>`
  };
}

function face(a: AvatarConfig): string {
  const brow = shade(a.hair, 0.05);
  const eye = (x: number) =>
    `<g transform="translate(${x} 62)">` +
    `<ellipse rx="6.9" ry="8.3" fill="#ffffff" stroke="${LINE}" stroke-width="1.3"/>` +
    `<ellipse cy="0.6" rx="5.7" ry="7.2" fill="${a.eyes}"/>` +
    `<ellipse cy="1.6" rx="3.1" ry="4.4" fill="${shade(a.eyes, -0.6)}"/>` +
    `<ellipse cy="4" rx="4.2" ry="2.6" fill="${shade(a.eyes, 0.35)}" opacity="0.55"/>` +
    `<circle cx="-2.2" cy="-2.8" r="2.3" fill="#ffffff"/><circle cx="2.4" cy="3" r="1.1" fill="#ffffff" opacity="0.85"/>` +
    `<path d="M-7.6 -3.6Q0 -11.6 7.6 -3.6" fill="none" stroke="${LINE}" stroke-width="2.7" stroke-linecap="round"/></g>`;
  return (
    eye(47) +
    eye(73) +
    `<path d="M41.5 49.2Q47 46 52.5 48.2M67.5 48.2Q73 46 78.5 49.2" fill="none" stroke="${brow}" stroke-width="1.7" stroke-linecap="round" opacity="0.85"/>` +
    `<ellipse cx="37.5" cy="72" rx="5.8" ry="3.4" fill="#ff9fb4" opacity="0.5"/><ellipse cx="82.5" cy="72" rx="5.8" ry="3.4" fill="#ff9fb4" opacity="0.5"/>` +
    `<path d="M59 69.2Q60 70.8 61 69.2" fill="none" stroke="${shade(a.skin, -0.3)}" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M54.5 74.2Q60 80 65.5 74.2" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>`
  );
}

/** The whole portrait as an SVG string. `uid` keeps the ids unique when several are on screen. */
export function avatarSvg(a: AvatarConfig, uid = 'a'): string {
  const cl = clothes(a);
  const bgTop = shade(a.background, 0.4);
  const st = `stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Your avatar">` +
    `<defs><clipPath id="clip-${uid}"><circle cx="60" cy="60" r="59"/></clipPath>` +
    `<linearGradient id="bg-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${a.background}"/></linearGradient></defs>` +
    `<g clip-path="url(#clip-${uid})"><rect width="120" height="120" fill="url(#bg-${uid})"/>` +
    `<circle cx="22" cy="22" r="3" fill="#ffffff" opacity="0.7"/><circle cx="100" cy="30" r="2" fill="#ffffff" opacity="0.7"/>` +
    backHair(a) +
    cl.behind +
    cl.body +
    `<path d="M52 78L52 95C52 100 68 100 68 95L68 78Z" fill="${a.skin}" ${st}/>` +
    `<ellipse cx="60" cy="86" rx="9" ry="4" fill="${shade(a.skin, -0.22)}" opacity="0.35"/>` +
    cl.front +
    `<ellipse cx="29.5" cy="61" rx="4.6" ry="6.2" fill="${a.skin}" ${st}/><ellipse cx="90.5" cy="61" rx="4.6" ry="6.2" fill="${a.skin}" ${st}/>` +
    `<ellipse cx="60" cy="57" rx="31" ry="29.5" fill="${a.skin}" ${st}/>` +
    face(a) +
    frontHair(a) +
    `</g><circle cx="60" cy="60" r="58.8" fill="none" stroke="${LINE}" stroke-width="2.4" opacity="0.45"/></svg>`
  );
}
