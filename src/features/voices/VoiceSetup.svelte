<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { confirmDialog, toast } from '../../core/feedback';
  import { formatBytes } from '../../core/util';
  import { MODEL_BYTES, downloadModel, removeModel } from './model';
  import { stopEngine } from './engine';
  import { stopListening } from './player';
  import { modelReady, refreshModel } from './state';

  let busy = $state(false);
  let done = $state(0);
  let error = $state('');

  onMount(() => void refreshModel());

  async function download() {
    busy = true;
    error = '';
    done = 0;
    const r = await downloadModel((d) => (done = d));
    busy = false;
    await refreshModel();
    if (r.ok) toast('The voices are ready.', 'success', 4000);
    else error = r.message;
  }

  async function remove() {
    const ok = await confirmDialog({ title: 'Remove the voices?', message: 'This frees about 93 MB. Your choices for each character are kept, and you can download the voices again any time.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    stopListening();
    stopEngine();
    await removeModel();
    await refreshModel();
  }

  const pct = $derived(Math.min(100, Math.round((done / MODEL_BYTES) * 100)));
</script>

<div class="setup">
  {#if $modelReady}
    <div class="row">
      <span class="ico ok"><Icon name="check" size={20} /></span>
      <div class="txt">
        <strong>The voices are on this computer</strong>
        <small>Stories can be read aloud, with no internet needed. The speech is made on your computer, so it may pause for a moment to catch up.</small>
      </div>
      <Button size="sm" variant="ghost" icon="trash" onclick={remove}>Remove</Button>
    </div>
  {:else}
    <div class="row">
      <span class="ico"><Icon name="volume" size={20} /></span>
      <div class="txt">
        <strong>Spoken stories</strong>
        <small>Nine voices that read stories aloud. They are downloaded once ({formatBytes(MODEL_BYTES)}), stay on this computer and work offline. You choose whether to download them.</small>
      </div>
      <Button size="sm" variant="primary" icon="download" disabled={busy || $modelReady === null} onclick={download}>{busy ? 'Downloading…' : 'Download voices'}</Button>
    </div>
    {#if busy}
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct} aria-label="Downloading the voices">
        <span style="width:{pct}%"></span>
      </div>
      <p class="fine">{formatBytes(done)} of {formatBytes(MODEL_BYTES)}. Each file is checked before it is used.</p>
    {/if}
    {#if error}<p class="err" role="alert">{error}</p>{/if}
  {/if}
</div>

<style>
  .setup {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-radius: 20px;
    background: rgb(var(--w) / 0.7);
  }
  .ico {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--lilac);
    color: var(--c-violet);
  }
  .ico.ok {
    background: var(--mint);
    color: var(--c-green);
  }
  .txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .txt small,
  .fine {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.82rem;
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
  .err {
    color: var(--c-rose);
    font-weight: 800;
    font-size: 0.88rem;
  }
</style>
