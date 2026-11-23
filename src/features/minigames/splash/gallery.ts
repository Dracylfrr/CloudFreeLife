/**
 * Saving a finished (or half-finished) Splash Wall into the Gallery. The wall is stored like any
 * other drawing: a full-size paint layer on a free canvas, so it shows up in the Gallery, can be
 * exported as a PNG from there, and can even be opened and painted on some more.
 */
import { CANVAS_H, CANVAS_W } from '../../../core/config';
import { canvasToPng, ctx2d, makeCanvas } from '../../painting/raster';
import { createArtwork, saveArtwork, type ArtworkMeta } from '../../gallery/artwork';

export const THUMB_W = 360;

/** "Splash Wall: Rainbow Target", never empty and never too long for the Gallery. */
export function galleryTitle(levelName: string | undefined): string {
  const name = (levelName ?? '').trim();
  return (name ? `Splash Wall: ${name}` : 'Splash Wall').slice(0, 80);
}

function scaled(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const out = makeCanvas(w, h);
  const g = ctx2d(out);
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, w, h);
  return out;
}

/** Saves the wall picture (already composited: paper, paint and outlines) as a new Gallery drawing. */
export async function saveWallToGallery(wall: HTMLCanvasElement, levelName: string | undefined): Promise<ArtworkMeta> {
  const paint = await canvasToPng(scaled(wall, CANVAS_W, CANVAS_H));
  const thumb = await canvasToPng(scaled(wall, THUMB_W, Math.round((THUMB_W * CANVAS_H) / CANVAS_W)));
  const meta = await createArtwork({ title: galleryTitle(levelName), bookId: 'free_canvas', pageId: null, background: null, width: CANVAS_W, height: CANVAS_H });
  return saveArtwork(meta, paint, thumb);
}
