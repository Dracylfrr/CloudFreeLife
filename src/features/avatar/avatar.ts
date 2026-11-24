/**
 * The player's avatar: a small, drawn portrait that looks straight at the screen. The person starts
 * from a girl or boy look in one of four art styles, then changes the face, hair, body, clothes and
 * accessories freely. Everything here is plain data and rules (no DOM), so it is easy to test; the
 * drawing is in `draw.ts`, the frames in `frames.ts`, and the final picture in `render.ts`.
 *
 * Avatars saved by version 1.7.0 only had the first few fields. Every newer field falls back to a
 * default that draws exactly the same picture as before.
 */

export const STYLES = ['illus', 'chibi', 'anime', 'real', 'flat'] as const;
export type AvatarStyle = (typeof STYLES)[number];
export const STYLE_LABEL: Record<AvatarStyle, string> = { illus: 'Illustrated', chibi: 'Chibi', anime: 'Anime', real: 'Semi-realistic', flat: 'Storybook' };
/** The style a new avatar starts in. */
export const START_STYLE: AvatarStyle = 'illus';
export const STYLE_HINT: Record<AvatarStyle, string> = {
  illus: 'Painterly anime: glossy layered hair, big detailed eyes, soft shading and a brush-stroke background.',
  chibi: 'Big head, big shiny eyes and rounded ears: the cute starting look.',
  anime: 'A slimmer face and longer neck, with sharper, more detailed eyes.',
  real: 'Natural proportions with smaller eyes, soft shading and a lifelike face.',
  flat: 'Simple flat shapes with no outlines, like a picture book.'
};

