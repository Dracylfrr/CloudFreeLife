<script lang="ts">
  import { navigate } from '../../core/router';
  import ReadingCover from './ReadingCover.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { setFavorite } from './progress';
  import type { ReadingEntry } from './readingList';
  import { sfx } from '../../core/audio';
  import { formatLength } from './longread';

  let { entry, part = '' }: { entry: ReadingEntry; part?: string } = $props();
  const item = $derived((entry.story ?? entry.adventure)!);
  const m = $derived(item.manifest);
  const hue = (g: string) => (g === 'Romance' ? 'pink' : g === 'Comedy' ? 'butter' : g === 'Mystery' ? 'lilac' : g === 'Adventure' ? 'mint' : 'sky');

  function open() {
    sfx.pageTurn();
    if (entry.kind === 'story') navigate({ name: 'story', storyId: entry.id });
    else navigate({ name: 'adventure', adventureId: entry.id });
  }
</script>

<article class="card" style="--accent:{m.accent ?? '#b7a8ec'}">
  <button class="open" onclick={open} aria-label="{entry.kind === 'story' ? 'Read' : 'Play'} {m.name}. {entry.label}">
    <div class="cover"><ReadingCover {item} /></div>
    <div class="info">
      <div class="chips">
        {#if entry.kind === 'adventure' && entry.adventure}
          <span class="chip {hue(entry.adventure.manifest.genre)}">{entry.adventure.manifest.genre}</span>
          <span class="chip who">{entry.adventure.manifest.hero ? `${entry.adventure.manifest.hero}, ` : ''}{entry.adventure.manifest.protagonist === 'girl' ? 'a girl' : 'a guy'}</span>
        {:else if entry.story?.manifest.mood}
          <span class="chip">{entry.story.manifest.mood}</span>
        {/if}
        {#if part}<span class="chip">{part}</span>{/if}
        {#if item.source === 'installed'}<span class="chip new">Downloaded</span>{/if}
      </div>
      <h3>{m.name}</h3>
      <p>{m.description}</p>
      <span class="count">
        <Icon name={entry.kind === 'story' ? 'bookOpen' : 'compass'} size={14} />
        {#if entry.kind === 'story' && entry.story}{entry.story.manifest.chapters.length} chapters{:else}Choose your path{/if}
        · about {formatLength(entry.minutes)}
      </span>
      {#if entry.group !== 'notStarted'}
        <div class="progress" role="img" aria-label={entry.label}>
          <span class="track"><span class="fill" style="width:{entry.percent}%"></span></span>
          <span class="lab">{entry.label}</span>
        </div>
      {/if}
    </div>
  </button>
  <button class="fav" class:on={entry.favorite} aria-pressed={entry.favorite} aria-label={entry.favorite ? `Remove ${m.name} from favorites` : `Add ${m.name} to favorites`} title={entry.favorite ? 'Favorite' : 'Add to favorites'} onclick={() => setFavorite(entry.kind, entry.id, !entry.favorite)}>
    <Icon name="heart" size={18} />
  </button>
</article>

<style>
  .card {
    position: relative;
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
    height: 100%;
  }
  .cover {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-bottom: 5px solid var(--accent);
  }
  .info {
    padding: 10px 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .info h3 {
    font-size: 1.02rem;
    line-height: 1.2;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 24px;
  }
  .chip {
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 800;
    background: var(--lilac);
    color: var(--c-violet);
  }
  .chip.pink {
    background: var(--pink);
    color: var(--c-pink);
  }
  .chip.butter {
    background: var(--c-gold-bg);
    color: var(--c-gold);
  }
  .chip.lilac {
    background: var(--lilac);
    color: var(--c-violet);
  }
  .chip.mint,
  .chip.new {
    background: var(--mint);
    color: var(--c-green);
  }
  .chip.who {
    background: var(--panel-strong);
    color: var(--ink-soft);
    box-shadow: inset 0 0 0 1.5px var(--line);
  }
  .info p {
    color: var(--ink-soft);
    font-size: 0.84rem;
    line-height: 1.4;
  }
  .count {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--accent);
    filter: brightness(0.82);
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
