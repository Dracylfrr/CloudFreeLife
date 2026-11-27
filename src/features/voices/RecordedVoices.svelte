<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { confirmDialog, toast } from '../../core/feedback';
  import { formatBytes } from '../../core/util';
  import { settings, updateSettings } from '../../core/settings';
  import { VOICES, withoutNarrator, type Voice } from './casts';
  import { downloadPacks, fetchManifest, installedPacks, removePacks, totalBytes, type PackManifest } from './packs';
  import { playSample, samplePlaying, stopSample } from './samples';

  // Every voice with a sample to hear at once, and its ready-made stories to download (all, or one at a time from a story's own Voices window).
  type Row = { state: 'loading' } | { state: 'missing' } | { state: 'offline' } | { state: 'ok'; manifest: PackManifest };
  let rows = $state<Record<string, Row>>({});
  let have = $state<Record<string, Record<string, string>>>({});
  let busy = $state<string | null>(null);
  let done = $state(0);
  let total = $state(1);
  let error = $state('');
  let sampleFailed = $state('');

  async function look(v: Voice) {
    rows[v.id] = { state: 'loading' };
    have[v.id] = await installedPacks(v);
    const r = await fetchManifest(v);
    rows[v.id] = r.ok ? { state: 'ok', manifest: r.manifest } : { state: r.reason === 'missing' ? 'missing' : 'offline' };
  }
  onMount(() => {
    for (const v of VOICES) void look(v);
    return stopSample;
  });

  const count = (v: Voice) => Object.keys(have[v.id] ?? {}).length;
  const wanted = (v: Voice) => {
    const r = rows[v.id];
    if (r?.state !== 'ok') return [] as string[];
    return Object.keys(r.manifest.stories).filter((s) => have[v.id]?.[s] !== r.manifest.stories[s].sha256);
  };

  async function hear(v: Voice) {
    sampleFailed = '';
    if (!(await playSample(v))) sampleFailed = v.name;
  }
  async function download(v: Voice) {
    const r = rows[v.id];
    if (r?.state !== 'ok') return;
    busy = v.id;
    error = '';
    done = 0;
    total = totalBytes(r.manifest, wanted(v));
    const res = await downloadPacks(v, r.manifest, undefined, (d, t) => {
      done = d;
      total = t;
    });
    busy = null;
    have[v.id] = await installedPacks(v);
    if (res.ok) toast(res.count ? `${v.name}'s stories are ready.` : `${v.name}'s stories are all here.`, 'success', 3500);
    else error = res.message;
  }
  async function remove(v: Voice) {
    const ok = await confirmDialog({ title: `Remove ${v.name}'s recordings?`, message: 'This frees the space they use. You can download them again any time.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    await removePacks(v);
    have[v.id] = await installedPacks(v);
  }
  const use = (v: Voice) => updateSettings({ voiceNarrator: v.id, voiceCasts: withoutNarrator($settings.voiceCasts) });
  const pct = $derived(Math.min(100, Math.round((done / Math.max(1, total)) * 100)));
</script>

<div class="rec">
  <p class="lead">
    <strong>Recorded stories</strong> are made once, ready to play: they start at once, use almost no power and work offline. Hear a voice, choose it, then download its stories, all together or one at a time from a story's own Voices window.
  </p>
  <ul>
    {#each VOICES as v (v.id)}
      {@const r = rows[v.id]}
      <li class:chosen={$settings.voiceNarrator === v.id}>
        <button class="hear" onclick={() => hear(v)} aria-label={$samplePlaying === v.id ? `Stop ${v.name}` : `Hear ${v.name}`} aria-pressed={$samplePlaying === v.id}>
          <Icon name={$samplePlaying === v.id ? 'stop' : 'play'} size={16} />
        </button>
        <div class="who">
          <strong>{v.name}</strong>
          <small>{v.accent} · {v.feel}</small>
          <small class="state">
            {#if !r || r.state === 'loading'}Looking…
            {:else if r.state === 'missing'}Recorded stories are coming soon.
            {:else if r.state === 'offline'}Connect to the internet to see what is available.
            {:else}{count(v)} of {Object.keys(r.manifest.stories).length} stories on this computer{#if wanted(v).length} · {formatBytes(totalBytes(r.manifest, wanted(v)))} to download{/if}{/if}
          </small>
        </div>
        <div class="acts">
          {#if $settings.voiceNarrator === v.id}
            <span class="tag"><Icon name="check" size={13} /> Reading voice</span>
          {:else}
            <Button size="sm" variant="soft" onclick={() => use(v)}>Use this voice</Button>
          {/if}
          {#if r?.state === 'ok' && wanted(v).length}
            <Button size="sm" variant="primary" icon="download" disabled={busy !== null} onclick={() => download(v)}>{busy === v.id ? 'Downloading…' : 'Download all'}</Button>
          {/if}
          {#if count(v) > 0}
            <Button size="sm" variant="ghost" icon="trash" disabled={busy !== null} onclick={() => remove(v)} title="Remove the recordings of {v.name}" />
          {/if}
        </div>
      </li>
    {/each}
  </ul>
  {#if busy}
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct} aria-label="Downloading the stories"><span style="width:{pct}%"></span></div>
    <p class="fine">{formatBytes(done)} of {formatBytes(total)}. Each file is checked before it is kept.</p>
  {/if}
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  {#if sampleFailed}<p class="err" role="alert">The sample of {sampleFailed} could not be played.</p>{/if}
</div>

<style>
  .rec {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .lead {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 18px;
    background: rgb(var(--w) / 0.7);
    flex-wrap: wrap;
  }
  li.chosen {
    box-shadow: inset 0 0 0 2px var(--lavender-deep);
  }
  .hear {
    flex: none;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
    box-shadow: var(--shadow-s);
  }
  .who {
    flex: 1;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  small {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.8rem;
  }
  .state {
    color: var(--ink-faint);
  }
  .acts {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.8rem;
    background: var(--mint);
    color: var(--c-green);
  }
  .bar {
    height: 9px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--g1), var(--g2));
    transition: width 0.3s;
  }
  .fine {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.82rem;
  }
  .err {
    color: var(--c-rose);
    font-weight: 800;
    font-size: 0.88rem;
  }
</style>
