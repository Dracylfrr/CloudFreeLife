<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { navigate, onBeforeLeave } from '../../core/router';
  import { findStory } from '../../core/content/registry';
  import { settings, updateSettings } from '../../core/settings';
  import { storyProgress, saveStoryPlace, flushStoryProgress } from './progress';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';

  let { storyId }: { storyId: string } = $props();
  const sid = untrack(() => storyId);
  const story = findStory(sid);
  const total = story?.manifest.chapters.length ?? 0;

  // page 0..total-1 are chapters; page === total is "The End"
  const saved = get(storyProgress).stories[sid];
  let page = $state(story ? Math.min(saved?.chapter ?? 0, total - 1) : 0);
  let scroller: HTMLDivElement | undefined = $state();

  const atEnd = $derived(page >= total);
  const chapter = $derived(story && !atEnd ? story.manifest.chapters[page] : null);

  function go(next: number) {
    if (!story) return;
    page = Math.max(0, Math.min(total, next));
    if (page >= total) saveStoryPlace(sid, 0, true);
    else saveStoryPlace(sid, page, false);
    scroller?.scrollTo({ top: 0 });
    sfx.pageTurn();
  }

  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1);
  }

  const bigger = () => updateSettings({ storyFontScale: Math.min(1.7, +(($settings.storyFontScale) + 0.1).toFixed(2)) });
  const smaller = () => updateSettings({ storyFontScale: Math.max(0.9, +(($settings.storyFontScale) - 0.1).toFixed(2)) });

  onMount(() => {
    if (story && !saved) saveStoryPlace(sid, 0, false);
    return onBeforeLeave(flushStoryProgress);
  });
</script>

<svelte:window onkeydown={key} />

<div class="page reader" bind:this={scroller}>
  {#if !story}
    <p>This story isn't available.</p>
    <Button onclick={() => navigate({ name: 'stories' })}>Back to stories</Button>
  {:else}
    <header class="bar">
      <button class="back" onclick={() => navigate({ name: 'stories' })}><Icon name="chevronLeft" size={18} /> Cozy Stories</button>
      <div class="size" role="group" aria-label="Text size">
        <button onclick={smaller} aria-label="Smaller text" title="Smaller text" disabled={$settings.storyFontScale <= 0.91}>A<small>−</small></button>
        <button onclick={bigger} aria-label="Larger text" title="Larger text" disabled={$settings.storyFontScale >= 1.69}>A<small>+</small></button>
      </div>
    </header>

    <article class="paper" style="--fs:{$settings.storyFontScale}; --accent:{story.manifest.accent ?? '#b7a8ec'}">
      <h1 class="title">{story.manifest.name}</h1>
      {#if chapter}
        <p class="eyebrow">Chapter {page + 1} of {total}</p>
        <h2>{chapter.title}</h2>
        <div class="text">
          {#each chapter.text as para}
            <p>{para}</p>
          {/each}
        </div>
      {:else}
        <div class="end">
          <p class="eyebrow">The End</p>
          <h2>Sweet dreams.</h2>
          <p class="blurb">Thank you for reading {story.manifest.name}.</p>
          <div class="end-actions">
            <Button variant="soft" icon="refresh" onclick={() => go(0)}>Read it again</Button>
            <Button variant="primary" icon="bookOpen" onclick={() => navigate({ name: 'stories' })}>More stories</Button>
          </div>
        </div>
      {/if}
    </article>

    <nav class="pager" aria-label="Chapters">
      <Button variant="ghost" icon="chevronLeft" disabled={page === 0} onclick={() => go(page - 1)}>Previous</Button>
      <div class="dots" aria-hidden="true">
        {#each story.manifest.chapters as _, i}<i class:on={i === page} class:past={i < page}></i>{/each}
        <i class="last" class:on={atEnd}></i>
      </div>
      {#if !atEnd}
        <Button variant="primary" onclick={() => go(page + 1)}>{page === total - 1 ? 'Finish' : 'Next'}</Button>
      {:else}
        <span class="spacer"></span>
      {/if}
    </nav>
  {/if}
</div>

<style>
  .reader {
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
    gap: 12px;
    margin-bottom: 14px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
  }
  .size {
    display: inline-flex;
    background: var(--panel-strong);
    border-radius: 999px;
    box-shadow: var(--shadow-s);
    overflow: hidden;
  }
  .size button {
    padding: 6px 16px;
    font-weight: 900;
    font-family: Georgia, 'Times New Roman', serif;
    color: var(--ink);
  }
  .size button:disabled {
    opacity: 0.35;
  }
  .size button:not(:disabled):hover {
    background: var(--lilac);
  }
  .paper {
    width: 100%;
    max-width: 780px;
    background: var(--panel-strong);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-top: 6px solid var(--accent);
    padding: clamp(22px, 5vw, 52px) clamp(20px, 6vw, 64px) clamp(26px, 5vw, 56px);
  }
  .title {
    font-size: 1.15rem;
    color: var(--ink-soft);
    font-weight: 800;
    margin-bottom: 18px;
  }
  .paper h2 {
    font-size: 1.9rem;
    margin: 4px 0 20px;
  }
  .text p {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: calc(1.1rem * var(--fs));
    line-height: 1.85;
    color: var(--ink);
    margin: 0 0 1.05em;
    text-wrap: pretty;
    overflow-wrap: anywhere;
  }
  .text p:first-child::first-letter {
    font-size: 1.9em;
    font-weight: 700;
    color: var(--accent);
    filter: brightness(0.8);
    float: left;
    line-height: 0.95;
    padding: 4px 8px 0 0;
  }
  .end {
    text-align: center;
    padding: 30px 0 14px;
  }
  .blurb {
    color: var(--ink-soft);
    font-size: 1.05rem;
    margin-bottom: 24px;
  }
  .end-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .pager {
    width: 100%;
    max-width: 780px;
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .spacer {
    width: 1px;
  }
  .dots {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(140, 130, 190, 0.28);
    transition: all 0.25s var(--ease);
  }
  .dots i.past {
    background: rgba(140, 130, 190, 0.6);
  }
  .dots i.on {
    width: 26px;
    border-radius: 999px;
    background: var(--lavender-deep);
  }
  @media (max-width: 900px) {
    .paper h2 {
      font-size: 1.5rem;
    }
  }
</style>
