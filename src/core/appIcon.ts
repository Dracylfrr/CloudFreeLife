/**
 * App icon choices. Every choice is the same little cloud with a different soft background, so
 * the app stays recognisable. The choice changes the icon in the app's own corner logo and the
 * window / taskbar icon while the app is running. (The installed shortcut and the .exe file keep
 * the original icon: Windows only reads those from the file itself.)
 */
import { isTauri } from './storage';

export type AppIconId = 'cloud' | 'lavender' | 'mint' | 'peach' | 'night';

export interface AppIconDef {
  id: AppIconId;
  name: string;
  /** Three background gradient stops. */
  bg: [string, string, string];
  cloud: [string, string];
  /** The pastel paint mark under the cloud. */
  mark: string;
  sparkle: string;
}

export const APP_ICONS: readonly AppIconDef[] = [
  { id: 'cloud', name: 'Morning Cloud', bg: ['#bfe4f7', '#d8cdf5', '#f6cfe3'], cloud: ['#ffffff', '#eef3fc'], mark: '#ffb7d1', sparkle: '#fff9d6' },
  { id: 'lavender', name: 'Lavender Dusk', bg: ['#d9cdf6', '#e6d0f5', '#fbd0e6'], cloud: ['#ffffff', '#f3eefc'], mark: '#bfe4f7', sparkle: '#fff9d6' },
  { id: 'mint', name: 'Mint Meadow', bg: ['#c6ecda', '#bfe4f7', '#e3f3d0'], cloud: ['#ffffff', '#eef8f4'], mark: '#ffd3e2', sparkle: '#fffbe0' },
  { id: 'peach', name: 'Peach Sunrise', bg: ['#ffdcc8', '#fbd5dc', '#fff2bd'], cloud: ['#ffffff', '#fdf3ee'], mark: '#c9b8f2', sparkle: '#ffffff' },
  { id: 'night', name: 'Moonlit Cloud', bg: ['#4a4a86', '#5d56a0', '#7a64a8'], cloud: ['#f4f2ff', '#dcd8f4'], mark: '#ffb7d1', sparkle: '#fff3c4' }
];

export const DEFAULT_APP_ICON: AppIconId = 'cloud';

export function isAppIcon(v: unknown): v is AppIconId {
  return typeof v === 'string' && APP_ICONS.some((i) => i.id === v);
}

export function appIconById(id: unknown): AppIconDef {
  return APP_ICONS.find((i) => i.id === id) ?? APP_ICONS[0];
}

let counter = 0;
/** A unique id prefix so several icons on one screen never share gradient names. */
export const nextIconUid = () => `ai${++counter}`;

/** The whole icon as an SVG string (a square, 512 units). `uid` keeps gradient ids unique. */
export function iconSvg(id: unknown, size = 512, uid = 'ai'): string {
  const d = appIconById(id);
  const night = d.id === 'night';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" aria-hidden="true">
<defs>
<linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${d.bg[0]}"/><stop offset="0.55" stop-color="${d.bg[1]}"/><stop offset="1" stop-color="${d.bg[2]}"/></linearGradient>
<linearGradient id="${uid}-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.cloud[0]}"/><stop offset="1" stop-color="${d.cloud[1]}"/></linearGradient>
<linearGradient id="${uid}-hd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd3b8"/><stop offset="1" stop-color="#ffbf9c"/></linearGradient>
</defs>
<rect x="16" y="16" width="480" height="480" rx="116" fill="url(#${uid}-bg)"/>
<g fill="${d.sparkle}" opacity="0.95"><path d="M118 112 l7 18 18 7 -18 7 -7 18 -7 -18 -18 -7 18 -7z"/><path d="M404 92 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5z"/>${night ? '<path d="M430 220 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/><circle cx="92" cy="206" r="6"/>' : ''}</g>
<circle cx="86" cy="196" r="9" fill="#ffffff" opacity="0.55"/><circle cx="430" cy="214" r="6" fill="#ffffff" opacity="0.55"/>
<path d="M74 408 C 120 372, 168 442, 222 406 C 262 380, 292 420, 330 402" fill="none" stroke="${d.mark}" stroke-width="26" stroke-linecap="round"/>
<path d="M96 424 C 140 392, 182 452, 232 424" fill="none" stroke="#fff0a8" stroke-width="12" stroke-linecap="round" opacity="0.9"/>
<circle cx="378" cy="418" r="11" fill="#c9b8f2"/>
<g fill="url(#${uid}-cl)"><circle cx="170" cy="286" r="66"/><circle cx="252" cy="226" r="86"/><circle cx="340" cy="276" r="72"/><rect x="116" y="272" width="300" height="102" rx="51"/></g>
<ellipse cx="216" cy="300" rx="9" ry="11" fill="#6f6a92"/><ellipse cx="296" cy="300" rx="9" ry="11" fill="#6f6a92"/>
<circle cx="219" cy="296" r="3.2" fill="#fff"/><circle cx="299" cy="296" r="3.2" fill="#fff"/>
<ellipse cx="190" cy="326" rx="17" ry="10" fill="#ffc0d6" opacity="0.8"/><ellipse cx="322" cy="326" rx="17" ry="10" fill="#ffc0d6" opacity="0.8"/>
<path d="M240 322 q16 18 32 0" fill="none" stroke="#6f6a92" stroke-width="6" stroke-linecap="round"/>
<g transform="translate(34 -4) rotate(38 356 300)"><rect x="337" y="96" width="38" height="196" rx="19" fill="url(#${uid}-hd)"/><rect x="337" y="120" width="38" height="14" fill="#c9b8f2" opacity="0.85"/><rect x="333" y="282" width="46" height="46" rx="9" fill="#dfe6f3"/><rect x="333" y="296" width="46" height="6" fill="#c3cde2"/><path d="M335 326 C 333 364, 350 388, 356 404 C 362 388, 379 364, 377 326 Z" fill="#ffa6c9"/></g>
</svg>`;
}

let applied: AppIconId | null = null;

/**
 * Changes the window and taskbar icon (desktop app only). The original icon is already in place
 * at start-up, so nothing is done until a different one is chosen. Failure is harmless: the
 * icon simply stays as it was.
 */
export async function applyWindowIcon(id: AppIconId): Promise<boolean> {
  if (!isTauri()) return false;
  if (applied === null && id === DEFAULT_APP_ICON) return false;
  if (applied === id) return false;
  try {
    const { rasterizeSvg, canvasToPng } = await import('../features/painting/raster');
    const png = await canvasToPng(await rasterizeSvg(iconSvg(id, 256, 'win'), 256, 256));
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().setIcon(png);
    applied = id;
    return true;
  } catch (err) {
    console.warn('Could not change the window icon', err);
    return false;
  }
}
