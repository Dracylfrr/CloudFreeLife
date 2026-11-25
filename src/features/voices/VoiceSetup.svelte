<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { confirmDialog, toast } from '../../core/feedback';
  import { formatBytes } from '../../core/util';
  import { TIER_LABEL, downloadModel, removeModel, tierBytes, type Tier } from './model';
  import { engineState, stopEngine } from './engine';
  import { stopListening } from './player';
  import { graphicsChipUsable } from './acceleration';
  import { modelReady, modelTiers, refreshModel } from './state';

  let busy = $state<Tier | null>(null);
  let done = $state(0);
  let total = $state(1);
  let error = $state('');
  let chip = $state<boolean | null>(null);

  onMount(() => {
    void refreshModel();
    void graphicsChipUsable().then((v) => (chip = v));
  });

  async function download(tier: Tier) {
    busy = tier;
    error = '';
    done = 0;
    total = tierBytes(tier);
    const r = await downloadModel(tier, (d, t) => {
      done = d;
      total = t;
    });
    busy = null;
    stopEngine(); // the next Listen picks the best voices it now has
    await refreshModel();
    if (r.ok) toast(`${TIER_LABEL[tier]} are ready.`, 'success', 4000);
    else error = r.message;
  }

  async function remove(tier: Tier) {
    const ok = await confirmDialog({
      title: `Remove the ${TIER_LABEL[tier].toLowerCase()}?`,
      message: `This frees ${formatBytes(tierBytes(tier))} or so. Your choices for each character are kept, and you can download them again any time.`,
      confirmLabel: 'Remove',
      danger: true
    });
    if (!ok) return;
    stopListening();
    stopEngine();
    await removeModel(tier);
    await refreshModel();
  }

  const pct = $derived(Math.min(100, Math.round((done / Math.max(1, total)) * 100)));
  const using = $derived($engineState.status === 'ready' ? ($engineState.mode === 'gpu' ? 'the graphics chip' : 'the processor') : '');
</script>

<div class="setup">
  <p class="lead">
    Spoken stories use voices that are downloaded once, stay on this computer and work offline. You choose whether to download them, and you can remove them and download them again whenever you like.
  </p>

  <div class="row" class:on={$modelTiers.fast}>
    <span class="ico" class:ok={$modelTiers.fast}><Icon name={$modelTiers.fast ? 'check' : 'sparkle'} size={20} /></span>
    <div class="txt">
      <strong>{TIER_LABEL.fast}{chip && !$modelTiers.fast ? ' (recommended)' : ''}</strong>
      <small>
        {#if chip === false}This computer cannot use its graphics chip for speech, so these would not work here. Use the standard voices.
        {:else}Uses your graphics chip, so speech is made several times faster than it is spoken and stories flow without waiting. {formatBytes(tierBytes('fast'))}.{/if}
      </small>
    </div>
    {#if $modelTiers.fast}
      <Button size="sm" variant="ghost" icon="trash" disabled={busy !== null} onclick={() => remove('fast')}>Remove</Button>
    {:else}
      <Button size="sm" variant="primary" icon="download" disabled={busy !== null || chip === false || chip === null} onclick={() => download('fast')}>{busy === 'fast' ? 'Downloading…' : 'Download'}</Button>
    {/if}
  </div>

  <div class="row" class:on={$modelTiers.standard}>
    <span class="ico" class:ok={$modelTiers.standard}><Icon name={$modelTiers.standard ? 'check' : 'volume'} size={20} /></span>
    <div class="txt">
      <strong>{TIER_LABEL.standard}</strong>
      <small>Works on every computer, but speech takes about as long to make as it lasts, so stories pause now and then to catch up. {formatBytes(tierBytes('standard'))}.</small>
    </div>
    {#if $modelTiers.standard}
      <Button size="sm" variant="ghost" icon="trash" disabled={busy !== null} onclick={() => remove('standard')}>Remove</Button>
    {:else}
      <Button size="sm" variant={chip ? 'soft' : 'primary'} icon="download" disabled={busy !== null} onclick={() => download('standard')}>{busy === 'standard' ? 'Downloading…' : 'Download'}</Button>
    {/if}
  </div>

  {#if busy}
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct} aria-label="Downloading the voices">
      <span style="width:{pct}%"></span>
    </div>
    <p class="fine">{formatBytes(done)} of {formatBytes(total)}. Each file is checked before it is used.</p>
  {/if}
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  {#if $modelReady}
    <p class="fine">
      {#if using}Speaking with {using} right now.{:else if $modelTiers.fast && chip}The next time you press Listen, your graphics chip will be used.{:else}Ready. Press Listen on any story.{/if}
    </p>
  {/if}
</div>

<style>
  .setup {
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
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-radius: 20px;
    background: rgb(var(--w) / 0.7);
  }
  .row.on {
    box-shadow: inset 0 0 0 2px var(--mint);
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
    line-height: 1.4;
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
