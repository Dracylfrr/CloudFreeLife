import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { initAudio } from './core/audio';
import { loadCatalog } from './core/content/registry';
import { loadStoryProgress } from './features/stories/progress';
import { runLeaveGuards } from './core/router';
import { applyUiScale } from './core/display';
import { isAppHidden, onVisibilityChange } from './core/visibility';
import { applySettingsToDocument, getSettings, loadSettings, settings, updateSettings } from './core/settings';
import { getStorage, isTauri } from './core/storage';
import { refreshArtworks } from './features/gallery/artwork';
import { startupUpdateCheck } from './features/updates/updater';

async function boot() {
  const target = document.getElementById('app')!;
  mount(App, { target });

  // Settings first (instant, local), then content. The update check never blocks any of this.
  const st = await getStorage();
  const firstRun = (await st.readText('settings.json')) === null;
  await loadSettings();
  if (firstRun && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) updateSettings({ reducedMotion: true });
  settings.subscribe((s) => {
    applySettingsToDocument(s);
    void applyUiScale(s.uiScale);
  });
  initAudio();

  await Promise.all([loadCatalog(), refreshArtworks(), loadStoryProgress()]);

  // Pause decorative animation when the window is hidden or minimised.
  const syncPaused = () => document.documentElement.setAttribute('data-paused', String(isAppHidden()));
  onVisibilityChange(syncPaused);
  syncPaused();

  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();
    // Make sure the artwork being painted is saved before the window closes.
    await win.onCloseRequested(async (event) => {
      event.preventDefault();
      try {
        await runLeaveGuards();
      } finally {
        await win.destroy();
      }
    });
  } else {
    window.addEventListener('beforeunload', () => void runLeaveGuards());
  }

  startupUpdateCheck();
  void getSettings;
}

boot().catch((err) => {
  console.error('Cloud-Freelife failed to start', err);
  const t = document.getElementById('app');
  if (t) t.textContent = 'Cloud-Freelife could not start. Please restart the app.';
});
