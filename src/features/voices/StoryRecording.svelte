<script lang="ts">
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { toast } from '../../core/feedback';
  import { formatBytes } from '../../core/util';
  import { voiceInfo } from './casts';
  import { downloadPacks, fetchManifest, hasPack, removePacks, type PackManifest } from './packs';
  import { playSample, samplePlaying } from './samples';

  // The ready-made recording of one story, in the narrator's voice: hear the voice, download this story, or remove it.
  let { storyId, voiceId, customCharacters }: { storyId: string; voiceId: string; customCharacters: boolean } = $props();

  const voice = $derived(voiceInfo(voiceId));
  let manifest = $state<PackManifest | null>(null);
  let look = $state<'loading' | 'missing' | 'offline' | 'ok'>('loading');
  let here = $state(false);
  let busy = $state(false);
  let done = $state(0);
  let error = $state('');

  $effect(() => {
    const v = voice;
    const story = storyId;
    let live = true;
    look = 'loading';
    manifest = null;
    error = '';
    if (!v) return;
    void hasPack(v, story).then((h) => live && (here = h));
    void fetchManifest(v).then((r) => {
      if (!live) return;
      if (r.ok) {
        manifest = r.manifest;
        look = 'ok';
      } else look = r.reason === 'missing' ? 'missing' : 'offline';
    });
    return () => (live = false);
  });

  const entry = $derived(manifest?.stories[storyId]);

  async function download() {
    if (!voice || !manifest || !entry) return;
    busy = true;
    error = '';
    done = 0;
    const r = await downloadPacks(voice, manifest, [storyId], (d) => (done = d));
    busy = false;
    here = await hasPack(voice, storyId);
    if (r.ok) toast(`${voice.name} will read this story from the recording.`, 'success', 3500);
    else error = r.message;
  }
  async function remove() {
    if (!voice) return;
    await removePacks(voice, storyId);
    here = false;
  }
</script>

{#if voice}
  <section class="rec" aria-label="Recorded story">
    <button class="hear" onclick={() => voice && playSample(voice)} aria-label={$samplePlaying === voice.id ? `Stop ${voice.name}` : `Hear ${voice.name}`}>
      <Icon name={$samplePlaying === voice.id ? 'stop' : 'play'} size={15} />
    </button>
    <div class="txt">
      <strong>Recorded story · {voice.name}</strong>
      <small>
        {#if here}This story is on this computer. It starts at once and works offline.{customCharacters ? ' You changed some character voices, so those are made live instead.' : ''}
        {:else if look === 'loading'}Looking…
        {:else if look === 'ok' && entry}A ready-made recording, {formatBytes(entry.size)}. It starts at once and works offline.
        {:else if look === 'ok'}This story has no recording in {voice.name}'s voice yet.
        {:else if look === 'missing'}Recorded stories are coming soon.
        {:else}Connect to the internet to see whether a recording is available.{/if}
      </small>
      {#if busy && entry}<small>{formatBytes(done)} of {formatBytes(entry.size)}</small>{/if}
      {#if error}<small class="err" role="alert">{error}</small>{/if}
    </div>
    {#if here}
      <Button size="sm" variant="ghost" icon="trash" onclick={remove}>Remove</Button>
    {:else if look === 'ok' && entry}
      <Button size="sm" variant="primary" icon="download" disabled={busy} onclick={download}>{busy ? 'Downloading…' : 'Download'}</Button>
    {/if}
  </section>
{/if}

<style>
  .rec {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 18px;
    background: rgb(var(--w) / 0.7);
    flex-wrap: wrap;
  }
  .hear {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
    box-shadow: var(--shadow-s);
  }
  .txt {
    flex: 1;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  small {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.8rem;
    line-height: 1.4;
  }
  .err {
    color: var(--c-rose);
    font-weight: 800;
  }
</style>
