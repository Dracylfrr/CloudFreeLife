/**
 * The paint mode (added in 1.6.1): one clear choice for how paint behaves.
 *
 *   inside    paint stays inside the area where you start (on a coloring page: inside the lines;
 *             on Free Draw: inside the area of similar color)
 *   anywhere  paint goes wherever you drag, over the lines
 *   fill      tap an area to fill it with color: the brushes work like the Fill Bucket
 */
export const PAINT_MODES = ['inside', 'anywhere', 'fill'] as const;
export type PaintMode = (typeof PAINT_MODES)[number];

export const isPaintMode = (v: unknown): v is PaintMode => typeof v === 'string' && (PAINT_MODES as readonly string[]).includes(v);

/** Settings saved before the paint mode existed only had "stay inside lines" on or off. */
export const modeFromLegacy = (stayInside: unknown): PaintMode => (stayInside === false ? 'anywhere' : 'inside');

export interface ModeInfo {
  id: PaintMode;
  label: string;
  hint: string;
}

/** Words for each mode. On a coloring page there are lines; on Free Draw there are areas of color. */
export function modeInfo(mode: PaintMode, hasLines: boolean): ModeInfo {
  switch (mode) {
    case 'inside':
      return hasLines
        ? { id: mode, label: 'Inside the lines', hint: 'Paint stays inside the area where you start.' }
        : { id: mode, label: 'Inside areas', hint: 'Paint stays inside the area of similar color where you start.' };
    case 'anywhere':
      return hasLines
        ? { id: mode, label: 'Splash anywhere', hint: 'Paint goes wherever you drag, over the lines.' }
        : { id: mode, label: 'Anywhere', hint: 'Paint goes wherever you drag.' };
    case 'fill':
      return { id: mode, label: 'Fill areas', hint: 'Tap an area to fill it with color. Brushes work like the Fill Bucket.' };
  }
}

export const modeList = (hasLines: boolean): ModeInfo[] => PAINT_MODES.map((m) => modeInfo(m, hasLines));

/** The tools that paint with a stroke, and so turn into a tap-to-fill in Fill mode. */
const STROKE_TOOLS = ['brush', 'marker', 'crayon', 'airbrush', 'watercolor', 'pastel', 'ink', 'glitter'];

/** In Fill mode a brush fills the area you tap instead of drawing a stroke. */
export const brushActsAsFill = (mode: PaintMode, tool: string): boolean => mode === 'fill' && STROKE_TOOLS.includes(tool);

/** Whether stamps, paintballs and strokes are kept inside an area. (Fill mode keeps them inside too.) */
export const keepsInside = (mode: PaintMode): boolean => mode !== 'anywhere';
