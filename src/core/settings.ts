import { get, writable, type Readable } from 'svelte/store';
import { getStorage } from './storage';
import { clamp, debounce } from './util';

export const SETTINGS_PATH = 'settings.json';
export const SETTINGS_SCHEMA = 1;

export interface Settings {
  schema: number;
  // General
  stayInsideLines: boolean;
  showBrushCursor: boolean;
  confirmBeforeReset: boolean;
  // Display
  uiScale: number; // 0.85 - 1.4
  lowPowerMode: boolean;
  fps30: boolean;
  /** Reading size in Cozy Stories and Story Adventures (1 = normal). */
  storyFontScale: number; // 0.9 - 1.7
  // Accessibility
  reducedMotion: boolean;
  disableParticles: boolean;
  highContrast: boolean;
  // Audio (0..1)
  muted: boolean;
  volumeMaster: number;
  volumeMusic: number;
  volumeAmbience: number;
  volumeEffects: number;
  volumePainting: number;
  musicOn: boolean;
  ambienceOn: boolean;
  // Updates
  checkUpdatesOnStartup: boolean;
  lastUpdateCheck: number; // epoch ms, 0 = never
  dismissedUpdates: string[];
  // Painting memory
  paletteId: string;
  lastColor: string;
  brushSize: number;
}

export const DEFAULT_SETTINGS: Settings = {
  schema: SETTINGS_SCHEMA,
  stayInsideLines: true,
  showBrushCursor: true,
  confirmBeforeReset: true,
  uiScale: 1,
  lowPowerMode: false,
  fps30: false,
  storyFontScale: 1.1,
  reducedMotion: false,
  disableParticles: false,
  highContrast: false,
  muted: false,
  volumeMaster: 0.7,
  volumeMusic: 0.35,
  volumeAmbience: 0.3,
  volumeEffects: 0.6,
  volumePainting: 0.4,
  musicOn: false,
  ambienceOn: false,
  checkUpdatesOnStartup: true,
  lastUpdateCheck: 0,
  dismissedUpdates: [],
  paletteId: 'cloud_morning',
  lastColor: '#a9d4f5',
  brushSize: 18
};

const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const num = (v: unknown, d: number, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : d;
const str = (v: unknown, d: string) => (typeof v === 'string' && v.length > 0 && v.length < 200 ? v : d);

/** Merges untrusted/old data onto the defaults. Unknown keys are dropped. */
export function sanitizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    schema: SETTINGS_SCHEMA,
    stayInsideLines: bool(r.stayInsideLines, d.stayInsideLines),
    showBrushCursor: bool(r.showBrushCursor, d.showBrushCursor),
    confirmBeforeReset: true, // reset confirmation is mandatory
    uiScale: num(r.uiScale, d.uiScale, 0.85, 1.4),
    lowPowerMode: bool(r.lowPowerMode, d.lowPowerMode),
    fps30: bool(r.fps30, d.fps30),
    storyFontScale: num(r.storyFontScale, d.storyFontScale, 0.9, 1.7),
    reducedMotion: bool(r.reducedMotion, d.reducedMotion),
    disableParticles: bool(r.disableParticles, d.disableParticles),
    highContrast: bool(r.highContrast, d.highContrast),
    muted: bool(r.muted, d.muted),
    volumeMaster: num(r.volumeMaster, d.volumeMaster, 0, 1),
    volumeMusic: num(r.volumeMusic, d.volumeMusic, 0, 1),
    volumeAmbience: num(r.volumeAmbience, d.volumeAmbience, 0, 1),
    volumeEffects: num(r.volumeEffects, d.volumeEffects, 0, 1),
    volumePainting: num(r.volumePainting, d.volumePainting, 0, 1),
    musicOn: bool(r.musicOn, d.musicOn),
    ambienceOn: bool(r.ambienceOn, d.ambienceOn),
    checkUpdatesOnStartup: bool(r.checkUpdatesOnStartup, d.checkUpdatesOnStartup),
    lastUpdateCheck: num(r.lastUpdateCheck, 0, 0, Number.MAX_SAFE_INTEGER),
    dismissedUpdates: Array.isArray(r.dismissedUpdates)
      ? r.dismissedUpdates.filter((x): x is string => typeof x === 'string').slice(-50)
      : [],
    paletteId: str(r.paletteId, d.paletteId),
    lastColor: typeof r.lastColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(r.lastColor) ? r.lastColor : d.lastColor,
    brushSize: num(r.brushSize, d.brushSize, 2, 120)
  };
}

const store = writable<Settings>({ ...DEFAULT_SETTINGS });
export const settings: Readable<Settings> = { subscribe: store.subscribe };

let loaded = false;
let lastSaveError: unknown = null;

export async function loadSettings(): Promise<Settings> {
  try {
    const storage = await getStorage();
    const text = await storage.readText(SETTINGS_PATH);
    store.set(sanitizeSettings(text ? JSON.parse(text) : {}));
  } catch (err) {
    console.warn('Could not read settings, using defaults', err);
    store.set({ ...DEFAULT_SETTINGS });
  }
  loaded = true;
  return get(store);
}

export async function saveSettingsNow(): Promise<void> {
  try {
    const storage = await getStorage();
    await storage.writeText(SETTINGS_PATH, JSON.stringify(get(store), null, 2));
    lastSaveError = null;
  } catch (err) {
    lastSaveError = err;
    console.warn('Could not save settings', err);
  }
}

const saveSoon = debounce(() => void saveSettingsNow(), 400);

export function updateSettings(patch: Partial<Settings>): void {
  store.update((s) => sanitizeSettings({ ...s, ...patch }));
  if (loaded) saveSoon();
}

export function resetSettings(): void {
  store.set({ ...DEFAULT_SETTINGS });
  saveSoon();
}

export function settingsSaveError() {
  return lastSaveError;
}

/** Test hook. */
export function __resetSettingsForTests() {
  store.set({ ...DEFAULT_SETTINGS });
  loaded = false;
}

export function getSettings(): Settings {
  return get(store);
}

/** True when ambient/decorative motion should be suppressed. */
export function motionReduced(s: Settings = get(store)): boolean {
  return s.reducedMotion;
}

export function applySettingsToDocument(s: Settings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.motion = s.reducedMotion || s.lowPowerMode ? 'reduced' : 'full';
  root.dataset.contrast = s.highContrast ? 'high' : 'normal';
  root.dataset.particles = s.disableParticles || s.lowPowerMode ? 'off' : 'on';
}
