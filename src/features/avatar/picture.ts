/**
 * A picture from the person's own computer, used as the avatar. They choose a file, move, zoom and
 * turn it inside a circle, and the round-cropped square is saved in the app's own data folder
 * (`avatar/picture.png`). The original file is never changed or kept, and nothing is sent anywhere.
 */
import { writable } from 'svelte/store';
import { getStorage } from '../../core/storage';
import { getSettings, updateSettings } from '../../core/settings';

export const PICTURE_PATH = 'avatar/picture.png';
/** The size of the saved square, in pixels. */
export const PICTURE_SIZE = 256;
export const MAX_PICTURE_BYTES = 12 * 1024 * 1024;
export const PICTURE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;

/** How much to scale a w x h picture so it just covers a square of `size`, times the zoom. */
export function coverScale(w: number, h: number, size: number, zoom: number): number {
  if (!(w > 0) || !(h > 0) || !(size > 0)) return 1;
  return (size / Math.min(w, h)) * Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/** Keeps the picture from being dragged completely away: its center stays inside the circle. */
export function clampOffset(offset: number, size: number): number {
  const limit = size / 2;
  return Math.min(limit, Math.max(-limit, Number.isFinite(offset) ? offset : 0));
}

export interface CropState {
  zoom: number;
  /** Degrees, -180 to 180. */
  rotation: number;
  /** How far the picture is moved from the middle, in pixels of the preview. */
  x: number;
  y: number;
}
export const DEFAULT_CROP: CropState = { zoom: 1, rotation: 0, x: 0, y: 0 };

/** Draws the picture, as chosen, into a square canvas (no circle: the display clips it). */
export function drawCrop(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number, size: number, crop: CropState): void {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.fillStyle = '#e6e2f0';
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2 + clampOffset(crop.x, size), size / 2 + clampOffset(crop.y, size));
  ctx.rotate((crop.rotation * Math.PI) / 180);
  const k = coverScale(w, h, size, crop.zoom);
  ctx.scale(k, k);
  ctx.drawImage(img, -w / 2, -h / 2);
  ctx.restore();
}

/** Why a chosen file cannot be used, or null when it is fine. */
export function checkPictureFile(file: { type: string; size: number }): string | null {
  if (!PICTURE_TYPES.includes(file.type)) return 'Please choose a PNG, JPG, WebP, GIF or BMP picture.';
  if (file.size > MAX_PICTURE_BYTES) return 'That picture is larger than 12 MB. Please choose a smaller one.';
  if (file.size === 0) return 'That file is empty.';
  return null;
}

// ---------------------------------------------------------------- saved picture

/** The address of the saved picture, once it has been read (null when there is none). */
export const pictureUrl = writable<string | null>(null);
let shownRev = -1;
let blobUrl: string | null = null;

function setUrl(next: string | null) {
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = next;
  pictureUrl.set(next);
}

/** Reads the saved picture (if the settings say there is one) into `pictureUrl`. */
export async function loadPicture(): Promise<void> {
  const rev = getSettings().avatarPicture;
  if (rev === shownRev) return;
  shownRev = rev;
  if (!rev) return setUrl(null);
  try {
    const bytes = await (await getStorage()).readBytes(PICTURE_PATH);
    if (!bytes) return setUrl(null);
    setUrl(URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/png' })));
  } catch (err) {
    console.warn('Could not read the avatar picture', err);
    setUrl(null);
  }
}

/** Saves a new picture and switches the avatar to it. */
export async function savePicture(bytes: Uint8Array): Promise<void> {
  await (await getStorage()).writeBytes(PICTURE_PATH, bytes);
  const rev = Date.now();
  updateSettings({ avatarPicture: rev, avatarMode: 'picture' });
  await loadPicture();
}

/** Deletes the saved picture and goes back to the drawn avatar. */
export async function removePicture(): Promise<void> {
  try {
    await (await getStorage()).remove(PICTURE_PATH);
  } catch (err) {
    console.warn('Could not remove the avatar picture', err);
  }
  updateSettings({ avatarPicture: 0, avatarMode: 'drawn' });
  await loadPicture();
}
