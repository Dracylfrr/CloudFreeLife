import { isTauri } from '../../core/storage';
import { slugify } from '../../core/util';
import { toast } from '../../core/feedback';

/** Saves PNG bytes through the native save dialog (desktop) or a download (browser dev). */
export async function savePngFile(bytes: Uint8Array, title: string): Promise<boolean> {
  const fileName = `${slugify(title)}.png`;
  try {
    if (isTauri()) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const path = await save({ defaultPath: fileName, filters: [{ name: 'PNG image', extensions: ['png'] }], title: 'Export PNG' });
      if (!path) return false; // cancelled
      await writeFile(path, bytes);
    } else {
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/png' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    toast('PNG exported ✨', 'success');
    return true;
  } catch (err) {
    console.error(err);
    toast("Couldn't export the PNG. Please try another location.", 'error');
    return false;
  }
}

/** Saves a recorded video through the native save dialog (desktop) or a download (browser dev). */
export async function saveVideoFile(blob: Blob, title: string): Promise<boolean> {
  const fileName = `${slugify(title)}-timelapse.webm`;
  try {
    if (isTauri()) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');
      const path = await save({ defaultPath: fileName, filters: [{ name: 'WebM video', extensions: ['webm'] }], title: 'Export timelapse' });
      if (!path) return false; // cancelled
      await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    toast('Timelapse saved ✨', 'success');
    return true;
  } catch (err) {
    console.error(err);
    toast("Couldn't save the timelapse. Please try another location.", 'error');
    return false;
  }
}
