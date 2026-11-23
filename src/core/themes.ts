// Visual themes. Each theme is plain data: a set of CSS custom properties applied to the
// document root. Components only ever use the tokens (see app.css), so a new theme needs no
// component changes. A user's paintings are never affected: artwork is drawn on its own
// paper, not with these tokens.
import { get, writable } from 'svelte/store';

export type ThemeId =
  | 'cloud_morning'
  | 'lavender_dream'
  | 'peach_sunset'
  | 'mint_breeze'
  | 'blossom_rain'
  | 'candle_glow'
  | 'moonlight'
  | 'ocean_mist';

/** Stored in settings: a theme id, or 'system' to follow the operating system's light/dark choice. */
export type ThemeChoice = string;

export interface Theme {
  id: string;
  name: string;
  blurb: string;
  dark: boolean;
  /** Four swatches for the picker preview: background, panel, accent, accent 2. */
  swatch: [string, string, string, string];
  vars: Record<string, string>;
}

export type Spec = {
  id: string;
  name: string;
  blurb: string;
  dark?: boolean;
  bg: [string, string, string];
  amb: [string, string, string, string];
  panelSolid: string;
  panel: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  accent: string; // lavender-deep slot
  accentSoft: string; // lavender slot
  sky: string;
  skyDeep: string;
  g: [string, string];
  gInk: string;
  nav: [string, string, string]; // a, b, ink
  brand: [string, string];
  hero: [string, string, string];
  focus: string;
  w: string;
  shadow: string; // r, g, b
  cloud: string;
  bubbles: [string, string, string, string, string];
  track: string;
  tags?: Partial<Record<string, string>>;
};

const LIGHT_TAGS = {
  '--mint': '#c6ecda',
  '--pink': '#ffd3e2',
  '--peach': '#ffdcc8',
  '--butter': '#fff2bd',
  '--turquoise': '#bdeeea',
  '--c-green': '#2e5a4b',
  '--c-green2': '#3f8a6a',
  '--c-green-bg': '#eaf7f0',
  '--c-blue': '#2f5c80',
  '--c-peach': '#8a4f3a',
  '--c-pink': '#8a3f63',
  '--c-violet': '#5a4a98',
  '--c-gold': '#7a6420',
  '--c-gold-bg': '#fff2bd',
  '--c-rose': '#9a4560',
  '--c-rose-bg': '#ffe3e8'
};
const DARK_TAGS = {
  '--mint': 'rgba(120, 210, 170, 0.22)',
  '--pink': 'rgba(240, 140, 180, 0.24)',
  '--peach': 'rgba(245, 170, 130, 0.24)',
  '--butter': 'rgba(240, 215, 120, 0.22)',
  '--turquoise': 'rgba(110, 215, 210, 0.22)',
  '--c-green': '#a6e6c8',
  '--c-green2': '#8fdcb8',
  '--c-green-bg': 'rgba(120, 210, 170, 0.16)',
  '--c-blue': '#b0d6f5',
  '--c-peach': '#f5c4ae',
  '--c-pink': '#f5b8d2',
  '--c-violet': '#cfc5fa',
  '--c-gold': '#f2dd92',
  '--c-gold-bg': 'rgba(240, 215, 120, 0.16)',
  '--c-rose': '#f6b4c6',
  '--c-rose-bg': 'rgba(240, 130, 160, 0.18)'
};

