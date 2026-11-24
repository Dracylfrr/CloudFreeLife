<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { findMovement } from '../../core/content/registry';
  import { navigate } from '../../core/router';
  import { sfx } from '../../core/audio';
  import Button from '../../ui/Button.svelte';
  import ContentCover from '../../ui/ContentCover.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { clock } from '../meditation/breath';
  import { markMovementOpened, movementProgress, toggleMovementFavorite } from './progress';

  let { cardId }: { cardId: string } = $props();
  const item = findMovement(untrack(() => cardId));
  const m = item?.manifest;

  let step = $state(0);
  let timerOn = $state(false);
  let left = $state((m?.minutes ?? 1) * 60);
  let interval: ReturnType<typeof setInterval> | null = null;
  let endAt = 0;

  const total = $derived(m?.steps.length ?? 0);
  const current = $derived(m?.steps[step]);
  const fav = $derived(!!m && $movementProgress.favorites.includes(m.id));

  function go(n: number) {
    if (!m) return;
    step = Math.max(0, Math.min(total - 1, n));
    sfx.pageTurn();
  }
  function startTimer() {
    if (!m) return;
    if (left <= 0) left = m.minutes * 60;
    endAt = performance.now() + left * 1000;
    timerOn = true;
    interval = setInterval(() => {
      left = Math.max(0, (endAt - performance.now()) / 1000);
      if (left <= 0) stopTimer(true);
    }, 250);
  }
  function stopTimer(done = false) {
    if (interval) clearInterval(interval);
    interval = null;
    timerOn = false;
    if (done) sfx.bowl(220);
  }
  function resetTimer() {
    stopTimer();
    left = (m?.minutes ?? 1) * 60;
  }
  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') go(step + 1);
    else if (e.key === 'ArrowLeft') go(step - 1);
    else if (e.key === 'Escape') navigate({ name: 'movement' });
  }
  onMount(() => {
    if (m) markMovementOpened(m.id);
  });
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<svelte:window onkeydown={key} />

<div class="page">
  {#if !m || !item}
    <p>This card isn't available.</p>
    <Button onclick={() => navigate({ name: 'movement' })}>Back to Exercise</Button>
  {:else}
    <header class="bar">
      <button class="back" onclick={() => navigate({ name: 'movement' })}><Icon name="chevronLeft" size={18} /> Exercise</button>
      <button class="heart" class:on={fav} aria-pressed={fav} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} onclick={() => toggleMovementFavorite(m.id)}><Icon name="heart" size={18} /></button>
    </header>

    <article class="paper" style="--accent:{m.accent ?? '#b7a8ec'}">
      <div class="art"><ContentCover item={item} file={m.cover} /></div>
      <h1>{m.name}</h1>
      <p class="sub">{m.description} <span class="meta">About {m.minutes} {m.minutes === 1 ? 'minute' : 'minutes'}{m.position ? ` · ${m.position}` : ''}</span></p>

      {#if current}
        <section class="step" aria-live="polite">
          <p class="eyebrow">Step {step + 1} of {total}</p>
          <h2>{current.title}</h2>
          <p class="text">{current.text}</p>
        </section>
      {/if}

      <nav class="pager" aria-label="Steps">
        <Button variant="ghost" icon="chevronLeft" disabled={step === 0} onclick={() => go(step - 1)}>Previous</Button>
        <div class="dots" aria-hidden="true">{#each m.steps as _, i}<i class:on={i === step} class:past={i < step}></i>{/each}</div>
        {#if step < total - 1}
          <Button variant="primary" onclick={() => go(step + 1)}>Next</Button>
        {:else}
          <Button variant="primary" icon="check" onclick={() => navigate({ name: 'movement' })}>All done</Button>
        {/if}
      </nav>

      <div class="timer">
        <span class="clock" role="timer" aria-label="Optional timer">{clock(left)}</span>
        {#if timerOn}
          <Button variant="soft" size="sm" icon="pause" onclick={() => stopTimer()}>Pause timer</Button>
        {:else}
          <Button variant="soft" size="sm" icon="play" onclick={startTimer}>{left < m.minutes * 60 && left > 0 ? 'Resume timer' : 'Start a gentle timer'}</Button>
        {/if}
        {#if left < m.minutes * 60}<Button variant="ghost" size="sm" onclick={resetTimer}>Reset</Button>{/if}
      </div>

      <p class="care"><Icon name="info" size={15} /> General exercise ideas, not medical advice. Go slowly, stay comfortable and stop if anything hurts.</p>
    </article>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .bar {
    width: 100%;
    max-width: 780px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
  }
  .heart {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    background: var(--panel-strong);
    box-shadow: var(--shadow-s);
  }
  .heart.on {
    color: var(--pink-deep);
  }
  .heart.on :global(svg) {
    fill: var(--pink-deep);
  }
  .paper {
    width: 100%;
    max-width: 780px;
    background: var(--panel-strong);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.9);
    border-top: 6px solid var(--accent);
    padding: clamp(18px, 4vw, 36px);
  }
  .art {
    aspect-ratio: 5 / 3;
    /* the picture has no background of its own, so it takes on whatever theme is active */
    background: radial-gradient(120% 120% at 50% 40%, var(--bg-a), var(--bg-c));
    border-radius: 22px;
    overflow: hidden;
    box-shadow: var(--shadow-s);
    margin-bottom: 18px;
  }
  .sub {
    color: var(--ink-soft);
    margin: 4px 0 18px;
  }
  .meta {
    display: inline-block;
    margin-left: 6px;
    font-weight: 800;
    font-size: 0.85rem;
  }
  .step {
    padding: 18px 22px;
    border-radius: 22px;
    background: rgb(var(--w) / 0.55);
  }
  .step h2 {
    margin: 2px 0 8px;
  }
  .text {
    font-size: 1.08rem;
    line-height: 1.65;
    color: var(--ink);
  }
  .pager {
    margin-top: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .dots {
    display: flex;
    gap: 8px;
  }
  .dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--track);
    transition: all 0.25s var(--ease);
  }
  .dots i.past {
    background: var(--lavender);
  }
  .dots i.on {
    width: 26px;
    border-radius: 999px;
    background: var(--lavender-deep);
  }
  .timer {
    margin-top: 22px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
  }
  .clock {
    font-size: 1.3rem;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
    color: var(--ink-soft);
    min-width: 64px;
  }
  .care {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 18px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .care :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
