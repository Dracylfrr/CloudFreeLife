/**
 * Import your own line art as a coloring page. The picture is turned into the same files every
 * coloring page has (a line-art SVG, a region list, a thumbnail) and kept in the "My Pages" book
 * in your data folder, so it opens, paints, saves and exports exactly like the built-in pages.
 * Nothing leaves your computer and the original file is never changed.
 */
import { getStorage } from '../../core/storage';
import { INSTALLED_ROOT } from '../../core/content/tree';
import { loadCatalog } from '../../core/content/registry';
import { svgIsPassive } from '../updates/packs';
import { WORK_H, WORK_W, buildPage, darkFromGray, traceRegions } from './trace';

export const MY_BOOK_ID = 'my_pages';
export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;
export const MAX_MY_PAGES = 60;
const OUT_W = 1280;
const OUT_H = 960;
const LINE_RGB: [number, number, number] = [110, 106, 142]; // #6e6a8e, the same soft ink as the built-in pages

const base = `${INSTALLED_ROOT}/books/${MY_BOOK_ID}`;

export type ImportResult = { ok: true; pageId: string } | { ok: false; reason: string };

const COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4f2fc"/><stop offset="1" stop-color="#fdeaf1"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><g fill="none" stroke="#6e6a8e" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><rect x="110" y="70" width="180" height="150" rx="18" fill="#fff"/><path d="M135 195l40-50 30 34 22-24 38 40z" fill="#c6ecda"/><circle cx="240" cy="112" r="14" fill="#fff2bd"/></g></svg>`;

/** Loads a picture file into an HTMLImageElement. */
function loadPicture(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That picture could not be opened.'));
    };
    img.src = url;
  });
}

const canvas = (w: number, h: number) => Object.assign(document.createElement('canvas'), { width: w, height: h });

/** Reads a user's file and returns white-paper pixels at the output size, fitted without stretching. */
async function toPaper(file: Blob): Promise<ImageData> {
  const img = await loadPicture(file);
  const c = canvas(OUT_W, OUT_H);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, OUT_W, OUT_H);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) throw new Error('That picture has no size.');
  const s = Math.min(OUT_W / iw, OUT_H / ih);
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, (OUT_W - iw * s) / 2, (OUT_H - ih * s) / 2, iw * s, ih * s);
  return g.getImageData(0, 0, OUT_W, OUT_H);
}

function grayOf(img: ImageData): Uint8Array {
  const out = new Uint8Array(img.width * img.height);
  const d = img.data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) out[p] = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  return out;
}

/** The lines as a transparent picture: darker pixels are more opaque, in the app's soft ink color. */
function linesPng(gray: Uint8Array, w: number, h: number, scale = 1): string {
  const full = canvas(w, h);
  const g = full.getContext('2d')!;
  const px = g.createImageData(w, h);
  for (let p = 0; p < gray.length; p++) {
    const a = Math.max(0, Math.min(1, (215 - gray[p]) / 90));
    px.data[p * 4] = LINE_RGB[0];
    px.data[p * 4 + 1] = LINE_RGB[1];
    px.data[p * 4 + 2] = LINE_RGB[2];
    px.data[p * 4 + 3] = Math.round(a * 255);
  }
  g.putImageData(px, 0, 0);
  if (scale === 1) return full.toDataURL('image/png');
  const small = canvas(Math.round(w * scale), Math.round(h * scale));
  const sg = small.getContext('2d')!;
  sg.imageSmoothingQuality = 'high';
  sg.drawImage(full, 0, 0, small.width, small.height);
  return small.toDataURL('image/png');
}

export function cleanName(name: string): string {
  const n = name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (n || 'My page').slice(0, 40);
}

export async function importLineArt(file: Blob, fileName: string, title?: string): Promise<ImportResult> {
  if (file.size === 0) return { ok: false, reason: 'That file is empty.' };
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, reason: 'That file is too big (8 MB at most).' };
  const type = file.type || '';
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(type) && !/\.(png|jpe?g|webp|svg)$/i.test(fileName)) return { ok: false, reason: 'Please choose a PNG, JPG, WebP or SVG picture.' };
  if (/svg/.test(type) || /\.svg$/i.test(fileName)) {
    if (!svgIsPassive(await file.text())) return { ok: false, reason: 'That SVG contains scripts or links, so it cannot be used.' };
  }
  const st = await getStorage();
  let book: { pages: string[] } = { pages: [] };
  try {
    const t = await st.readText(`${base}/book_manifest.json`);
    if (t) book = JSON.parse(t);
  } catch {
    /* start a fresh book */
  }
  if (!Array.isArray(book.pages)) book.pages = [];
  if (book.pages.length >= MAX_MY_PAGES) return { ok: false, reason: `My Pages can hold ${MAX_MY_PAGES} pages. Remove one to make room.` };

  let paper: ImageData;
  try {
    paper = await toPaper(file);
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'That picture could not be opened.' };
  }
  const gray = grayOf(paper);
  const dark = darkFromGray(gray, OUT_W, OUT_H, WORK_W, WORK_H);
  const traced = traceRegions(dark, WORK_W, WORK_H);
  if (!traced.ok) return { ok: false, reason: traced.reason };

  const page = buildPage(traced.value, linesPng(gray, OUT_W, OUT_H));
  const id = `import_${Date.now().toString(36)}`;
  const dir = `${base}/pages/${id}`;
  const name = (title?.trim() || cleanName(fileName)).slice(0, 40);
  const thumb = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORK_W} ${WORK_H}" width="320" height="240"><rect width="${WORK_W}" height="${WORK_H}" fill="#ffffff"/><image href="${linesPng(gray, OUT_W, OUT_H, 0.4)}" width="${WORK_W}" height="${WORK_H}"/></svg>`;
  await st.writeText(`${dir}/lineart.svg`, page.svg);
  await st.writeText(`${dir}/regions.json`, JSON.stringify(page.regions));
  await st.writeText(`${dir}/thumbnail.svg`, thumb);
  await st.writeText(
    `${dir}/page_manifest.json`,
    JSON.stringify({ id, name, description: 'A page you imported.', version: '1.0.0', minAppVersion: '1.5.0', thumbnail: 'thumbnail.svg', lineArt: 'lineart.svg', regions: 'regions.json', difficulty: traced.value.count > 80 ? 'detailed' : 'relaxed' }, null, 2)
  );
  book.pages = [...book.pages, id];
  await writeBook(book.pages);
  await loadCatalog();
  return { ok: true, pageId: id };
}

async function writeBook(pages: string[]) {
  const st = await getStorage();
  await st.writeText(`${base}/cover.svg`, COVER_SVG);
  await st.writeText(
    `${base}/book_manifest.json`,
    JSON.stringify({ id: MY_BOOK_ID, name: 'My Pages', description: 'Line art you imported, ready to color.', cover: 'cover.svg', version: '1.0.0', minAppVersion: '1.5.0', kind: 'coloring', accent: '#e8b2cd', order: 900, pages }, null, 2)
  );
}

export async function removeImportedPage(pageId: string): Promise<void> {
  if (!/^import_[a-z0-9]{1,16}$/.test(pageId)) return;
  const st = await getStorage();
  let pages: string[] = [];
  try {
    const t = await st.readText(`${base}/book_manifest.json`);
    if (t) pages = (JSON.parse(t).pages as string[]) ?? [];
  } catch {
    /* nothing to update */
  }
  await st.remove(`${base}/pages/${pageId}`);
  const rest = pages.filter((p) => p !== pageId);
  if (rest.length === 0) await st.remove(base);
  else await writeBook(rest);
  await loadCatalog();
}