export function makeTheme(s: Spec): Theme {
  const dark = !!s.dark;
  const vars: Record<string, string> = {
    '--bg-a': s.bg[0],
    '--bg-b': s.bg[1],
    '--bg-c': s.bg[2],
    '--amb1': s.amb[0],
    '--amb2': s.amb[1],
    '--amb3': s.amb[2],
    '--amb4': s.amb[3],
    '--glow2': dark ? 'rgba(140, 120, 220, 0.18)' : `${s.amb[2]}aa`,
    '--panel-solid': s.panelSolid,
    '--panel': s.panel,
    '--panel-strong': dark ? 'rgba(46, 50, 90, 0.94)' : 'rgba(255, 255, 255, 0.92)',
    '--surface': s.panelSolid,
    '--ink': s.ink,
    '--ink-soft': s.inkSoft,
    '--ink-faint': s.inkFaint,
    '--line': dark ? 'rgba(190, 185, 255, 0.2)' : `rgba(${s.shadow}, 0.17)`,
    '--lavender': s.accentSoft,
    '--lavender-deep': s.accent,
    '--lilac': s.accentSoft,
    '--sky': s.sky,
    '--sky-deep': s.skyDeep,
    '--g1': s.g[0],
    '--g2': s.g[1],
    '--g-ink': s.gInk,
    '--track': s.track,
    '--nav-a': s.nav[0],
    '--nav-b': s.nav[1],
    '--nav-ink': s.nav[2],
    '--brand-a': s.brand[0],
    '--brand-b': s.brand[1],
    '--hero-a': s.hero[0],
    '--hero-b': s.hero[1],
    '--hero-c': s.hero[2],
    '--focus': s.focus,
    '--w': s.w,
    '--shadow-s': `0 2px 8px rgba(${s.shadow}, ${dark ? 0.32 : 0.12})`,
    '--shadow-m': `0 8px 24px rgba(${s.shadow}, ${dark ? 0.38 : 0.16})`,
    '--shadow-l': `0 18px 50px rgba(${s.shadow}, ${dark ? 0.45 : 0.2})`,
    '--cloud': s.cloud,
    '--spark': dark ? '#e7e2ff' : '#fffbe0',
    '--bt0': s.bubbles[0],
    '--bt1': s.bubbles[1],
    '--bt2': s.bubbles[2],
    '--bt3': s.bubbles[3],
    '--bt4': s.bubbles[4],
    '--scroll': dark ? 'rgba(180, 175, 240, 0.35)' : `rgba(${s.shadow}, 0.35)`,
    ...(dark ? DARK_TAGS : LIGHT_TAGS),
    ...s.tags
  };
  return { id: s.id, name: s.name, blurb: s.blurb, dark, swatch: [s.bg[0], s.panelSolid, s.accent, s.g[0]], vars };
}

const make = makeTheme;

