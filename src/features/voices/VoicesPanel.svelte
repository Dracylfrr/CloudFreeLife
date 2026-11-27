<script lang="ts">
  import { tick } from 'svelte';
  import { settings } from '../../core/settings';
  import Button from '../../ui/Button.svelte';
  import Slider from '../../ui/Slider.svelte';
  import Select from '../../ui/Select.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { SAMPLE_LINE, SPEED_MAX, SPEED_MIN, VOICES, voiceInfo } from './casts';
  import { previewVoice, stopListening } from './player';
  import { listenState } from './player';
  import { closeVoices, modelReady, resetVoices, saveVoice, speakersFor, voicesPanel } from './state';
  import VoiceSetup from './VoiceSetup.svelte';
  import StoryRecording from './StoryRecording.svelte';

  let dialog = $state<HTMLDivElement | undefined>();
  let opener: HTMLElement | null = null;
  let heard = $state('');

  const target = $derived($voicesPanel);
  // read again whenever a choice is saved
  const speakers = $derived(target ? ($settings.voiceCasts, $settings.voiceNarrator, $settings.voiceNarratorSpeed, speakersFor(target.storyId, target.cast)) : []);
  const anyCustom = $derived(speakers.some((s) => s.custom));
  const options = VOICES.map((v) => ({ value: v.id, label: `${v.name} · ${v.accent} · ${v.feel}` }));

  $effect(() => {
    if (target) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      void tick().then(() => dialog?.focus());
    }
  });

  function close() {
    stopListening();
    closeVoices();
    opener?.focus();
    opener = null;
  }
  function key(e: KeyboardEvent) {
    if (target && e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }
  function hear(id: string, name: string, voice: string, speed: number, isNarrator: boolean) {
    heard = id;
    void previewVoice(isNarrator ? SAMPLE_LINE : `Hello, I am ${name}. ${SAMPLE_LINE}`, voice, speed);
  }
</script>

<svelte:window onkeydown={key} />

{#if target}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" onclick={(e) => e.target === e.currentTarget && close()}>
    <div class="panel" role="dialog" aria-modal="true" aria-labelledby="voices-title" tabindex="-1" bind:this={dialog}>
      <header>
        <div>
          <p class="eyebrow">Read aloud</p>
          <h2 id="voices-title">Voices for {target.title}</h2>
        </div>
        <button class="x" aria-label="Close" onclick={close}>×</button>
      </header>

      {#if speakers[0]}<StoryRecording storyId={target.storyId} voiceId={speakers[0].voice} customCharacters={speakers.slice(1).some((x) => x.custom)} />{/if}

      <details class="live">
        <summary>Voices made on this computer</summary>
        <VoiceSetup />
      </details>

      {#if $modelReady}
        <p class="lead">Pick a voice and a speed for each one. Your choices are saved for this story automatically.</p>
        <ul class="cast">
          {#each speakers as s (s.id)}
            <li class="member" class:custom={s.custom}>
              <div class="who">
                <strong>{s.name}</strong>
                <small>{s.isNarrator ? 'Reads everything that is not spoken' : s.gender === 'f' ? 'Character · female voices suit best' : 'Character · male voices suit best'}</small>
              </div>
              <div class="pick">
                <Select label="Voice" value={s.voice} {options} onchange={(v) => saveVoice(target.storyId, s.id, { voice: v, speed: s.speed })} />
                <Slider label="Speed" value={s.speed} min={SPEED_MIN} max={SPEED_MAX} step={0.05} format={(v) => `${v.toFixed(2).replace(/0$/, '')}×`} onchange={(v) => saveVoice(target.storyId, s.id, { voice: s.voice, speed: v })} />
              </div>
              <Button size="sm" variant="soft" icon="play" disabled={$listenState.status === 'loading' && heard === s.id} onclick={() => hear(s.id, s.name, s.voice, s.speed, s.isNarrator)}>
                {$listenState.status === 'loading' && heard === s.id ? 'Getting ready…' : $listenState.status === 'playing' && heard === s.id ? 'Speaking…' : 'Hear'}
              </Button>
            </li>
          {/each}
        </ul>
        {#if $listenState.status === 'error'}<p class="err" role="alert">{$listenState.message}</p>{/if}
        <footer>
          <p class="fine"><Icon name="check" size={14} /> {voiceInfo(speakers[0]?.voice ?? '')?.name ?? 'Elodie'} is the narrator. Change it for every story in Settings > Voices.</p>
          {#if anyCustom}<Button size="sm" variant="ghost" icon="undo" onclick={() => resetVoices(target.storyId)}>Back to the suggested voices</Button>{/if}
        </footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .live summary {
    cursor: pointer;
    font-weight: 800;
    color: var(--ink-soft);
    padding: 6px 4px;
  }
  .live[open] summary {
    margin-bottom: 8px;
  }
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 70;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(70, 64, 120, 0.34);
    backdrop-filter: blur(4px);
  }
  .panel {
    width: min(720px, 100%);
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    padding: 20px 24px 20px;
    border-radius: var(--radius-xl);
    background: var(--panel-solid);
    color: var(--ink);
    box-shadow: var(--shadow-l);
    border: 1px solid rgb(var(--w) / 0.85);
    outline: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  h2 {
    font-size: 1.3rem;
  }
  .x {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--ink-soft);
  }
  .x:hover {
    background: var(--lilac);
  }
  .lead,
  .fine {
    color: var(--ink-soft);
    font-weight: 700;
  }
  .fine {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
  }
  .cast {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .member {
    display: grid;
    grid-template-columns: 150px 1fr auto;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border-radius: 20px;
    background: rgb(var(--w) / 0.7);
  }
  .member.custom {
    box-shadow: inset 0 0 0 2px var(--lilac);
  }
  .who {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .who small {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.76rem;
    line-height: 1.3;
  }
  .pick {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 14px;
    align-items: end;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .err {
    color: var(--c-rose);
    font-weight: 800;
  }
  @media (max-width: 760px) {
    .member {
      grid-template-columns: 1fr;
    }
    .pick {
      grid-template-columns: 1fr;
    }
  }
</style>
