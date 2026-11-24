<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { navigate } from '../../core/router';
  import ReadingCover from './ReadingCover.svelte';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { setFavorite } from './progress';
  import type { ReadingEntry } from './readingList';
  import { sfx } from '../../core/audio';
  import { formatLength } from './longread';
  import { analyzeAdventure } from '../../core/manifests';
  import MyAvatar from '../avatar/MyAvatar.svelte';
  import { hasAvatar } from '../avatar/state';
  import { settings } from '../../core/settings';

  // The little trailer for a book: its picture, a few words about it and one clear button.
  // A book that is already started has a Resume button on the shelf and skips this window.
  let { entry, part = '', onclose }: { entry: ReadingEntry; part?: string; onclose: () => void } = $props();
  const item = $derived((entry.story ?? entry.adventure)!);
  const m = $derived(item.manifest);
  const isStory = $derived(entry.kind === 'story');
  const hero = $derived(entry.adventure?.manifest.protagonist === 'hero');
  const endings = $derived(entry.adventure ? analyzeAdventure(entry.adventure.manifest).endings : 0);
  const verb = $derived(entry.group === 'continue' ? 'Resume' : entry.group === 'finished' ? (isStory ? 'Read again' : 'Play again') : isStory ? 'Start reading' : 'Begin the adventure');

  let dialog = $state<HTMLDivElement | undefined>();
  let opener: HTMLElement | null = null;

  onMount(() => {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void tick().then(() => dialog?.focus());
    return () => opener?.focus();
  });

  function go() {
    sfx.pageTurn();
    if (entry.kind === 'story') navigate({ name: 'story', storyId: entry.id });
    else navigate({ name: 'adventure', adventureId: entry.id });
    onclose();
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onclose();
    }
  }
</script>

<svelte:window onkeydown={key} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="scrim" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="preview-title" tabindex="-1" bind:this={dialog} style="--accent:{m.accent ?? '#b7a8ec'}">
    <button class="x" aria-label="Close" onclick={onclose}>×</button>
    <div class="cover"><ReadingCover {item} /></div>
    <div class="body">
      <div class="chips">
        {#if entry.adventure}
          <span class="chip">{entry.adventure.manifest.genre}</span>
          <span class="chip who">{hero ? 'Play as yourself' : `${entry.adventure.manifest.hero ? `${entry.adventure.manifest.hero}, ` : ''}${entry.adventure.manifest.protagonist === 'girl' ? 'a girl' : 'a guy'}`}</span>
        {:else if entry.story?.manifest.mood}
          <span class="chip">{entry.story.manifest.mood}</span>
        {/if}
        {#if part}<span class="chip who">{part}</span>{/if}
      </div>
      <h2 id="preview-title">{m.name}</h2>
      <p class="about">{m.description}</p>
      <p class="facts">
        <Icon name={isStory ? 'bookOpen' : 'compass'} size={15} />
        {#if entry.story}{entry.story.manifest.chapters.length} {entry.story.manifest.chapters.length === 1 ? 'chapter' : 'chapters'}{:else}{endings} endings to find{/if}
        · about {formatLength(entry.minutes)}
      </p>
      {#if hero}
        <p class="you">
          <MyAvatar size={34} />
          <span>{hasAvatar($settings) ? 'You are the hero of this one.' : 'You are the hero of this one. You can choose your avatar from the adventures page.'}</span>
        </p>
      {/if}
      {#if entry.group !== 'notStarted'}
        <div class="progress" role="img" aria-label={entry.label}>
          <span class="track"><span class="fill" style="width:{entry.percent}%"></span></span>
          <span class="lab">{entry.label}</span>
        </div>
      {/if}
      <div class="actions">
        <Button variant="primary" icon={isStory ? 'bookOpen' : 'compass'} onclick={go}>{verb}</Button>
        <button class="fav" class:on={entry.favorite} aria-pressed={entry.favorite} onclick={() => setFavorite(entry.kind, entry.id, !entry.favorite)}>
          <Icon name="heart" size={18} />
          <span>{entry.favorite ? 'In your favorites' : 'Add to favorites'}</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(70, 64, 120, 0.34);
    backdrop-filter: blur(4px);
    animation: fade 0.2s ease-out;
  }
  .panel {
    position: relative;
    width: min(460px, 100%);
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    border-radius: var(--radius-xl);
    background: var(--panel-solid);
    color: var(--ink);
    box-shadow: var(--shadow-l);
    border: 1px solid rgb(var(--w) / 0.85);
    outline: none;
    animation: rise 0.25s var(--ease);
  }
  .cover {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-bottom: 5px solid var(--accent);
  }
  .body {
    padding: 16px 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 800;
    background: var(--lilac);
    color: var(--c-violet);
  }
  .chip.who {
    background: var(--panel-strong);
    color: var(--ink-soft);
    box-shadow: inset 0 0 0 1.5px var(--line);
  }
  h2 {
    font-size: 1.4rem;
    line-height: 1.2;
  }
  .about {
    color: var(--ink-soft);
    line-height: 1.55;
  }
  .facts {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--accent);
    filter: brightness(0.8);
  }
  .you {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--radius-m, 16px);
    background: var(--panel-strong);
    font-weight: 700;
    font-size: 0.86rem;
    color: var(--ink-soft);
  }
  .progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .track {
    display: block;
    height: 7px;
    border-radius: 999px;
    background: var(--track);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--g1), var(--g2));
  }
  .lab {
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
  }
  .fav {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.86rem;
    color: var(--ink-soft);
    background: var(--panel-strong);
  }
  .fav:hover,
  .fav.on {
    color: var(--pink-deep);
  }
  .fav.on :global(svg) {
    fill: var(--pink-deep);
  }
  .x {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.85);
    box-shadow: var(--shadow-s);
  }
  .x:hover {
    background: var(--lilac);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scrim,
    .panel {
      animation: none;
    }
  }
</style>
