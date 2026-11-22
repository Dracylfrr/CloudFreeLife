export type ToolId = 'brush' | 'marker' | 'crayon' | 'airbrush' | 'fill' | 'eraser' | 'paintball' | 'picker' | 'clearRegion' | 'pan';

export interface ToolInfo {
  id: ToolId;
  label: string;
  icon: string;
  hint: string;
  /** Does this tool use the size slider? */
  sized: boolean;
  key: string;
}

export const TOOLS: ToolInfo[] = [
  { id: 'brush', label: 'Brush', icon: 'brush', hint: 'Soft, smooth strokes', sized: true, key: 'B' },
  { id: 'marker', label: 'Marker', icon: 'marker', hint: 'Even, slightly see-through color', sized: true, key: 'M' },
  { id: 'crayon', label: 'Crayon', icon: 'crayon', hint: 'Grainy, waxy texture', sized: true, key: 'C' },
  { id: 'airbrush', label: 'Airbrush', icon: 'spray', hint: 'Soft misty color', sized: true, key: 'A' },
  { id: 'fill', label: 'Fill Bucket', icon: 'bucket', hint: 'Fill a region (always recolorable)', sized: false, key: 'F' },
  { id: 'eraser', label: 'Eraser', icon: 'eraser', hint: 'Erase paint', sized: true, key: 'E' },
  { id: 'paintball', label: 'Paintball', icon: 'paintball', hint: 'Splat a playful burst of paint', sized: false, key: 'P' },
  { id: 'clearRegion', label: 'Clear Region', icon: 'ban', hint: 'Remove all paint from one region', sized: false, key: 'X' },
  { id: 'picker', label: 'Color Picker', icon: 'pipette', hint: 'Pick a color from your painting', sized: false, key: 'I' },
  { id: 'pan', label: 'Pan', icon: 'hand', hint: 'Move the page (or hold Space)', sized: false, key: 'H' }
];

export interface BrushSpec {
  /** line width multiplier relative to the size slider */
  scale: number;
  /** opacity applied once per stroke */
  alpha: number;
  cap: CanvasLineCap;
  /** extra pixels around a segment to include in the dirty rectangle */
  margin: number;
}

export const BRUSHES: Record<'brush' | 'marker' | 'crayon' | 'airbrush' | 'eraser', BrushSpec> = {
  brush: { scale: 1, alpha: 1, cap: 'round', margin: 3 },
  marker: { scale: 1.25, alpha: 0.72, cap: 'square', margin: 4 },
  crayon: { scale: 1.1, alpha: 1, cap: 'round', margin: 5 },
  airbrush: { scale: 2.4, alpha: 1, cap: 'round', margin: 6 },
  eraser: { scale: 1.3, alpha: 1, cap: 'round', margin: 3 }
};

export type BrushToolId = keyof typeof BRUSHES;
export const isBrushTool = (t: ToolId): t is BrushToolId => t in BRUSHES;
