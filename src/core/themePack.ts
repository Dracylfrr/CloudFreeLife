/**
 * Installable themes. A theme pack is one small JSON file (`themes/<id>.json`) that lists the main
 * colors; everything else is worked out from them. It is checked before use: colors must be real
 * hex colors, the text must be easy to read on the panels and buttons, and a pack can never
 * replace a built-in theme. A theme that fails is skipped and the app carries on.
 */
import { Errs, HEX_RE, done, isObj, reqId, reqString, reqVersion, type Result } from './manifests';
import { THEME_IDS, contrastRatio, makeTheme, type Theme } from './themes';

type Pair = [string, string];
type Triple = [string, string, string];

export interface ThemePackManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  minAppVersion: string;
  dark: boolean;
  /** Page background, three soft colors. */
  bg: Triple;
  /** Panels, cards and the sidebar. */
  panelSolid: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  /** Accent for focus rings and highlights, and its soft partner. */
  accent: string;
  accentSoft: string;
  /** Primary button gradient and its text color. */
  g: Pair;
  gInk: string;
  /** Active sidebar item: two background colors and the text color. */
  nav: Triple;
}

const hex = (v: unknown): v is string => typeof v === 'string' && HEX_RE.test(v);

function colors(raw: Record<string, unknown>, key: string, n: number, e: Errs): string[] {
  const v = raw[key];
  if (!Array.isArray(v) || v.length !== n || !v.every(hex)) {
    e.add(`"${key}" must list exactly ${n} #rrggbb colors`);
    return Array(n).fill('#888888');
  }
  return v as string[];
}
function color(raw: Record<string, unknown>, key: string, e: Errs): string {
  const v = raw[key];
  if (!hex(v)) {
    e.add(`"${key}" must be a #rrggbb color`);
    return '#888888';
  }
  return v;
}

export function validateThemePack(raw: unknown, where = 'theme.json'): Result<ThemePackManifest> {
  const e = new Errs(where);
  if (!isObj(raw)) {
    e.add('must be a JSON object');
    return done(e, null as never);
  }
  const m: ThemePackManifest = {
    id: reqId(raw, 'id', e),
    name: reqString(raw, 'name', e, 40),
    description: typeof raw.description === 'string' ? raw.description.slice(0, 120) : '',
    version: reqVersion(raw, 'version', e),
    minAppVersion: reqVersion(raw, 'minAppVersion', e),
    dark: raw.dark === true,
    bg: colors(raw, 'bg', 3, e) as Triple,
    panelSolid: color(raw, 'panelSolid', e),
    ink: color(raw, 'ink', e),
    inkSoft: color(raw, 'inkSoft', e),
    inkFaint: color(raw, 'inkFaint', e),
    accent: color(raw, 'accent', e),
    accentSoft: color(raw, 'accentSoft', e),
    g: colors(raw, 'g', 2, e) as Pair,
    gInk: color(raw, 'gInk', e),
    nav: colors(raw, 'nav', 3, e) as Triple
  };
  if (m.id && (THEME_IDS as string[]).includes(m.id)) e.add(`"${m.id}" is the id of a built-in theme; choose another id`);
  if (m.id === 'system') e.add('"system" is reserved');
  if (e.list.length) return done(e, m);

  // Readable by design: the same bars the built-in themes meet.
  const need = (label: string, a: string, b: string, min: number) => {
    const r = contrastRatio(a, b);
    if (r < min) e.add(`${label} is too hard to read (contrast ${r.toFixed(1)}, needs ${min})`);
  };
  need('text on panels', m.ink, m.panelSolid, 7);
  need('soft text on panels', m.inkSoft, m.panelSolid, 4.5);
  need('text on the page background', m.ink, m.bg[0], 4.5);
  need('button text', m.gInk, m.g[0], 4.5);
  need('button text', m.gInk, m.g[1], 4.5);
  need('the selected sidebar item', m.nav[2], m.nav[0], 4.5);
  need('the selected sidebar item', m.nav[2], m.nav[1], 4.5);
  // "dark" must tell the truth, because it switches the shape of shadows, tags and scrollbars.
  const lum = (h: string) => contrastRatio(h, '#000000');
  const isDark = lum(m.panelSolid) < 4;
  if (m.dark !== isDark) e.add(m.dark ? '"dark" is true but the panels are light' : '"dark" is false but the panels are dark');
  return done(e, m);
}

const rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** Fills in everything a theme needs from the few colors a pack gives. */
export function themeFromPack(m: ThemePackManifest): Theme {
  const [r, g, b] = rgb(m.panelSolid);
  return makeTheme({
    id: m.id as never,
    name: m.name,
    blurb: m.description || 'An installed theme.',
    dark: m.dark,
    bg: m.bg,
    amb: [m.bg[0], m.bg[1], m.bg[2], m.accentSoft],
    panelSolid: m.panelSolid,
    panel: `rgba(${r}, ${g}, ${b}, ${m.dark ? 0.8 : 0.74})`,
    ink: m.ink,
    inkSoft: m.inkSoft,
    inkFaint: m.inkFaint,
    accent: m.accent,
    accentSoft: m.accentSoft,
    sky: m.accentSoft,
    skyDeep: m.accent,
    g: m.g,
    gInk: m.gInk,
    nav: m.nav,
    brand: [m.accent, m.g[1]],
    hero: [m.accent, m.g[1], m.nav[1]],
    focus: m.accent,
    w: m.dark ? '74 80 140' : '255 255 255',
    shadow: m.dark ? '8, 10, 32' : '90, 80, 160',
    cloud: m.dark ? m.accentSoft : m.panelSolid,
    bubbles: [m.bg[0], m.bg[1], m.bg[2], m.accentSoft, m.g[0]],
    track: m.accentSoft
  });
}