export const THEMES: Theme[] = [
  make({
    id: 'cloud_morning',
    name: 'Cloud Morning',
    blurb: 'Soft blue, white and cream.',
    bg: ['#e4f2fc', '#ece6fb', '#fdeaf1'],
    amb: ['#d3ebfa', '#eadffb', '#fde3ee', '#dcf4e8'],
    panelSolid: '#fdfcff',
    panel: 'rgba(255, 255, 255, 0.74)',
    ink: '#4a4768',
    inkSoft: '#6c6990',
    inkFaint: '#a8a6c1',
    accent: '#a698e0',
    accentSoft: '#d9cdf6',
    sky: '#bfe4f7',
    skyDeep: '#86c3ea',
    g: ['#9fd3f2', '#b7a8ec'],
    gInk: '#35316a',
    nav: ['#d9eefb', '#e6dcfa', '#4c3f9c'],
    brand: ['#6fb4e6', '#9b86df'],
    hero: ['#5f8fd1', '#9d84e0', '#e48fb4'],
    focus: '#7f6fd6',
    w: '255 255 255',
    shadow: '120, 105, 175',
    cloud: '#ffffff',
    bubbles: ['#bfe4f7', '#e6d8f8', '#c6ecda', '#ffd3e2', '#fff2bd'],
    track: '#e3dff3'
  }),
  make({
    id: 'lavender_dream',
    name: 'Lavender Dream',
    blurb: 'Lavender, lilac and soft pink.',
    bg: ['#efe8fc', '#f3e9fb', '#fde8f3'],
    amb: ['#e3d6f8', '#f1def8', '#fddbe9', '#e6e0fb'],
    panelSolid: '#fcfaff',
    panel: 'rgba(255, 255, 255, 0.74)',
    ink: '#463a6a',
    inkSoft: '#6a5e92',
    inkFaint: '#aaa0c6',
    accent: '#9a82d8',
    accentSoft: '#e0d2f7',
    sky: '#d8cdf3',
    skyDeep: '#a995e0',
    g: ['#cdbaf1', '#f0b6d6'],
    gInk: '#3b2f68',
    nav: ['#e7dcfa', '#f8dcec', '#503e9c'],
    brand: ['#9a82d8', '#d885b8'],
    hero: ['#8e72d6', '#b57fd8', '#ee8fb8'],
    focus: '#7a5fd0',
    w: '255 255 255',
    shadow: '130, 100, 180',
    cloud: '#fffaff',
    bubbles: ['#d8cdf3', '#f3d4e8', '#e2d4f8', '#ffd3e2', '#efe2fb'],
    track: '#e6dcf3'
  }),
  make({
    id: 'peach_sunset',
    name: 'Peach Sunset',
    blurb: 'Peach, pale orange, cream and rose.',
    bg: ['#fff0e2', '#ffe8dc', '#ffe4e8'],
    amb: ['#ffe3c9', '#ffdcd0', '#ffd8e0', '#fff0c8'],
    panelSolid: '#fffcf8',
    panel: 'rgba(255, 255, 255, 0.72)',
    ink: '#5c403f',
    inkSoft: '#82605a',
    inkFaint: '#c0a49c',
    accent: '#ec9a7c',
    accentSoft: '#ffdcc8',
    sky: '#ffd9bf',
    skyDeep: '#f4ae8c',
    g: ['#ffc9a6', '#f6aab6'],
    gInk: '#5a2f33',
    nav: ['#ffe4d0', '#fdd9e0', '#8a4030'],
    brand: ['#ee9468', '#d9708f'],
    hero: ['#e8845f', '#e0708f', '#f2a45f'],
    focus: '#cf6a4c',
    w: '255 255 255',
    shadow: '190, 120, 100',
    cloud: '#fffaf5',
    bubbles: ['#ffd9bf', '#ffd3e2', '#fff0c2', '#ffcfb5', '#ffe6d6'],
    track: '#f6e3da',
    tags: { '--c-blue': '#2f5c80' }
  }),
  make({
    id: 'mint_breeze',
    name: 'Mint Breeze',
    blurb: 'Mint, sage and pale turquoise.',
    bg: ['#e2f5ec', '#e6f3ee', '#e7f5f5'],
    amb: ['#d2f0e2', '#dcefe6', '#d4f1f0', '#e8f4dc'],
    panelSolid: '#fbfffd',
    panel: 'rgba(255, 255, 255, 0.74)',
    ink: '#34504a',
    inkSoft: '#54746b',
    inkFaint: '#9dbab0',
    accent: '#66b896',
    accentSoft: '#cdeedd',
    sky: '#c3ebe2',
    skyDeep: '#7ccdbd',
    g: ['#a9e3cc', '#9ad8dc'],
    gInk: '#22463d',
    nav: ['#d3f1e4', '#d6eff0', '#2a6552'],
    brand: ['#58b896', '#4fb0c0'],
    hero: ['#4fa88a', '#55b0b8', '#8bc98f'],
    focus: '#2f9a78',
    w: '255 255 255',
    shadow: '90, 150, 130',
    cloud: '#fbfffd',
    bubbles: ['#c3ebe2', '#d8f1c8', '#c9ecf0', '#e6f5d8', '#bfe8d4'],
    track: '#d9ebe3'
  }),
  make({
    id: 'blossom_rain',
    name: 'Blossom Rain',
    blurb: 'Soft pink, lavender and cool blue.',
    bg: ['#fde6ef', '#f0e6fa', '#e2edfa'],
    amb: ['#fcd9e8', '#e8dcf8', '#d6e6fa', '#f6dcee'],
    panelSolid: '#fffbfd',
    panel: 'rgba(255, 255, 255, 0.74)',
    ink: '#523f5e',
    inkSoft: '#755f86',
    inkFaint: '#b8a6c4',
    accent: '#e08ab4',
    accentSoft: '#f6d4e6',
    sky: '#cbdaf5',
    skyDeep: '#94b0e6',
    g: ['#f5b7d3', '#b7c2f0'],
    gInk: '#4a2f5c',
    nav: ['#fbdcea', '#dfe3fa', '#8a3f78'],
    brand: ['#e583b0', '#8f9fe2'],
    hero: ['#dd7aa8', '#a58ad8', '#7f9fe0'],
    focus: '#b865a0',
    w: '255 255 255',
    shadow: '170, 110, 160',
    cloud: '#fffafd',
    bubbles: ['#ffd3e2', '#cbdaf5', '#e6d8f8', '#f6d4e6', '#d6e6fa'],
    track: '#efdfe9'
  }),
  make({
    id: 'candle_glow',
    name: 'Candle Glow',
    blurb: 'Warm cream, soft gold and peach.',
    bg: ['#fff5df', '#fdeccf', '#ffe7d3'],
    amb: ['#ffefc7', '#fde2c0', '#ffd9c2', '#fff3cf'],
    panelSolid: '#fffcf3',
    panel: 'rgba(255, 252, 240, 0.78)',
    ink: '#574129',
    inkSoft: '#7a6040',
    inkFaint: '#bfa883',
    accent: '#dfa84f',
    accentSoft: '#fbe3b0',
    sky: '#fbe6b8',
    skyDeep: '#efc477',
    g: ['#fbdb94', '#f6b99a'],
    gInk: '#523314',
    nav: ['#fbe8bf', '#fadcc4', '#7d5416'],
    brand: ['#e3a444', '#e08662'],
    hero: ['#dc9a3a', '#e5845d', '#e8b05a'],
    focus: '#c28126',
    w: '255 252 240',
    shadow: '175, 130, 70',
    cloud: '#fffbef',
    bubbles: ['#fbe6b8', '#ffd9c2', '#fff0c2', '#f8d6a4', '#ffe6cf'],
    track: '#f1e5ca',
    tags: { '--c-gold': '#6e5416' }
  }),
  make({
    id: 'moonlight',
    name: 'Moonlight',
    blurb: 'Soft blue-lavender for evenings.',
    dark: true,
    bg: ['#20244a', '#272a52', '#2d2b55'],
    amb: ['#2c3566', '#33305f', '#3a2f5a', '#263a5c'],
    panelSolid: '#2a2e55',
    panel: 'rgba(44, 48, 88, 0.8)',
    ink: '#ebe9fb',
    inkSoft: '#b9b6dc',
    inkFaint: '#8c89b3',
    accent: '#a99cf0',
    accentSoft: '#4a4682',
    sky: '#3c4a86',
    skyDeep: '#7d92e0',
    g: ['#5565b8', '#7a68c4'],
    gInk: '#ffffff',
    nav: ['#3a4280', '#4b3f86', '#e2dcff'],
    brand: ['#9bb4f5', '#b9a6f5'],
    hero: ['#9ab6f6', '#b9a2f4', '#f2a7cd'],
    focus: '#c0b4ff',
    w: '74 80 140',
    shadow: '8, 10, 32',
    cloud: '#8f93d0',
    bubbles: ['#6b7cc4', '#8a78c8', '#5f9ab8', '#b47fb0', '#a8a0d8'],
    track: '#40447a'
  }),
  make({
    id: 'ocean_mist',
    name: 'Ocean Mist',
    blurb: 'Pale blue, seafoam and soft turquoise.',
    bg: ['#dff1f7', '#e0f2f2', '#e7f0fa'],
    amb: ['#cdeaf4', '#d2f0ee', '#dbe8f8', '#d9f2e6'],
    panelSolid: '#fafeff',
    panel: 'rgba(255, 255, 255, 0.74)',
    ink: '#2f4d5c',
    inkSoft: '#4f7183',
    inkFaint: '#9ab8c6',
    accent: '#58b2c4',
    accentSoft: '#c8ebf1',
    sky: '#c1e6f2',
    skyDeep: '#6cc0d6',
    g: ['#a3dcec', '#9fe0d0'],
    gInk: '#1f4552',
    nav: ['#cfeaf4', '#d0f0ea', '#24627a'],
    brand: ['#4fb0d0', '#4ec2ae'],
    hero: ['#4a9fcb', '#4fb8c0', '#7fd0b4'],
    focus: '#2b95b2',
    w: '255 255 255',
    shadow: '80, 140, 165',
    cloud: '#fbffff',
    bubbles: ['#c1e6f2', '#c8f0e4', '#d6e6f8', '#bfeee8', '#e0f2dd'],
    track: '#d6e8ee'
  })
];

