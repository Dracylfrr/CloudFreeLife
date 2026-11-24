/**
 * Layers for Free Draw (added in 1.6). A painting has between 1 and 4 layers, drawn from the
 * bottom up on top of the background. Coloring pages keep a single paint layer under the line art.
 *
 * This file is only data and rules (no canvas), so it is easy to test. The painting engine does
 * the drawing, and `gallery/layerStore.ts` does the saving.
 */

export const MAX_LAYERS = 4;
export const MAX_LAYER_NAME = 24;

export const BLEND_MODES = [
  { id: 'normal', label: 'Normal', op: 'source-over', css: 'normal', hint: 'Plain paint on top of what is below.' },
  { id: 'multiply', label: 'Multiply', op: 'multiply', css: 'multiply', hint: 'Darkens, like layering tracing paper. Good for shadows.' },
  { id: 'screen', label: 'Screen', op: 'screen', css: 'screen', hint: 'Lightens, like shining a soft light. Good for glows.' },
  { id: 'overlay', label: 'Overlay', op: 'overlay', css: 'overlay', hint: 'Adds depth: lights get lighter and darks get darker.' },
  { id: 'soft-light', label: 'Soft Light', op: 'soft-light', css: 'soft-light', hint: 'A gentle version of Overlay, for tinting and warmth.' },
  { id: 'color', label: 'Color', op: 'color', css: 'color', hint: 'Recolors what is below but keeps its light and dark.' }
] as const;

export type BlendId = (typeof BLEND_MODES)[number]['id'];
export const BLEND_IDS: string[] = BLEND_MODES.map((b) => b.id);
export const blendOf = (id: string) => BLEND_MODES.find((b) => b.id === id) ?? BLEND_MODES[0];

export interface LayerMeta {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  /** 0 (invisible) to 1 (solid). */
  opacity: number;
  blend: BlendId;
}

/** What `layers.json` holds. The pictures are in `layer-<id>.png` beside it. */
export interface LayersFile {
  v: 1;
  /** Bottom to top. */
  layers: LayerMeta[];
  active: string;
  /** Good saves since the old single-layer file was kept as a backup (the backup goes after a few). */
  saves: number;
}

const ID_RE = /^l[0-9]{1,2}$/;
export const isLayerId = (v: unknown): v is string => typeof v === 'string' && ID_RE.test(v);
export const layerFile = (id: string) => `layer-${id}.png`;

/** The smallest unused id: l1, l2, l3, l4 ... */
export function nextLayerId(used: string[]): string {
  for (let i = 1; i < 100; i++) if (!used.includes(`l${i}`)) return `l${i}`;
  return `l${used.length + 1}`;
}

export function cleanName(v: unknown, fallback: string): string {
  const s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, MAX_LAYER_NAME) : '';
  return s || fallback;
}

/** "Layer 1", "Layer 2" ... the first number not already used in a name. */
export function defaultLayerName(names: string[]): string {
  for (let i = 1; i < 100; i++) if (!names.includes(`Layer ${i}`)) return `Layer ${i}`;
  return 'Layer';
}

export function cleanOpacity(v: unknown, fallback = 1): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, Math.round(v * 100) / 100)) : fallback;
}

export function sanitizeLayerMeta(raw: unknown, fallbackName: string): LayerMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isLayerId(r.id)) return null;
  return {
    id: r.id,
    name: cleanName(r.name, fallbackName),
    visible: r.visible !== false,
    locked: r.locked === true,
    opacity: cleanOpacity(r.opacity),
    blend: BLEND_IDS.includes(r.blend as string) ? (r.blend as BlendId) : 'normal'
  };
}

/** Reads `layers.json`. Anything unusable gives null, and the painting falls back to `paint.png`. */
export function sanitizeLayersFile(raw: unknown): LayersFile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1 || !Array.isArray(r.layers)) return null;
  const layers: LayerMeta[] = [];
  for (const [i, l] of r.layers.slice(0, MAX_LAYERS).entries()) {
    const m = sanitizeLayerMeta(l, `Layer ${i + 1}`);
    if (m && !layers.some((x) => x.id === m.id)) layers.push(m);
  }
  if (!layers.length) return null;
  const active = typeof r.active === 'string' && layers.some((l) => l.id === r.active) ? (r.active as string) : layers[layers.length - 1].id;
  const saves = typeof r.saves === 'number' && Number.isFinite(r.saves) ? Math.max(0, Math.min(1000, Math.floor(r.saves))) : 0;
  return { v: 1, layers, active, saves };
}

/** A command a person can give about the layers, also what the timelapse log keeps. */
export type LayerCommand =
  | { c: 'add'; id: string; name: string }
  | { c: 'dup'; id: string; from: string; name: string }
  | { c: 'del'; id: string }
  | { c: 'sel'; id: string }
  | { c: 'mv'; id: string; by: -1 | 1 }
  | { c: 'merge'; id: string }
  | { c: 'set'; id: string; p: Partial<Pick<LayerMeta, 'name' | 'visible' | 'locked' | 'opacity' | 'blend'>> };

/** Checks a command read from a saved log. */
export function sanitizeCommand(raw: unknown): LayerCommand | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isLayerId(r.id)) return null;
  switch (r.c) {
    case 'add':
      return { c: 'add', id: r.id, name: cleanName(r.name, 'Layer') };
    case 'dup':
      return isLayerId(r.from) ? { c: 'dup', id: r.id, from: r.from, name: cleanName(r.name, 'Layer') } : null;
    case 'del':
    case 'sel':
    case 'merge':
      return { c: r.c, id: r.id } as LayerCommand;
    case 'mv':
      return r.by === 1 || r.by === -1 ? { c: 'mv', id: r.id, by: r.by } : null;
    case 'set': {
      const p = (r.p && typeof r.p === 'object' ? r.p : {}) as Record<string, unknown>;
      const out: LayerCommand & { c: 'set' } = { c: 'set', id: r.id, p: {} };
      if (typeof p.name === 'string') out.p.name = cleanName(p.name, 'Layer');
      if (typeof p.visible === 'boolean') out.p.visible = p.visible;
      if (typeof p.locked === 'boolean') out.p.locked = p.locked;
      if (typeof p.opacity === 'number') out.p.opacity = cleanOpacity(p.opacity);
      if (BLEND_IDS.includes(p.blend as string)) out.p.blend = p.blend as BlendId;
      return Object.keys(out.p).length ? out : null;
    }
    default:
      return null;
  }
}
