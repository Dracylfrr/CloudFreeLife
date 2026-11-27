<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { settings, updateSettings, resetSettings } from '../../core/settings';
  import { getStorage, isTauri } from '../../core/storage';
  import { formatBytes } from '../../core/util';
  import { confirmDialog, toast } from '../../core/feedback';
  import { APP_VERSION } from '../../core/version';
  import { edition } from '../premium/license';
  import { BRAND_FULL, BRAND_NAME } from '../../core/brand';
  import { sfx, preview } from '../../core/audio';
  import { MOOD_PROFILES } from '../../core/moods';
  import { MUSIC } from '../../core/music';
  import Toggle from '../../ui/Toggle.svelte';
  import { keepsInside, modeInfo, modeList } from '../painting/paintMode';
  import ThemePicker from './ThemePicker.svelte';
  import AppIconPicker from './AppIconPicker.svelte';
  import { MOODS, MUSIC_MOODS, type Mood } from '../../core/settings';
  import Slider from '../../ui/Slider.svelte';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Select from '../../ui/Select.svelte';
  import RecordedVoices from '../voices/RecordedVoices.svelte';
  import VoiceSetup from '../voices/VoiceSetup.svelte';
  import { SAMPLE_LINE, SPEED_MAX, SPEED_MIN, VOICES, withoutNarrator } from '../voices/casts';
  import { listenState, previewVoice } from '../voices/player';
  import { measureFootprint, programSize, type Footprint, type Part } from './footprint';
  import { downloadModel, removeModel, tierBytes } from '../voices/model';
  import { refreshModel } from '../voices/state';
  import { stopEngine } from '../voices/engine';
  import { navigate } from '../../core/router';
  import { modelReady } from '../voices/state';

  let { tab: initial = 'general' }: { tab?: string } = $props();
  const TABS = [
    { id: 'general', label: 'General', icon: 'sliders' },
    { id: 'display', label: 'Display', icon: 'image' },
    { id: 'audio', label: 'Audio', icon: 'volume' },
    { id: 'accessibility', label: 'Accessibility', icon: 'heart' },
    { id: 'voices', label: 'Voices', icon: 'headphones' },
    { id: 'storage', label: 'Storage', icon: 'folder' },
    { id: 'about', label: 'About', icon: 'info' }
  ];
  let tab = $state(untrack(() => initial));

  const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m, MOOD_PROFILES[m].label])) as Record<Mood, string>;
  const MOOD_HINT = Object.fromEntries(MOODS.map((m) => [m, MOOD_PROFILES[m].hint])) as Record<Mood, string>;
  const TRACKS = MUSIC_MOODS.map((id) => MUSIC[id]);

  let root = $state('…');
  let usageArt = $state(0);
  let usageContent = $state(0);
  let backend = $state('');
  let footprint = $state<Footprint | null>(null);
  let working = $state('');
  async function refreshFootprint() {
    footprint = await measureFootprint(await programSize());
  }
  async function fix(p: Part) {
    if (p.remedy === 'gallery') navigate({ name: 'gallery' });
    else if (p.remedy === 'content') navigate({ name: 'updates' });
    else if (p.remedy === 'update-leftovers') {
      await (await getStorage()).remove('update');
      await refreshFootprint();
    } else if (p.remedy === 'voices-standard' || p.remedy === 'voices-fast') {
      const tier = p.remedy === 'voices-fast' ? 'fast' : 'standard';
      if (p.bytes > 0) {
        const ok = await confirmDialog({ title: `Remove the ${p.label.toLowerCase()}?`, message: 'This frees the space. Your choices for each character are kept, and you can download them again any time from here or from Voices.', confirmLabel: 'Remove', danger: true });
        if (!ok) return;
        stopEngine();
        await removeModel(tier);
      } else {
        working = `Downloading the ${p.label.toLowerCase()}…`;
        const r = await downloadModel(tier);
        working = '';
        stopEngine();
        if (!r.ok) toast(r.message, 'error', 6000);
      }
      await refreshModel();
      await refreshFootprint();
    }
  }
  const actionText = (p: Part) => (p.remedy === 'gallery' ? 'Open Gallery' : p.remedy === 'content' ? 'Manage' : p.remedy === 'update-leftovers' ? 'Clear' : p.bytes > 0 ? 'Remove' : 'Download again');

  onMount(async () => {
    const st = await getStorage();
    backend = st.kind;
    root = await st.describeRoot();
    usageArt = await st.usage('artworks');
    usageContent = await st.usage('content');
    void refreshFootprint();
  });

  async function openFolder() {
    if (!isTauri()) {
      toast('The data folder is only available in the desktop app.', 'info');
      return;
    }
    try {
      const { openPath } = await import('@tauri-apps/plugin-opener');
      await openPath(root);
    } catch {
      toast("Couldn't open the folder.", 'error');
    }
  }

  async function resetAll() {
    const ok = await confirmDialog({ title: 'Reset settings?', message: 'Your artwork is not affected. Only settings return to their defaults.', confirmLabel: 'Reset', danger: true });
    if (ok) {
      resetSettings();
      toast('Settings reset', 'success');
    }
  }
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Make it yours</p>
      <h1>Settings</h1>
    </div>
  </header>

  <div class="layout">
    <nav class="tabs" aria-label="Settings sections">
      {#each TABS as t}
        <button class:on={tab === t.id} onclick={() => { tab = t.id; sfx.click(); }}><Icon name={t.icon} size={19} /> {t.label}</button>
      {/each}
    </nav>

    <section class="panel">
      {#if tab === 'general'}
        <h2>General</h2>
        <h3 class="sub">Paint mode on coloring pages</h3>
        <div class="moods" role="radiogroup" aria-label="Paint mode on coloring pages">
          {#each modeList(true) as m (m.id)}
            <button class="chip" class:on={$settings.paintMode === m.id} role="radio" aria-checked={$settings.paintMode === m.id} title={m.hint} onclick={() => { updateSettings({ paintMode: m.id, stayInsideLines: keepsInside(m.id) }); sfx.click(); }}>{m.label}</button>
          {/each}
        </div>
        <p class="muted small">{modeInfo($settings.paintMode, true).hint} You can also change it while you paint.</p>
        <Toggle label="Show brush outline" description="A soft ring shows the size of your brush." checked={$settings.showBrushCursor} onchange={(v) => updateSettings({ showBrushCursor: v })} />
        <p class="note"><Icon name="shield" size={16} /> Resetting a page always asks for confirmation.</p>
        <div class="foot"><Button variant="danger" icon="refresh" onclick={resetAll}>Reset all settings</Button></div>
      {:else if tab === 'display'}
        <h2>Display</h2>
        <h3 class="sub">Theme</h3>
        <ThemePicker />
        <p class="note quiet"><Icon name="shield" size={16} /> Themes only change the app's colors. Your paintings are never affected.</p>
        <h3 class="sub">App icon</h3>
        <AppIconPicker />
        <p class="note quiet"><Icon name="shield" size={16} /> Changes the little logo in the corner and the icon in the window and taskbar. The shortcut and the installed file keep the original icon.</p>
        <h3 class="sub">Mood</h3>
        <div class="moods" role="radiogroup" aria-label="Mood">
          {#each MOODS as m}
            <button class="chip" class:on={$settings.mood === m} role="radio" aria-checked={$settings.mood === m} onclick={() => { updateSettings({ mood: m }); sfx.click(); }}>{MOOD_LABEL[m]}</button>
          {/each}
        </div>
        <p class="muted small">{MOOD_HINT[$settings.mood]}</p>
        <h3 class="sub">Size</h3>
        <Slider label="Interface size" value={$settings.uiScale} min={0.85} max={1.4} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onchange={(v) => updateSettings({ uiScale: v })} />
        <Slider label="Reading size" value={$settings.storyFontScale} min={0.9} max={1.7} step={0.1} format={(v) => `${Math.round(v * 100)}%`} onchange={(v) => updateSettings({ storyFontScale: v })} />
        <Toggle label="Low Power Mode" description="Turns off ambient animation and particles, and lowers game frame rate. Good for batteries and older laptops." checked={$settings.lowPowerMode} onchange={(v) => updateSettings({ lowPowerMode: v })} />
        <Toggle label="30 FPS mode" description="Games render at 30 frames per second to use less CPU and battery." checked={$settings.fps30} onchange={(v) => updateSettings({ fps30: v })} />
      {:else if tab === 'audio'}
        <h2>Audio</h2>
        <Toggle label="Mute everything" checked={$settings.muted} onchange={(v) => updateSettings({ muted: v })} />
        <Slider label="Master" value={$settings.volumeMaster} onchange={(v) => updateSettings({ volumeMaster: v })} onrelease={() => sfx.pop()} />
        <Slider label="Music" value={$settings.volumeMusic} onchange={(v) => updateSettings({ volumeMusic: v })} onrelease={() => preview.music()} />
        <Slider label="Ambience" value={$settings.volumeAmbience} onchange={(v) => updateSettings({ volumeAmbience: v })} onrelease={() => preview.ambience()} />
        <Slider label="Effects" value={$settings.volumeEffects} onchange={(v) => updateSettings({ volumeEffects: v })} onrelease={() => preview.effects()} />
        <Slider label="Painting" value={$settings.volumePainting} onchange={(v) => updateSettings({ volumePainting: v })} onrelease={() => preview.painting()} />
        <p class="muted small">Let go of a slider to hear a short preview. Mute above silences everything, including previews.</p>
        <Toggle label="Background music" description="Soft, gentle music that plays quietly behind the whole app. It is composed on your computer, so nothing is downloaded." checked={$settings.musicOn} onchange={(v) => updateSettings({ musicOn: v })} />
        <div class="tracks" role="radiogroup" aria-label="Music style">
          {#each TRACKS as t}
            {@const on = !($settings.mood !== 'default' && $settings.musicFollowsMood) && $settings.musicMood === t.id}
            <button class="track" class:on role="radio" aria-checked={on} onclick={() => { updateSettings({ musicMood: t.id, musicFollowsMood: false, musicOn: true }); sfx.click(); }}>
              <strong>{t.label}</strong>
              <span>{t.blurb}</span>
            </button>
          {/each}
          {#if $settings.mood !== 'default'}
            <button class="track" class:on={$settings.musicFollowsMood} role="radio" aria-checked={$settings.musicFollowsMood} onclick={() => { updateSettings({ musicFollowsMood: true, musicOn: true }); sfx.click(); }}>
              <strong>Match my mood</strong>
              <span>Let your {MOOD_LABEL[$settings.mood]} mood choose the track.</span>
            </button>
          {/if}
        </div>
        <p class="muted small">Pick a track and it starts playing right away. Tracks are made on your computer, so they never repeat exactly.</p>
        <Toggle label="Gentle ambience" description="A soft, airy background hush." checked={$settings.ambienceOn} onchange={(v) => updateSettings({ ambienceOn: v })} />
      {:else if tab === 'accessibility'}
        <h2>Accessibility</h2>
        <Toggle label="Reduced motion" description="Removes drifting clouds, bubbles and most animation. Nothing decorative moves." checked={$settings.reducedMotion} onchange={(v) => updateSettings({ reducedMotion: v })} />
        <Toggle label="Disable particles" description="No sparkles, bubbles or paint particles in games and effects." checked={$settings.disableParticles} onchange={(v) => updateSettings({ disableParticles: v })} />
        <Toggle label="Higher contrast" description="Darker text and stronger outlines." checked={$settings.highContrast} onchange={(v) => updateSettings({ highContrast: v })} />
      {:else if tab === 'voices'}
        <h2>Voices</h2>
        <p class="note">Stories can be read aloud, with a different voice for each character. Choose the voices here once; each story remembers what you pick for its characters.</p>
        <RecordedVoices />
        <h3 class="mini">Voices made on this computer</h3>
        <p class="note small">If a story has no recording yet, its voices can be made on this computer instead. This needs a download and takes more power.</p>
        <VoiceSetup />
        {#if $modelReady}
          <h3 class="mini">Narrator</h3>
          <Select label="Voice for everything that is not spoken" value={$settings.voiceNarrator} options={VOICES.map((v) => ({ value: v.id, label: `${v.name} · ${v.accent} · ${v.feel}` }))} onchange={(v) => updateSettings({ voiceNarrator: v, voiceCasts: withoutNarrator($settings.voiceCasts) })} />
          <Slider label="Narrator speed" value={$settings.voiceNarratorSpeed} min={SPEED_MIN} max={SPEED_MAX} step={0.05} format={(v) => `${v.toFixed(2).replace(/0$/, '')}×`} onchange={(v) => updateSettings({ voiceNarratorSpeed: v, voiceCasts: withoutNarrator($settings.voiceCasts) })} />
          <div class="hear">
            <Button variant="soft" icon="play" disabled={$listenState.status === 'loading' || $listenState.status === 'playing'} onclick={() => previewVoice(SAMPLE_LINE, $settings.voiceNarrator, $settings.voiceNarratorSpeed)}>
              {$listenState.status === 'loading' ? 'Getting ready…' : $listenState.status === 'playing' ? 'Speaking…' : 'Hear the narrator'}
            </Button>
            {#if $listenState.status === 'loading'}<span class="muted">The first time takes a few seconds on this computer.</span>{/if}
            {#if $listenState.status === 'error'}<p class="note" role="alert">{$listenState.message}</p>{/if}
          </div>
        {/if}
        <p class="note small">Voices: Kokoro-82M (Apache-2.0). Speech engine: ONNX Runtime (MIT) and eSpeak NG (GPL-3.0) through the phonemizer package. Everything runs on this computer. Full notices are in docs/VOICES.md.</p>
      {:else if tab === 'storage'}
        <h2>Storage</h2>
        <div class="total">
          <div>
            <span class="big">{footprint ? formatBytes(footprint.total) : '…'}</span>
            <strong>Everything {BRAND_NAME} uses on this computer</strong>
            {#if footprint}
              <small>
                {#if footprint.program !== null}The program {formatBytes(footprint.program)} · {/if}Your files and downloads {formatBytes(footprint.data)}
              </small>
            {/if}
          </div>
        </div>
        {#if working}<p class="note" role="status">{working}</p>{/if}
        {#if footprint}
          <ul class="parts">
            {#each footprint.parts as p (p.id)}
              <li>
                <div class="what">
                  <strong>{p.label}</strong>
                  <small>{p.note}</small>
                </div>
                <b class="sz">{p.bytes > 0 ? formatBytes(p.bytes) : p.remedy.startsWith('voices') ? `not downloaded (${formatBytes(tierBytes(p.remedy === 'voices-fast' ? 'fast' : 'standard'))})` : '—'}</b>
                {#if p.remedy !== 'none'}<Button size="sm" variant="ghost" disabled={!!working} onclick={() => fix(p)}>{actionText(p)}</Button>{/if}
              </li>
            {/each}
          </ul>
        {/if}
        <div class="kv"><span>Artwork &amp; settings folder</span><code>{root}</code></div>
        <div class="kv"><span>Storage type</span><b>{backend === 'tauri' ? 'Windows app-data folder' : backend === 'browser' ? 'Browser (development)' : backend}</b></div>
        <div class="kv"><span>Artwork size</span><b>{formatBytes(usageArt)}</b></div>
        <div class="kv"><span>Downloaded content</span><b>{formatBytes(usageContent)}</b></div>
        <p class="note"><Icon name="shield" size={16} /> Your art lives outside the install folder, so updating or reinstalling never erases it.</p>
        <div class="foot"><Button variant="soft" icon="folder" onclick={openFolder}>Open folder</Button></div>
      {:else}
        <h2>About</h2>
        <p>{BRAND_FULL} v{APP_VERSION} {$edition} is a calm place to color, draw and play.</p>
        <p class="muted">No accounts, no tracking, no ads. It works fully offline.</p>
      {/if}
    </section>
  </div>
</div>

<style>
  .layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    max-width: 1020px;
  }
  .tabs {
    width: 230px;
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .tabs button {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 16px;
    font-weight: 700;
    color: var(--ink-soft);
    text-align: left;
  }
  .tabs button:hover {
    background: rgb(var(--w) / 0.8);
  }
  .tabs button.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .panel {
    flex: 1;
    min-width: 0;
    padding: 26px 32px 30px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
  }
  .panel h2 {
    margin-bottom: 8px;
  }
  .panel :global(label.row + label.row),
  .panel :global(label.slider + label.slider) {
    border-top: 1px solid var(--line);
  }
  .mini {
    margin-top: 16px;
    font-size: 0.95rem;
  }
  .total {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border-radius: 20px;
    background: rgb(var(--w) / 0.7);
    margin-bottom: 10px;
  }
  .total > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .big {
    font-size: 1.9rem;
    font-weight: 900;
    line-height: 1.1;
  }
  .total small,
  .parts small {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.8rem;
    line-height: 1.35;
  }
  .parts {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .parts li {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 16px;
    border-radius: 18px;
    background: rgb(var(--w) / 0.55);
  }
  .what {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .sz {
    white-space: nowrap;
    font-size: 0.9rem;
  }
  .hear {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .note.small {
    font-size: 0.8rem;
  }
  .note {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding: 12px 16px;
    border-radius: 16px;
    background: var(--c-green-bg);
    color: var(--c-green);
    font-weight: 700;
    font-size: 0.9rem;
  }
  .foot {
    margin-top: 20px;
  }
  .sub {
    margin: 18px 0 2px;
    font-size: 1rem;
    color: var(--ink-soft);
  }
  .small {
    font-size: 0.85rem;
    margin: 6px 2px 0;
  }
  .note.quiet {
    background: rgb(var(--w) / 0.5);
    color: var(--ink-soft);
    font-weight: 600;
  }
  .tracks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 10px;
    margin: 6px 0 4px;
  }
  .track {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgb(var(--w) / 0.55);
    border: 2px solid transparent;
    color: var(--ink);
  }
  .track span {
    font-size: 0.8rem;
    color: var(--ink-soft);
  }
  .track:hover:not(:disabled) {
    background: rgb(var(--w) / 0.9);
  }
  .track.on {
    border-color: var(--lavender-deep);
    background: rgb(var(--w) / 0.9);
  }
  .track:disabled {
    opacity: 0.55;
  }
  .moods {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .chip {
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 700;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.6);
    border: 2px solid transparent;
  }
  .chip:hover {
    background: rgb(var(--w) / 0.9);
  }
  .chip.on {
    border-color: var(--lavender-deep);
    color: var(--ink);
    background: rgb(var(--w) / 0.95);
  }
  .kv {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding: 13px 4px;
    border-bottom: 1px solid var(--line);
    align-items: center;
  }
  .kv span {
    color: var(--ink-soft);
    font-weight: 700;
    flex: none;
  }
  .kv code {
    user-select: text;
    font-size: 0.85rem;
    word-break: break-all;
    text-align: right;
    background: rgb(var(--w) / 0.7);
    padding: 4px 10px;
    border-radius: 10px;
  }
  .kv {
    flex-wrap: wrap;
  }
  .kv code {
    max-width: 100%;
  }
  @media (max-width: 900px) {
    .layout {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    .tabs {
      width: auto;
      flex-direction: row;
      flex-wrap: wrap;
    }
    .panel {
      padding: 20px 18px 24px;
    }
  }
</style>
