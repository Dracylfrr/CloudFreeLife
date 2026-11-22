/** Helpers for turning SVG text and PNG bytes into canvas pixels. */

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function ctx2d(c: HTMLCanvasElement, opts: CanvasRenderingContext2DSettings = {}): CanvasRenderingContext2D {
  const ctx = c.getContext('2d', opts);
  if (!ctx) throw new Error('2D canvas is not available');
  return ctx;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });
}

export async function rasterizeSvg(svgText: string, w: number, h: number, smooth = true): Promise<HTMLCanvasElement> {
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const c = makeCanvas(w, h);
    const ctx = ctx2d(c, { willReadFrequently: !smooth });
    ctx.imageSmoothingEnabled = smooth;
    ctx.drawImage(img, 0, 0, w, h);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Sets width/height on the root <svg> so it rasterises at the exact size we want. */
export function sizeSvg(svgText: string, w: number, h: number): string {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const root = doc.documentElement;
  root.setAttribute('width', String(w));
  root.setAttribute('height', String(h));
  return new XMLSerializer().serializeToString(doc);
}

export function canvasToPng(c: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    c.toBlob(async (blob) => {
      if (!blob) return reject(new Error('Could not encode PNG'));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/png');
  });
}

export async function pngToBitmap(bytes: Uint8Array): Promise<ImageBitmap> {
  return createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/png' }));
}
