import { isTauri } from '../../core/storage';
import { slugify } from '../../core/util';
import { SAVED_TOAST_MS, toast } from '../../core/feedback';

/** The file name at the end of a path (either kind of slash). */
export function baseName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

/** Opens the folder that holds a saved file, with the file selected. */
export async function showSavedFile(path: string): Promise<void> {
  try {
    const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
    await revealItemInDir(path);
  } catch (err) {
    console.warn('Could not show the saved file', err);
    toast("Couldn't open the folder. The file is still saved.", 'error', 4000);
  }
}

/**
 * Tells the person a file was saved, for a few seconds, with a link to where it is. In the desktop
 * app the link opens the folder; in a browser (development only) the file went to Downloads.
 */
export function savedNotice(what: string, path: string | null): void {
  if (path) toast(`${what} saved: ${baseName(path)}`, 'success', SAVED_TOAST_MS, { label: 'Show in folder', run: () => void showSavedFile(path) });
  else toast(`${what} saved to your Downloads folder`, 'success', SAVED_TOAST_MS);
}

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
      savedNotice('PNG', path);
      return true;
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
    savedNotice('PNG', null);
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
      savedNotice('Timelapse', path);
      return true;
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
    savedNotice('Timelapse', null);
    return true;
  } catch (err) {
    console.error(err);
    toast("Couldn't save the timelapse. Please try another location.", 'error');
    return false;
  }
}
