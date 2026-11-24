/**
 * Saving and loading the layers of a Free Draw painting. In the painting's folder:
 *
 *   paint.png         all visible layers flattened (no paper). Always kept, so older versions,
 *                     the Gallery and every export keep working exactly as before.
 *   layers.json       the list: names, order, opacity, blend mode, visible, locked, which is selected
 *   layer-l1.png ...  one transparent picture per layer
 *   paint.v15.png     the single-layer file as it was before layers (kept for a few good saves)
 *
 * Order matters: layer pictures first, `layers.json` after them, so a power cut can never leave a
 * list that points at pictures that are not there. A painting whose layer files are missing or
 * damaged opens from `paint.png` instead.
 */
import { getStorage } from '../../core/storage';
import { layerFile, sanitizeLayersFile, type LayerMeta, type LayersFile } from '../painting/layers';

const dir = (id: string) => `artworks/${id}`;
export const layersPath = (id: string) => `${dir(id)}/layers.json`;
export const layerPath = (id: string, layerId: string) => `${dir(id)}/${layerFile(layerId)}`;
export const backupPath = (id: string) => `${dir(id)}/paint.v15.png`;
/** The old single-layer file is kept until this many good layered saves have happened. */
export const KEEP_BACKUP_SAVES = 3;

export interface LoadedLayers {
  file: LayersFile;
  pngs: Record<string, Uint8Array | null>;
}

/** The saved layers, or null (no layers, or something is missing or damaged: use paint.png instead). */
export async function loadLayerData(id: string): Promise<LoadedLayers | null> {
  const st = await getStorage();
  let file: LayersFile | null = null;
  try {
    const text = await st.readText(layersPath(id));
    file = text ? sanitizeLayersFile(JSON.parse(text)) : null;
  } catch {
    file = null;
  }
  if (!file) return null;
  const pngs: Record<string, Uint8Array | null> = {};
  for (const l of file.layers) {
    const bytes = await st.readBytes(layerPath(id, l.id));
    if (!bytes || !bytes.byteLength) return null;
    pngs[l.id] = bytes;
  }
  return { file, pngs };
}

/**
 * Writes the changed layer pictures, then `layers.json`. `changed` has only the layers that changed
 * since the last save. Returns true when everything was written.
 */
export async function saveLayerData(id: string, metas: LayerMeta[], active: string, changed: Record<string, Uint8Array | null>): Promise<boolean> {
  const st = await getStorage();
  let previous: LayersFile | null = null;
  try {
    const text = await st.readText(layersPath(id));
    previous = text ? sanitizeLayersFile(JSON.parse(text)) : null;
  } catch {
    previous = null;
  }
  // First layered save of an older painting: keep the old single-layer file.
  if (!previous && !(await st.exists(backupPath(id)))) {
    const old = await st.readBytes(`${dir(id)}/paint.png`);
    if (old && old.byteLength) await st.writeBytes(backupPath(id), old);
  }
  for (const [layerId, bytes] of Object.entries(changed)) if (bytes) await st.writeBytes(layerPath(id, layerId), bytes);
  // every layer in the list must have a picture on disk
  for (const m of metas) {
    if (!(await st.exists(layerPath(id, m.id)))) return false;
  }
  const keep = new Set(metas.map((m) => m.id));
  for (const old of previous?.layers ?? []) if (!keep.has(old.id)) await st.remove(layerPath(id, old.id));
  const saves = Math.min(KEEP_BACKUP_SAVES, (previous?.saves ?? 0) + 1);
  const file: LayersFile = { v: 1, layers: metas, active, saves };
  await st.writeText(layersPath(id), JSON.stringify(file, null, 2));
  if (saves >= KEEP_BACKUP_SAVES && (await st.exists(backupPath(id)))) await st.remove(backupPath(id));
  return true;
}

/** Copies the layers of one painting to another (for Duplicate in the Gallery). */
export async function copyLayerData(from: string, to: string): Promise<void> {
  const loaded = await loadLayerData(from);
  if (!loaded) return;
  const st = await getStorage();
  for (const l of loaded.file.layers) {
    const bytes = loaded.pngs[l.id];
    if (bytes) await st.writeBytes(layerPath(to, l.id), bytes);
  }
  await st.writeText(layersPath(to), JSON.stringify({ ...loaded.file, saves: KEEP_BACKUP_SAVES }, null, 2));
}