export const HAIR_STYLES = ['short', 'messy', 'bob', 'long', 'pigtails', 'bun'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export const OUTFITS = ['tee', 'hoodie', 'dress'] as const;
export type Outfit = (typeof OUTFITS)[number];
export const BASES = ['girl', 'boy'] as const;
export type AvatarBase = (typeof BASES)[number];

export const CHINS = ['round', 'soft', 'pointed'] as const;
export type Chin = (typeof CHINS)[number];
export const EYE_SHAPES = ['round', 'almond', 'sleepy', 'cat', 'sparkle'] as const;
export type EyeShape = (typeof EYE_SHAPES)[number];
export const MOUTHS = ['smile', 'grin', 'calm', 'open'] as const;
export type Mouth = (typeof MOUTHS)[number];
export const EARS = ['round', 'small', 'pointed'] as const;
export type Ears = (typeof EARS)[number];
export const BODIES = ['slim', 'average', 'broad', 'soft'] as const;
export type Body = (typeof BODIES)[number];
export const HATS = ['none', 'cap', 'beanie', 'bucket'] as const;
export type Hat = (typeof HATS)[number];
export const GLASSES = ['none', 'round', 'square', 'cat', 'sun', 'heart'] as const;
export type Glasses = (typeof GLASSES)[number];
export const EARRINGS = ['none', 'studs', 'hoops', 'drops', 'stars'] as const;
export type Earrings = (typeof EARRINGS)[number];
export const HAIR_ACCS = ['none', 'bow', 'headband', 'clips', 'flower'] as const;
export type HairAcc = (typeof HAIR_ACCS)[number];

export interface AvatarConfig {
  /** Where the starting choices came from; everything can be changed afterwards. */
  base: AvatarBase;
  style: AvatarStyle;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  eyes: string;
  outfit: Outfit;
  outfitColor: string;
  background: string;
  // face and head (percent, 100 = the style's usual size)
  headW: number;
  headH: number;
  chin: Chin;
  eyeShape: EyeShape;
  eyeSize: number;
  eyeGap: number;
  mouth: Mouth;
  ears: Ears;
  // body
  body: Body;
  /** Extra neck length, 0 to 14 (in picture units). */
  neckLen: number;
  /** Half the neck's width, 6 to 11. */
  neckWidth: number;
  // accessories
  hat: Hat;
  hatColor: string;
  glasses: Glasses;
  glassesColor: string;
  earrings: Earrings;
  earringColor: string;
  hairAcc: HairAcc;
  hairAccColor: string;
}

export const HAIR_STYLE_LABEL: Record<HairStyle, string> = { short: 'Short', messy: 'Messy', bob: 'Bob', long: 'Long', pigtails: 'Pigtails', bun: 'Bun' };
export const OUTFIT_LABEL: Record<Outfit, string> = { tee: 'T-shirt', hoodie: 'Hoodie', dress: 'Dress' };
export const CHIN_LABEL: Record<Chin, string> = { round: 'Round', soft: 'Soft', pointed: 'Pointed' };
export const EYE_SHAPE_LABEL: Record<EyeShape, string> = { round: 'Round', almond: 'Almond', sleepy: 'Sleepy', cat: 'Cat', sparkle: 'Sparkle' };
export const MOUTH_LABEL: Record<Mouth, string> = { smile: 'Smile', grin: 'Grin', calm: 'Calm', open: 'Surprised' };
export const EARS_LABEL: Record<Ears, string> = { round: 'Rounded', small: 'Small', pointed: 'Pointed' };
export const BODY_LABEL: Record<Body, string> = { slim: 'Slim', average: 'Average', broad: 'Broad', soft: 'Soft' };
export const HAT_LABEL: Record<Hat, string> = { none: 'None', cap: 'Cap', beanie: 'Beanie', bucket: 'Bucket hat' };
export const GLASSES_LABEL: Record<Glasses, string> = { none: 'None', round: 'Round', square: 'Square', cat: 'Cat-eye', sun: 'Sunglasses', heart: 'Heart shades' };
export const EARRINGS_LABEL: Record<Earrings, string> = { none: 'None', studs: 'Studs', hoops: 'Hoops', drops: 'Drops', stars: 'Stars' };
export const HAIR_ACC_LABEL: Record<HairAcc, string> = { none: 'None', bow: 'Bow', headband: 'Headband', clips: 'Hair clips', flower: 'Flower' };

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
/** Colors for hats, glasses, earrings and hair accessories. */
export const ACCENT_COLORS: Swatch[] = [
  { color: '#3b3650', name: 'Black' },
  { color: '#ffffff', name: 'White' },
  { color: '#e8c04a', name: 'Gold' },
  { color: '#c9ced8', name: 'Silver' },
  { color: '#e3a08f', name: 'Rose gold' },
  { color: '#f4a0b5', name: 'Pink' },
  { color: '#d9879f', name: 'Berry' },
  { color: '#7fb4e0', name: 'Sky' },
  { color: '#3d6fb5', name: 'Navy' },
  { color: '#8fcfa6', name: 'Mint' },
  { color: '#b8a4ec', name: 'Violet' },
  { color: '#ffb36b', name: 'Orange' },
  { color: '#d7684f', name: 'Red' }
];

/** Slider limits. */
export const LIMITS = {
  headW: { min: 80, max: 120 },
  headH: { min: 80, max: 120 },
  eyeSize: { min: 55, max: 130 },
  eyeGap: { min: 85, max: 118 },
  neckLen: { min: 0, max: 14 },
  neckWidth: { min: 6, max: 11 }
} as const;

/** What each art style starts with. Choosing a style sets these; the sliders can then change them. */
export function styleDefaults(style: AvatarStyle): Pick<AvatarConfig, 'style' | 'headW' | 'headH' | 'chin' | 'eyeShape' | 'eyeSize' | 'eyeGap' | 'mouth' | 'ears' | 'neckLen' | 'neckWidth'> {
  const common = { mouth: 'smile' as Mouth, eyeGap: 100 };
  switch (style) {
    case 'illus':
      return { ...common, style, headW: 90, headH: 102, chin: 'soft', eyeShape: 'almond', eyeSize: 96, ears: 'round', neckLen: 6, neckWidth: 7.6 };
    case 'anime':
      return { ...common, style, headW: 91, headH: 101, chin: 'soft', eyeShape: 'almond', eyeSize: 88, ears: 'round', neckLen: 5, neckWidth: 7.8 };
    case 'real':
      return { ...common, style, headW: 85, headH: 97, chin: 'soft', eyeShape: 'almond', eyeSize: 62, ears: 'round', neckLen: 8, neckWidth: 7.4 };
    case 'flat':
      return { ...common, style, headW: 100, headH: 98, chin: 'round', eyeShape: 'round', eyeSize: 86, ears: 'round', neckLen: 2, neckWidth: 8 };
    default:
      return { ...common, style: 'chibi', headW: 100, headH: 100, chin: 'round', eyeShape: 'round', eyeSize: 100, ears: 'round', neckLen: 0, neckWidth: 8 };
  }
}

const NONE_ACCESSORIES = {
  hat: 'none' as Hat,
  hatColor: '#7fb4e0',
  glasses: 'none' as Glasses,
  glassesColor: '#3b3650',
  earrings: 'none' as Earrings,
  earringColor: '#e8c04a',
  hairAcc: 'none' as HairAcc,
  hairAccColor: '#f4a0b5'
};

/** The two starting points on the first screen. */
export const PRESETS: Record<AvatarBase, AvatarConfig> = {
  girl: { base: 'girl', skin: '#fbd3b8', hair: '#8a5a3c', hairStyle: 'long', eyes: '#3d6fb5', outfit: 'dress', outfitColor: '#ffd3e2', background: '#e6dcfa', ...styleDefaults('chibi'), body: 'average', ...NONE_ACCESSORIES },
  boy: { base: 'boy', skin: '#f3c09d', hair: '#5b3a29', hairStyle: 'short', eyes: '#3f8f6a', outfit: 'hoodie', outfitColor: '#7fb4e0', background: '#d9eefb', ...styleDefaults('chibi'), body: 'average', ...NONE_ACCESSORIES }
};

/** The starting look for a base in a given style. */
export function presetFor(base: AvatarBase, style: AvatarStyle = 'chibi'): AvatarConfig {
  return { ...PRESETS[base], ...styleDefaults(style) };
}

const HEX = /^#[0-9a-f]{6}$/i;
const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : fallback);
const color = (v: unknown, fallback: string): string => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fallback);
const num = (v: unknown, min: number, max: number, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v * 10) / 10)) : fallback);

