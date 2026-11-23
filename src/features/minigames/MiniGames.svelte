<script lang="ts">
  import { navigate } from '../../core/router';
  import { catalog, asset } from '../../core/content/registry';
  import Icon from '../../ui/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import { sfx } from '../../core/audio';
  import { GAMES, gameById, type GameLevel } from './games';

  let { game: gameId }: { game?: string } = $props();

  const game = $derived(gameById(gameId));
  const levels = $derived(game ? game.levels($catalog) : []);

  let thumbs = $state<Record<string, string | null>>({});
  $effect(() => {
    const list: GameLevel[] = levels;
    let live = true;
    Promise.all(list.map(async (l) => [l.manifest.id, await asset(l.tree, l.dir, l.manifest.thumbnail).url()] as const)).then((e) => {
      if (live) thumbs = Object.fromEntries(e);
    });
    return () => {
      live = false;
    };
  });
</script>

<div class="page">
  {#if !game}
    <header class="page-head">
      <div>
        <p class="eyebrow">Take a little break</p>
        <h1>Mini-Games</h1>
        <p class="sub">{GAMES.length} calm games. Every level is open from the start — no locks, no pressure.</p>
      </div>
    </header>

    <div class="shelf">
      {#each GAMES as g (g.id)}
        {@const n = g.levels($catalog).length}
        <button
          class="gcard"
          style="--accent:{g.accent}"
          onclick={() => {
            sfx.pageTurn();
            navigate({ name: 'minigames', game: g.id });
          }}
        >
          <div class="cover"><img src={g.cover} alt="" draggable="false" /></div>
          <div class="info">
            <h3>{g.title}</h3>
            <p>{g.blurb}</p>
            <span class="count"><Icon name={g.icon} size={14} /> {g.tagline} · {n} {n === 1 ? 'level' : 'levels'}</span>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <header class="page-head">
      <div>
        <button class="back" onclick={() => navigate({ name: 'minigames' })}><Icon name="chevronLeft" size={18} /> Mini-Games</button>
        <h1>{game.title}</h1>
        <p class="sub">{game.blurb}</p>
      </div>
      {#if game.modes}
        <div class="modes">
          {#each game.modes as m}
            <Button size="sm" variant={m.variant} onclick={() => navigate(m.open($catalog))}>{m.label}</Button>
          {/each}
        </div>
      {:else if levels.length}
        <Button variant="primary" icon="play" onclick={() => navigate(game.open(levels[0].manifest.id))}>Play</Button>
      {/if}
    </header>

    <div class="pages">
      {#each levels as l, i (l.manifest.id)}
        <article class="pg" style="--accent:{game.accent}">
          <button
            class="thumb"
            onclick={() => {
              sfx.pop();
              navigate(game.open(l.manifest.id));
            }}
          >
            {#if thumbs[l.manifest.id]}<img src={thumbs[l.manifest.id]} alt="" draggable="false" />{/if}
          </button>
          <div class="cap">
            <div>
              <span class="num">{String(i + 1).padStart(2, '0')}</span>
              <strong>{l.manifest.name}</strong>
              <p>{l.manifest.objective}</p>
            </div>
            <div class="btns">
              <Button size="sm" variant="primary" icon="play" onclick={() => navigate(game.open(l.manifest.id))}>Play</Button>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 1180px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
    margin-bottom: 8px;
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
    gap: 20px;
  }
  .gcard {
    display: flex;
    flex-direction: column;
    text-align: left;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    overflow: hidden;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease);
  }
  .gcard:hover {
    transform: translateY(-5px) rotate(-0.4deg);
    box-shadow: var(--shadow-l);
  }
  .cover {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-bottom: 5px solid var(--accent);
  }
  .cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .info {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .info p {
    color: var(--ink-soft);
    font-size: 0.88rem;
    line-height: 1.35;
    min-height: 4.1em;
  }
  .count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--accent);
    filter: brightness(0.8);
  }
  .modes {
    display: flex;
    gap: 8px;
    flex: none;
  }
  .pages {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 24px;
  }
  .pg {
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s var(--ease);
  }
  .pg:hover {
    transform: translateY(-4px);
  }
  .thumb {
    aspect-ratio: 4 / 3;
    background: #f4f0fb;
    display: block;
    width: 100%;
    border-bottom: 4px solid var(--accent);
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .cap {
    padding: 14px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    justify-content: space-between;
  }
  .num {
    color: var(--lavender-deep);
    font-weight: 900;
    margin-right: 6px;
  }
  .cap p {
    color: var(--ink-soft);
    font-size: 0.9rem;
    margin-top: 2px;
  }
</style>