export const DEFAULT_THEME: ThemeId = 'cloud_morning';
export const THEME_IDS: string[] = THEMES.map((t) => t.id);

/** Themes installed from packs, after the built-in ones. */
export const installedThemes = writable<Theme[]>([]);

/** Called when the content catalog is (re)loaded. Forces the theme to be applied again. */
export function registerThemes(list: Theme[]) {
  installedThemes.set(list.filter((t) => !THEME_IDS.includes(t.id)));
  applied = null;
}

/** Every theme in the order the picker shows them. */
export const allThemes = (): Theme[] => [...THEMES, ...get(installedThemes)];

const THEME_ID_SHAPE = /^[a-z0-9_]{1,40}$/;

/**
 * A theme setting is "system", a built-in theme, or a well-formed id. The last case is an
 * installed theme: packs load after settings, so it can't be checked yet. If it turns out not to
 * exist, the default theme is shown and the choice is kept for when the pack is back.
 */
export function isThemeChoice(v: unknown): v is ThemeChoice {
  return v === 'system' || (typeof v === 'string' && THEME_ID_SHAPE.test(v));
}

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? get(installedThemes).find((t) => t.id === id) ?? THEMES[0];
}

/** Which theme "Follow System" resolves to. */
export function resolveTheme(choice: ThemeChoice, systemDark: boolean): Theme {
  if (choice === 'system') return themeById(systemDark ? 'moonlight' : DEFAULT_THEME);
  return themeById(choice);
}

