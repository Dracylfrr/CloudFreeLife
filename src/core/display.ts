import { isTauri } from './storage';

let lastScale = 1;

/** Interface scale. Uses native webview zoom in the desktop app, CSS zoom in a browser. */
export async function applyUiScale(scale: number): Promise<void> {
  if (Math.abs(scale - lastScale) < 0.001) return;
  lastScale = scale;
  try {
    if (isTauri()) {
      const { getCurrentWebview } = await import('@tauri-apps/api/webview');
      await getCurrentWebview().setZoom(scale);
    } else {
      (document.documentElement.style as CSSStyleDeclaration & { zoom: string }).zoom = String(scale);
    }
  } catch (err) {
    console.warn('Could not apply UI scale', err);
  }
}
