<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Icon from '../../ui/Icon.svelte';
  import { settings } from '../../core/settings';
  import type { CastMember } from './casts';
  import { listen, listenState, pauseListening, resumeListening, stopListening } from './player';
  import { modelReady, openVoices, refreshModel, speakersFor } from './state';

  // The small "Listen" strip above a story's text: read aloud, pause, and choose the voices.
  let { storyId, title, cast, paragraphs, extras = [], from = 0 }: { storyId: string; title: string; cast: CastMember[] | undefined; paragraphs: readonly string[]; extras?: readonly string[]; from?: number } = $props();

  const busy = $derived($listenState.status === 'loading');
  const playing = $derived($listenState.status === 'playing');
  const paused = $derived($listenState.status === 'paused');
  const active = $derived(busy || playing || paused);

  onMount(() => void refreshModel());
  onDestroy(() => stopListening());

  // a new passage means the old reading is over
  let lastKey = '';
  $effect(() => {
    const key = paragraphs.join('\n');
    if (lastKey && key !== lastKey) stopListening();
    lastKey = key;
  });

  // keep the paragraph being read in view
  $effect(() => {
    const p = $listenState.para;
    if (p < 0 || !active) return;
    const el = document.querySelector<HTMLElement>(`[data-listen-para="${p}"]`);
    el?.scrollIntoView({ block: 'center', behavior: $settings.reducedMotion ? 'auto' : 'smooth' });
  });

  function start() {
    if (!$modelReady) {
      openVoices({ storyId, title, cast });
      return;
    }
    void listen(paragraphs, speakersFor(storyId, cast), { from, extras });
  }
  const voices = () => openVoices({ storyId, title, cast });
</script>

<div class="bar" role="group" aria-label="Read aloud">
  {#if !active}
    <button class="main" onclick={start}><Icon name="volume" size={17} /> {$modelReady ? 'Listen' : 'Listen · set up voices'}</button>
  {:else if busy}
    <button class="main" disabled><Icon name="volume" size={17} /> {$listenState.index > 0 ? 'Catching up…' : 'Getting ready…'}</button>
    <button class="side" onclick={stopListening} aria-label="Stop"><Icon name="stop" size={16} /></button>
  {:else}
    <button class="main" onclick={paused ? resumeListening : pauseListening}>
      <Icon name={paused ? 'play' : 'pause'} size={17} /> {paused ? 'Keep listening' : 'Pause'}
    </button>
    <button class="side" onclick={stopListening} aria-label="Stop"><Icon name="stop" size={16} /></button>
  {/if}
  <button class="side voices" onclick={voices}><Icon name="sliders" size={16} /> Voices</button>
  {#if $listenState.status === 'error'}<span class="err" role="alert">{$listenState.message}</span>{/if}
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 6px 0 14px;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 15px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.88rem;
    box-shadow: var(--shadow-s);
    transition: transform 0.2s var(--ease);
  }
  .main {
    color: var(--nav-ink);
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
  }
  .side {
    color: var(--ink-soft);
    background: var(--panel-strong);
  }
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  button:disabled {
    opacity: 0.7;
  }
  .err {
    color: var(--c-rose);
    font-weight: 800;
    font-size: 0.84rem;
  }
</style>