/** Higher Contrast pushes text and outlines further from the surface, in every theme. */
export function highContrastVars(theme: Theme): Record<string, string> {
  if (theme.dark) {
    return {
      '--ink': '#ffffff',
      '--ink-soft': '#e2dffa',
      '--ink-faint': '#c4c1e6',
      '--line': 'rgba(225, 220, 255, 0.5)',
      '--panel': 'rgba(38, 41, 78, 0.97)',
      '--focus': '#ffffff'
    };
  }
  return {
    '--ink': '#241f3d',
    '--ink-soft': '#3b3760',
    '--ink-faint': '#5d5a80',
    '--line': 'rgba(50, 42, 100, 0.45)',
    '--panel': 'rgba(255, 255, 255, 0.97)',
    '--focus': '#3a2bb0'
  };
}

/** The final variable set for a theme, with the contrast option applied. */
export function themeVars(theme: Theme, highContrast: boolean): Record<string, string> {
  return highContrast ? { ...theme.vars, ...highContrastVars(theme) } : theme.vars;
}

let applied: string | null = null;
let appliedKeys: string[] = [];

export function applyTheme(choice: ThemeChoice, highContrast: boolean, systemDark: boolean): Theme {
  const theme = resolveTheme(choice, systemDark);
  if (typeof document === 'undefined') return theme;
  const sig = `${theme.id}|${highContrast ? 1 : 0}`;
  if (sig === applied) return theme;
  applied = sig;
  const root = document.documentElement;
  for (const k of appliedKeys) root.style.removeProperty(k);
  const vars = themeVars(theme, highContrast);
  appliedKeys = Object.keys(vars);
  for (const k of appliedKeys) root.style.setProperty(k, vars[k]);
  root.dataset.theme = theme.id;
  root.dataset.tone = theme.dark ? 'dark' : 'light';
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme.dark ? 'dark' : 'light');
  document.body?.style.setProperty('background', vars['--bg-a']);
  return theme;
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Test hook. */
export function __resetThemeForTests() {
  applied = null;
  appliedKeys = [];
}

// --- contrast helpers (used by tests and the picker) ---

function channel(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a hex color: ${hex}`);
  const n = parseInt(m[1], 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
