/**
 * A reference picture for a painting (added in 1.6): a photo or drawing you look at while you paint.
 * It is kept in the painting's folder (`reference.jpg`, resized so it stays small, and its
 * settings in `reference.json`). It is never part of the painting, its thumbnail or its exports.
 */
import { getStorage } from '../../core/storage';

export const MAX_REF_SIDE = 1600;
export const MAX_REF_INPUT_BYTES = 12 * 1024 * 1024;

export type RefMode = 'beside' | 'trace';
export interface RefSettings {
  /** Beside the canvas, or faintly over it to trace. */
  mode: RefMode;
  /** How strong it is when tracing (0.1 to 0.9). */
  opacity: number;
  shown: boolean;
}
export const DEFAULT_REF: RefSettings = { mode: 'beside', opacity: 0.35, shown: true };

const dir = (id: string) => `artworks/${id}`;
export const referencePath = (id: string) => `${dir(id)}/reference.jpg`;
export const referenceSettingsPath = (id: string) => `${dir(id)}/reference.json`;

export function sanitizeRef(raw: unknown): RefSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const o = typeof r.opacity === 'number' && Number.isFinite(r.opacity) ? Math.min(0.9, Math.max(0.1, r.opacity)) : DEFAULT_REF.opacity;
  return { mode: r.mode === 'trace' ? 'trace' : 'beside', opacity: Math.round(o * 100) / 100, shown: r.shown !== false };
}

/** The size to scale a picture to so its longer side is at most `max` (never bigger than the original). */
export function fitSize(w: number, h: number, max = MAX_REF_SIDE): { w: number; h: number } {
  if (!(w > 0) || !(h > 0)) return { w: 1, h: 1 };
  const s = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

export async function loadReference(id: string): Promise<{ bytes: Uint8Array; settings: RefSettings } | null> {
  const st = await getStorage();
  const bytes = await st.readBytes(referencePath(id));
  if (!bytes || !bytes.byteLength) return null;
  let settings = DEFAULT_REF;
  try {
    const text = await st.readText(referenceSettingsPath(id));
    settings = sanitizeRef(text ? JSON.parse(text) : null);
  } catch {
    settings = DEFAULT_REF;
  }
  return { bytes, settings };
}

export async function saveReference(id: string, bytes: Uint8Array, settings: RefSettings): Promise<void> {
  const st = await getStorage();
  await st.writeBytes(referencePath(id), bytes);
  await st.writeText(referenceSettingsPath(id), JSON.stringify(settings));
}

export async function saveReferenceSettings(id: string, settings: RefSettings): Promise<void> {
  const st = await getStorage();
  await st.writeText(referenceSettingsPath(id), JSON.stringify(settings));
}

export async function removeReference(id: string): Promise<void> {
  const st = await getStorage();
  await st.remove(referencePath(id));
  await st.remove(referenceSettingsPath(id));
}

export async function copyReference(from: string, to: string): Promise<void> {
  const ref = await loadReference(from);
  if (ref) await saveReference(to, ref.bytes, ref.settings);
}
