<script lang="ts">
  import { navigate } from '../../core/router';
  import { catalog } from '../../core/content/registry';
  import { analyzeAdventure, type Protagonist } from '../../core/manifests';
  import { storyProgress } from './progress';
  import ReadingCover from './ReadingCover.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';

  const all = $derived($catalog.adventures);
  let who = $state<'all' | Protagonist>('all');
  let genre = $state<string>('all');

  const genres = $derived([...new Set(all.map((a) => a.manifest.genre))].sort());
  const shown = $derived(all.filter((a) => (who === 'all' || a.manifest.protagonist === who) && (genre === 'all' || a.manifest.genre === genre)));

  function foundOf(id: string, total: number) {
    return Math.min($storyProgress.adventures[id]?.endings.length ?? 0, total);
  }
  /** Mid-story (not finished): more than the first passage read and not sitting on an ending. */
  function inProgress(a: (typeof all)[number]) {
    const path = $storyProgress.adventures[a.manifest.id]?.path ?? [];
    return path.length > 1 && !a.manifest.nodes[path[path.length - 1]]?.ending;
  }
  const endingsOf = (a: (typeof all)[number]) => analyzeAdventure(a.manifest).endings;
  const hue = (g: string) => (g === 'Romance' ? 'pink' : g === 'Comedy' ? 'butter' : g === 'Mystery' ? 'lilac' : g === 'Adventure' ? 'mint' : 'sky');
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Choose your path</p>
      <h1>Story Adventures</h1>
      <p class="sub">Live a story from the inside. Make a choice at every turn and see how many endings you can find.</p>
    </div>
    <span class="pill">{all.length} {all.length === 1 ? 'adventure' : 'adventures'}</span>
  </header>

  <div class="filters" aria-label="Filter adventures">
    <div class="seg" role="group" aria-label="Play as">
      <button class:on={who === 'all'} onclick={() => (who = 'all')}>Everyone</button>
      <button class:on={who === 'guy'} onclick={() => (who = 'guy')}>Play as a guy</button>
      <button class:on={who === 'girl'} onclick={() => (who = 'girl')}>Play as a girl</button>
    </div>
    {#if genres.length > 1}
      <div class="genres" role="group" aria-label="Genre">
        <button class:on={genre === 'all'} onclick={() => (genre = 'all')}>All genres</button>
        {#each genres as g}<button class:on={genre === g} onclick={() => (genre = g)}>{g}</button>{/each}
      </div>
    {/if}
  </div>

  {#if all.length === 0}
    <p class="muted">No adventures are installed yet. New ones arrive through Updates.</p>
  {:else if shown.length === 0}
    <p class="muted">Nothing matches that filter. Try choosing everyone or all genres.</p>
  {:else}
    <div class="shelf">
      {#each shown as a (a.manifest.id)}
        {@const total = endingsOf(a)}
        {@const found = foundOf(a.manifest.id, total)}
        <button
          class="adv"
          style="--accent:{a.manifest.accent ?? '#b7a8ec'}"
          onclick={() => {
            sfx.pageTurn();
            navigate({ name: 'adventure', adventureId: a.manifest.id });
          }}
        >
          <div class="cover"><ReadingCover item={a} /></div>
          <div class="info">
            <div class="chips">
              <span class="chip {hue(a.manifest.genre)}">{a.manifest.genre}</span>
              <span class="chip who">{a.manifest.hero ? `${a.manifest.hero}, ` : ''}{a.manifest.protagonist === 'girl' ? 'a girl' : 'a guy'}</span>
              {#if a.source === 'installed'}<span class="chip new">Downloaded</span>{/if}
            </div>
            <h3>{a.manifest.name}</h3>
            <p>{a.manifest.description}</p>
            <span class="count">
              <Icon name="compass" size={14} />
              {found} of {total} endings{a.manifest.minutes ? ` · about ${a.manifest.minutes} min` : ''}
            </span>
            {#if inProgress(a)}<span class="status">In progress</span>{/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .pill {
    background: var(--panel-strong);
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 800;
    box-shadow: var(--shadow-s);
    white-space: nowrap;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 22px;
    margin-bottom: 24px;
  }
  .seg,
  .genres {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .seg {
    background: var(--panel);
    padding: 5px;
    border-radius: 999px;
    box-shadow: var(--shadow-s);
  }
  .seg button,
  .genres button {
    padding: 7px 16px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.9rem;
    color: var(--ink-soft);
    transition:
      background 0.2s,
      color 0.2s;
  }
  .genres button {
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .seg button:hover,
  .genres button:hover {
    color: var(--ink);
  }
  .seg button.on,
  .genres button.on {
    background: linear-gradient(135deg, #d9eefb, #e6dcfa);
    color: #4c3f9c;
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 26px;
    max-width: 1180px;
  }
  .adv {
    display: flex;
    flex-direction: column;
    text-align: left;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.85);
    overflow: hidden;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease);
  }
  .adv:hover {
    transform: translateY(-5px) rotate(-0.4deg);
    box-shadow: var(--shadow-l);
  }
  .cover {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-bottom: 5px solid var(--accent);
  }
  .info {
    padding: 14px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
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
    background: var(--sky);
    color: #2f5c80;
  }
  .chip.pink {
    background: var(--pink);
    color: #8a3f63;
  }
  .chip.butter {
    background: #fff2bd;
    color: #7a6420;
  }
  .chip.lilac {
    background: var(--lilac);
    color: #5a4a98;
  }
  .chip.mint,
  .chip.new {
    background: var(--mint);
    color: #2e5a4b;
  }
  .chip.who {
    background: var(--panel-strong);
    color: var(--ink-soft);
    box-shadow: inset 0 0 0 1.5px rgba(140, 130, 190, 0.3);
  }
  .info p {
    color: var(--ink-soft);
    font-size: 0.93rem;
    min-height: 2.6em;
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
  .status {
    align-self: flex-start;
    background: var(--peach);
    color: #8a4f3a;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 800;
  }
</style>
