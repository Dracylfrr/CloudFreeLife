/** Turns a picture the person chose into a small JPEG to keep beside the painting. */
import { MAX_REF_INPUT_BYTES, fitSize } from '../gallery/referenceStore';

export async function prepareReference(file: Blob, name = ''): Promise<Uint8Array> {
  if (file.size === 0) throw new Error('That file is empty.');
  if (file.size > MAX_REF_INPUT_BYTES) throw new Error('That picture is too big (12 MB at most).');
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(name)) throw new Error('Please choose a PNG, JPG or WebP picture.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That picture could not be opened.'));
      i.src = url;
    });
    const { w, h } = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.86));
    if (!blob) throw new Error('That picture could not be prepared.');
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
