import { findBook, findPage, asset } from '../../core/content/registry';
import { CANVAS_H, CANVAS_W } from '../../core/config';
import { PAPER } from '../painting/engine';
import { drawBackground } from '../painting/backgrounds';
import { canvasToPng, ctx2d, makeCanvas, pngToBitmap, rasterizeSvg, sizeSvg } from '../painting/raster';
import { loadArtwork } from './artwork';
import { loadLayerData } from './layerStore';
import { blendOf } from '../painting/layers';

/** Renders a saved artwork (paper + paint + line art) to PNG without opening the painter. */
export async function exportArtworkPng(id: string): Promise<Uint8Array | null> {
  const data = await loadArtwork(id);
  if (!data) return null;
  const out = makeCanvas(CANVAS_W, CANVAS_H);
  const ctx = ctx2d(out);
  const { meta } = data;
  let lines: HTMLCanvasElement | null = null;
  if (meta.pageId) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const page = findPage(meta.bookId, meta.pageId);
    const svg = page ? await asset(page.tree, page.dir, page.manifest.lineArt).text() : null;
    if (svg) lines = await rasterizeSvg(sizeSvg(svg, CANVAS_W, CANVAS_H), CANVAS_W, CANVAS_H);
  } else {
    const def = findBook('free_canvas')?.manifest.backgrounds?.find((b) => b.id === meta.background) ?? findBook('free_canvas')?.manifest.backgrounds?.[0];
    if (def) drawBackground(ctx, def, CANVAS_W, CANVAS_H);
    else {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }
  const layered = !meta.pageId ? await loadLayerData(id).catch(() => null) : null;
  if (layered) {
    // each layer with its own opacity and blend mode, the way it looks in the painter
    for (const l of layered.file.layers) {
      const bytes = layered.pngs[l.id];
      if (!l.visible || l.opacity <= 0 || !bytes) continue;
      const bmp = await pngToBitmap(bytes);
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.globalCompositeOperation = blendOf(l.blend).op as GlobalCompositeOperation;
      ctx.drawImage(bmp, 0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
      bmp.close();
    }
  } else if (data.paint) {
    const bmp = await pngToBitmap(data.paint);
    ctx.drawImage(bmp, 0, 0, CANVAS_W, CANVAS_H);
    bmp.close();
  }
  if (lines) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(lines, 0, 0);
  }
  return canvasToPng(out);
}
