import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { initAudio } from './core/audio';
import { loadCatalog } from './core/content/registry';
import { flushStoryProgress, loadStoryProgress } from './features/stories/progress';
import { loadMeditationProgress, meditationProgress } from './features/meditation/progress';
import { loadMovementProgress, movementProgress } from './features/movement/progress';
import { gamesProgress, loadGamesProgress } from './features/minigames/progress';
import { applyWindowIcon } from './core/appIcon';
import { albums, loadAlbums } from './features/gallery/albums';
import { onBeforeLeave, runLeaveGuards } from './core/router';
import { applyUiScale } from './core/display';
import { isAppHidden, onVisibilityChange } from './core/visibility';
import { applySettingsToDocument, getSettings, loadSettings, settings, updateSettings } from './core/settings';
import { getStorage, isTauri } from './core/storage';
import { refreshArtworks } from './features/gallery/artwork';
import { cleanUpInstallers, startupUpdateCheck } from './features/updates/updater';

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
    void applyWindowIcon(s.appIcon);
  });
  // Follow System: re-apply when the operating system flips between light and dark.
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => applySettingsToDocument(getSettings()));
  initAudio();

  await Promise.all([loadCatalog(), refreshArtworks(), loadStoryProgress(), loadMeditationProgress(), loadMovementProgress(), loadGamesProgress(), loadAlbums()]);
  // Installed themes arrive with the content; show the chosen one now that it can be found.
  applySettingsToDocument(getSettings());
  // Small local progress files are written shortly after a change; this makes sure they are
  // also written when you move to another screen or close the window.
  onBeforeLeave(() => Promise.all([flushStoryProgress(), meditationProgress.flush(), movementProgress.flush(), gamesProgress.flush(), albums.flush()]).then(() => undefined));

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

  // After an update: delete the installer that was used, and any left in Downloads by older versions.
  void cleanUpInstallers();
  setTimeout(() => void cleanUpInstallers(), 30000);
  startupUpdateCheck();
  void getSettings;
}

boot().catch((err) => {
  console.error('Cloud-Freelife failed to start', err);
  const t = document.getElementById('app');
  if (t) t.textContent = 'The app could not start. Please restart it.';
});
