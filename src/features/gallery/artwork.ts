/**
 * Artwork persistence. Every piece of art lives in its own folder in the
 * user's data directory (never in the install folder):
 *
 *   artworks/<id>/artwork.json   metadata
 *   artworks/<id>/paint.png      the paint layer (transparent PNG)
 *   artworks/<id>/thumb.png      small preview for the Gallery
 */
import { get, writable } from 'svelte/store';
import { getStorage } from '../../core/storage';
import { slugify, shortId } from '../../core/util';

export interface ArtworkMeta {
  schema: 1;
  id: string;
  title: string;
  bookId: string;
  /** null for Free Canvas drawings. */
  pageId: string | null;
  /** Free Canvas background id. */
  background: string | null;
  createdAt: number;
  updatedAt: number;
  width: number;
  height: number;
  hasPaint: boolean;
}

export const ARTWORK_ROOT = 'artworks';
export const metaPath = (id: string) => `${ARTWORK_ROOT}/${id}/artwork.json`;
export const paintPath = (id: string) => `${ARTWORK_ROOT}/${id}/paint.png`;
export const thumbPath = (id: string) => `${ARTWORK_ROOT}/${id}/thumb.png`;

const ID_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

export const artworks = writable<ArtworkMeta[]>([]);
export const artworksLoaded = writable(false);

function sanitizeMeta(raw: unknown, folder: string): ArtworkMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.id !== folder || typeof r.id !== 'string' || !ID_RE.test(r.id)) return null;
  const now = Date.now();
  return {
    schema: 1,
    id: r.id,
    title: typeof r.title === 'string' && r.title.trim() ? r.title.slice(0, 80) : 'Untitled',
    bookId: typeof r.bookId === 'string' ? r.bookId : 'free_canvas',
    pageId: typeof r.pageId === 'string' ? r.pageId : null,
    background: typeof r.background === 'string' ? r.background : null,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : now,
    width: typeof r.width === 'number' ? r.width : 1280,
    height: typeof r.height === 'number' ? r.height : 960,
    hasPaint: r.hasPaint === true
  };
}

export async function refreshArtworks(): Promise<ArtworkMeta[]> {
  const st = await getStorage();
  const out: ArtworkMeta[] = [];
  for (const folder of await st.list(ARTWORK_ROOT)) {
    try {
      const text = await st.readText(metaPath(folder));
      const meta = text ? sanitizeMeta(JSON.parse(text), folder) : null;
      if (meta) out.push(meta);
    } catch (err) {
      console.warn(`Skipping unreadable artwork ${folder}`, err);
    }
  }
  out.sort((a, b) => b.updatedAt - a.updatedAt);
  artworks.set(out);
  artworksLoaded.set(true);
  return out;
}

export function newArtworkId(title: string): string {
  return `${slugify(title)}-${shortId(4)}`;
}

export async function createArtwork(init: { title: string; bookId: string; pageId: string | null; background?: string | null; width: number; height: number }): Promise<ArtworkMeta> {
  const now = Date.now();
  const meta: ArtworkMeta = {
    schema: 1,
    id: newArtworkId(init.title),
    title: init.title,
    bookId: init.bookId,
    pageId: init.pageId,
    background: init.background ?? null,
    createdAt: now,
    updatedAt: now,
    width: init.width,
    height: init.height,
    hasPaint: false
  };
  const st = await getStorage();
  await st.writeText(metaPath(meta.id), JSON.stringify(meta, null, 2));
  artworks.update((a) => [meta, ...a]);
  return meta;
}

export async function loadArtwork(id: string): Promise<{ meta: ArtworkMeta; paint: Uint8Array | null } | null> {
  if (!ID_RE.test(id)) return null;
  const st = await getStorage();
  const text = await st.readText(metaPath(id));
  if (!text) return null;
  const meta = sanitizeMeta(JSON.parse(text), id);
  if (!meta) return null;
  const paint = await st.readBytes(paintPath(id));
  return { meta, paint };
}

/** Writes paint + thumbnail + metadata. Paint is written before metadata so meta never points at missing data. */
export async function saveArtwork(meta: ArtworkMeta, paint: Uint8Array | null, thumb: Uint8Array | null): Promise<ArtworkMeta> {
  const st = await getStorage();
  const next: ArtworkMeta = { ...meta, updatedAt: Date.now(), hasPaint: paint !== null };
  if (paint) await st.writeBytes(paintPath(meta.id), paint);
  else await st.remove(paintPath(meta.id));
  if (thumb) await st.writeBytes(thumbPath(meta.id), thumb);
  await st.writeText(metaPath(meta.id), JSON.stringify(next, null, 2));
  artworks.update((list) => {
    const rest = list.filter((a) => a.id !== next.id);
    return [next, ...rest].sort((a, b) => b.updatedAt - a.updatedAt);
  });
  return next;
}

export async function renameArtwork(id: string, title: string): Promise<void> {
  const st = await getStorage();
  const text = await st.readText(metaPath(id));
  if (!text) return;
  const meta = sanitizeMeta(JSON.parse(text), id);
  if (!meta) return;
  const next = { ...meta, title: title.trim().slice(0, 80) || meta.title };
  await st.writeText(metaPath(id), JSON.stringify(next, null, 2));
  artworks.update((list) => list.map((a) => (a.id === id ? next : a)));
}

export async function duplicateArtwork(id: string): Promise<ArtworkMeta | null> {
  const src = await loadArtwork(id);
  if (!src) return null;
  const st = await getStorage();
  const now = Date.now();
  const title = `${src.meta.title} copy`.slice(0, 80);
  const copy: ArtworkMeta = { ...src.meta, id: newArtworkId(title), title, createdAt: now, updatedAt: now };
  if (src.paint) await st.writeBytes(paintPath(copy.id), src.paint);
  const thumb = await st.readBytes(thumbPath(id));
  if (thumb) await st.writeBytes(thumbPath(copy.id), thumb);
  await st.writeText(metaPath(copy.id), JSON.stringify(copy, null, 2));
  artworks.update((list) => [copy, ...list]);
  return copy;
}

export async function deleteArtwork(id: string): Promise<void> {
  if (!ID_RE.test(id)) return;
  const st = await getStorage();
  await st.remove(`${ARTWORK_ROOT}/${id}`);
  artworks.update((list) => list.filter((a) => a.id !== id));
}

/** Removes all paint but keeps the artwork (and its page / background). */
export async function clearArtworkPaint(id: string): Promise<void> {
  const st = await getStorage();
  const text = await st.readText(metaPath(id));
  if (!text) return;
  const meta = sanitizeMeta(JSON.parse(text), id);
  if (!meta) return;
  await st.remove(paintPath(id));
  await st.remove(thumbPath(id));
  const next = { ...meta, hasPaint: false, updatedAt: Date.now() };
  await st.writeText(metaPath(id), JSON.stringify(next, null, 2));
  artworks.update((list) => list.map((a) => (a.id === id ? next : a)));
}

export function latestForPage(bookId: string, pageId: string | null): ArtworkMeta | undefined {
  return get(artworks).find((a) => a.bookId === bookId && a.pageId === pageId);
}

export function allForPage(bookId: string, pageId: string): ArtworkMeta[] {
  return get(artworks).filter((a) => a.bookId === bookId && a.pageId === pageId);
}

export function mostRecent(): ArtworkMeta | undefined {
  return get(artworks)[0];
}

export async function thumbUrl(id: string): Promise<string | null> {
  const st = await getStorage();
  const bytes = await st.readBytes(thumbPath(id));
  if (!bytes) return null;
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/png' }));
}