/** Anything that is not a sensible saved avatar becomes "no avatar yet" (null). */
export function sanitizeAvatar(raw: unknown): AvatarConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const base = oneOf(BASES, r.base, 'girl');
  const style = oneOf(STYLES, r.style, 'chibi');
  const d = { ...PRESETS[base], ...styleDefaults(style) };
  return {
    base,
    style,
    skin: color(r.skin, d.skin),
    hair: color(r.hair, d.hair),
    hairStyle: oneOf(HAIR_STYLES, r.hairStyle, d.hairStyle),
    eyes: color(r.eyes, d.eyes),
    outfit: oneOf(OUTFITS, r.outfit, d.outfit),
    outfitColor: color(r.outfitColor, d.outfitColor),
    background: color(r.background, d.background),
    headW: num(r.headW, LIMITS.headW.min, LIMITS.headW.max, d.headW),
    headH: num(r.headH, LIMITS.headH.min, LIMITS.headH.max, d.headH),
    chin: oneOf(CHINS, r.chin, d.chin),
    eyeShape: oneOf(EYE_SHAPES, r.eyeShape, d.eyeShape),
    eyeSize: num(r.eyeSize, LIMITS.eyeSize.min, LIMITS.eyeSize.max, d.eyeSize),
    eyeGap: num(r.eyeGap, LIMITS.eyeGap.min, LIMITS.eyeGap.max, d.eyeGap),
    mouth: oneOf(MOUTHS, r.mouth, d.mouth),
    ears: oneOf(EARS, r.ears, d.ears),
    body: oneOf(BODIES, r.body, d.body),
    neckLen: num(r.neckLen, LIMITS.neckLen.min, LIMITS.neckLen.max, d.neckLen),
    neckWidth: num(r.neckWidth, LIMITS.neckWidth.min, LIMITS.neckWidth.max, d.neckWidth),
    hat: oneOf(HATS, r.hat, d.hat),
    hatColor: color(r.hatColor, d.hatColor),
    glasses: oneOf(GLASSES, r.glasses, d.glasses),
    glassesColor: color(r.glassesColor, d.glassesColor),
    earrings: oneOf(EARRINGS, r.earrings, d.earrings),
    earringColor: color(r.earringColor, d.earringColor),
    hairAcc: oneOf(HAIR_ACCS, r.hairAcc, d.hairAcc),
    hairAccColor: color(r.hairAccColor, d.hairAccColor)
  };
}

/** True when two avatars are the same look (the order the fields were saved in does not matter). */
export function sameAvatar(a: AvatarConfig | null, b: AvatarConfig | null): boolean {
  if (!a || !b) return a === b;
  const ka = Object.keys(a).sort() as (keyof AvatarConfig)[];
  const kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
}

// ---------------------------------------------------------------- saved looks

export const MAX_LOOKS = 12;
export const MAX_LOOK_NAME = 24;
export interface SavedLook {
  id: string;
  name: string;
  avatar: AvatarConfig;
  /** The frame that went with it. */
  frame: string;
}

export function cleanLookName(v: unknown, fallback = 'My look'): string {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, MAX_LOOK_NAME) : '';
  return s || fallback;
}

/** Reads the saved looks list from settings: bad entries are dropped, and so are repeated ids. */
export function sanitizeLooks(raw: unknown, isFrame: (id: string) => boolean): SavedLook[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: SavedLook[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const id = typeof r.id === 'string' && /^[a-z0-9]{3,24}$/i.test(r.id) ? r.id : null;
    const avatar = sanitizeAvatar(r.avatar);
    if (!id || !avatar || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: cleanLookName(r.name), avatar, frame: typeof r.frame === 'string' && isFrame(r.frame) ? r.frame : 'none' });
    if (out.length >= MAX_LOOKS) break;
  }
  return out;
}

// ---------------------------------------------------------------- colors

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
/** Mixes a color toward black (amount < 0) or white (amount > 0). */
export function shade(hex: string, amount: number): string {
  const to = amount < 0 ? 0 : 255;
  const t = Math.min(1, Math.abs(amount));
  const out = [0, 1, 2].map((i) => Math.round(channel(hex, i) + (to - channel(hex, i)) * t));
  return '#' + out.map((n) => n.toString(16).padStart(2, '0')).join('');
}
/** Blends two colors: 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const out = [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * k));
  return '#' + out.map((n) => n.toString(16).padStart(2, '0')).join('');
}
