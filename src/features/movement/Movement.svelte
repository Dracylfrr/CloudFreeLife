<script lang="ts">
  import { catalog } from '../../core/content/registry';
  import { navigate } from '../../core/router';
  import { sfx } from '../../core/audio';
  import ContentCover from '../../ui/ContentCover.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { movementProgress, toggleMovementFavorite } from './progress';

  const cards = $derived($catalog.movements);
  let favoritesOnly = $state(false);
  const shown = $derived(favoritesOnly ? cards.filter((c) => $movementProgress.favorites.includes(c.manifest.id)) : cards);

  function open(id: string) {
    sfx.pageTurn();
    navigate({ name: 'moves', cardId: id });
  }
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Take a little break</p>
      <h1>Exercise</h1>
      <p class="sub">Simple, easy ideas for a pleasant exercise break. Pick one, go slowly, and stop whenever you like.</p>
    </div>
    <button class="fav-toggle" class:on={favoritesOnly} aria-pressed={favoritesOnly} onclick={() => (favoritesOnly = !favoritesOnly)}>
      <Icon name="heart" size={16} /> Favorites
    </button>
  </header>

  {#if shown.length === 0}
    <p class="muted">{favoritesOnly ? 'Tap the heart on a card to keep it here.' : 'No exercise cards are installed. New ones arrive through Updates.'}</p>
  {:else}
    <div class="shelf">
      {#each shown as c (c.manifest.id)}
        {@const fav = $movementProgress.favorites.includes(c.manifest.id)}
        <article class="card" style="--accent:{c.manifest.accent ?? '#b7a8ec'}">
          <button class="open" onclick={() => open(c.manifest.id)} aria-label="Open {c.manifest.name}, about {c.manifest.minutes} {c.manifest.minutes === 1 ? 'minute' : 'minutes'}">
            <div class="cover"><ContentCover item={c} file={c.manifest.cover} /></div>
            <div class="info">
              <div class="chips">
                <span class="chip">About {c.manifest.minutes} min</span>
                {#if c.manifest.position}<span class="chip soft">{c.manifest.position}</span>{/if}
              </div>
              <h3>{c.manifest.name}</h3>
              <p>{c.manifest.description}</p>
            </div>
          </button>
          <button class="fav" class:on={fav} aria-pressed={fav} aria-label={fav ? `Remove ${c.manifest.name} from favorites` : `Add ${c.manifest.name} to favorites`} onclick={() => toggleMovementFavorite(c.manifest.id)}>
            <Icon name="heart" size={18} />
          </button>
        </article>
      {/each}
    </div>
  {/if}

  <p class="note"><Icon name="info" size={16} /> These are general exercise ideas, not medical advice. Move slowly, only as far as feels comfortable, and stop if anything hurts. If you have a health concern, please ask a professional.</p>
</div>

<style>
  .fav-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    border-radius: 999px;
    font-weight: 800;
    color: var(--ink-soft);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .fav-toggle.on {
    color: var(--c-violet);
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
  }
  /* five cards across, so the whole shelf shows at once; fewer columns only on a narrow window */
  .shelf {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 1180px) {
    .shelf {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  @media (max-width: 940px) {
    .shelf {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 680px) {
    .shelf {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
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
    aspect-ratio: 5 / 3;
    /* the picture has no background of its own, so it takes on whatever theme is active */
    background: radial-gradient(120% 120% at 50% 40%, var(--bg-a), var(--bg-c));
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
  }
  .chip {
    background: var(--lilac);
    color: var(--c-violet);
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 800;
  }
  .chip.soft {
    background: var(--mint);
    color: var(--c-green);
  }
  .info p {
    color: var(--ink-soft);
    font-size: 0.84rem;
    line-height: 1.4;
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
  }
  .fav:hover,
  .fav.on {
    color: var(--pink-deep);
  }
  .fav.on :global(svg) {
    fill: var(--pink-deep);
  }
  .note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 30px;
    max-width: 780px;
    padding: 12px 16px;
    border-radius: 16px;
    background: rgb(var(--w) / 0.5);
    color: var(--ink-soft);
    font-size: 0.88rem;
    font-weight: 600;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
