import { findBook, findPage } from '../../core/content/registry';
import { navigate } from '../../core/router';
import { toast } from '../../core/feedback';
import { CANVAS_H, CANVAS_W } from '../../core/config';
import { createArtwork, latestForPage, type ArtworkMeta } from '../gallery/artwork';

/** Opens the most recent artwork for a page, or starts a fresh one. */
export async function openColoringPage(bookId: string, pageId: string, opts: { fresh?: boolean } = {}): Promise<void> {
  const book = findBook(bookId);
  const page = findPage(bookId, pageId);
  if (!book || !page) {
    toast("That page isn't available any more.", 'error');
    return;
  }
  let art: ArtworkMeta | undefined = opts.fresh ? undefined : latestForPage(bookId, pageId);
  if (!art) art = await createArtwork({ title: page.manifest.name, bookId, pageId, width: CANVAS_W, height: CANVAS_H });
  await navigate({ name: 'paint', artworkId: art.id });
}

export async function startFreeCanvas(backgroundId: string, title = 'Free drawing'): Promise<void> {
  const art = await createArtwork({ title, bookId: 'free_canvas', pageId: null, background: backgroundId, width: CANVAS_W, height: CANVAS_H });
  await navigate({ name: 'paint', artworkId: art.id });
}

export function openArtwork(id: string): Promise<void> {
  return navigate({ name: 'paint', artworkId: id });
}
