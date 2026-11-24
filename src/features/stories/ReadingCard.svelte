<script lang="ts">
  import { navigate } from '../../core/router';
  import ReadingCover from './ReadingCover.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { setFavorite } from './progress';
  import type { ReadingEntry } from './readingList';
  import { sfx } from '../../core/audio';

  // A card is only the picture and the title. The few words about the book wait in a window that
  // opens on a click, so the title does the inviting. A book that is already started shows a
  // Resume button that skips that window and goes straight back in.
  let { entry, part = '', onpreview }: { entry: ReadingEntry; part?: string; onpreview: (e: ReadingEntry) => void } = $props();
  const item = $derived((entry.story ?? entry.adventure)!);
  const m = $derived(item.manifest);

  function resume() {
    sfx.pageTurn();
    if (entry.kind === 'story') navigate({ name: 'story', storyId: entry.id });
    else navigate({ name: 'adventure', adventureId: entry.id });
  }
</script>

<article class="card" style="--accent:{m.accent ?? '#b7a8ec'}">
  <button class="open" onclick={() => onpreview(entry)} aria-label="{m.name}. {entry.label}. Show details" aria-haspopup="dialog">
    <div class="cover"><ReadingCover {item} /></div>
    <div class="info">
      <h3>{m.name}</h3>
      {#if part}<span class="part">{part}</span>{/if}
      {#if entry.group !== 'notStarted'}
        <div class="progress" role="img" aria-label={entry.label}>
          <span class="track"><span class="fill" style="width:{entry.percent}%"></span></span>
          <span class="lab">{entry.label}</span>
        </div>
      {/if}
    </div>
  </button>
  {#if entry.group === 'continue'}
    <button class="resume" onclick={resume} aria-label="Resume {m.name}">
      <Icon name={entry.kind === 'story' ? 'bookOpen' : 'compass'} size={15} /> Resume
    </button>
  {/if}
  <button class="fav" class:on={entry.favorite} aria-pressed={entry.favorite} aria-label={entry.favorite ? `Remove ${m.name} from favorites` : `Add ${m.name} to favorites`} title={entry.favorite ? 'Favorite' : 'Add to favorites'} onclick={() => setFavorite(entry.kind, entry.id, !entry.favorite)}>
    <Icon name="heart" size={18} />
  </button>
</article>

<style>
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    overflow: hidden;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease);
  }
  .card:hover {
    transform: translateY(-5px) rotate(-0.4deg);
    box-shadow: var(--shadow-l);
  }
  .open {
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 100%;
    flex: 1;
  }
  .cover {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-bottom: 5px solid var(--accent);
  }
  .info {
    padding: 10px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .info h3 {
    font-size: 1.02rem;
    line-height: 1.25;
  }
  .part {
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
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
  .resume {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin: 0 12px 12px;
    padding: 8px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--nav-ink);
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    box-shadow: var(--shadow-s);
    transition: transform 0.2s var(--ease);
  }
  .resume:hover {
    transform: translateY(-1px);
  }
  .fav {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.85);
    box-shadow: var(--shadow-s);
    transition: transform 0.2s var(--ease);
  }
  .fav:hover {
    transform: scale(1.1);
    color: var(--pink-deep);
  }
  .fav.on {
    color: var(--pink-deep);
  }
  .fav.on :global(svg) {
    fill: var(--pink-deep);
  }
</style>
