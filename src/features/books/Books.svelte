<script lang="ts">
  import { navigate } from '../../core/router';
  import { catalog, shelfSort } from '../../core/content/registry';
  import CoverImg from './CoverImg.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';
  import Button from '../../ui/Button.svelte';
  import ImportPanel from '../import/ImportPanel.svelte';

  let importing = $state(false);

  const books = $derived(shelfSort($catalog.books));
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Library</p>
      <h1>Coloring Books</h1>
      <p class="sub">Choose a book, flip to a page and fill it with soft color.</p>
    </div>
    <Button variant="soft" icon="plus" onclick={() => (importing = !importing)}>Import line art</Button>
  </header>

  {#if importing}<ImportPanel onclose={() => (importing = false)} />{/if}

  <div class="shelf">
    {#each books as b (b.manifest.id)}
      <button
        class="book"
        style="--accent:{b.manifest.accent ?? '#b7a8ec'}"
        onclick={() => {
          sfx.pageTurn();
          if (b.manifest.kind === 'free_canvas') navigate({ name: 'draw' });
          else navigate({ name: 'book', bookId: b.manifest.id });
        }}
      >
        <div class="cover"><CoverImg book={b} /></div>
        <div class="info">
          <h3>{b.manifest.name}</h3>
          <p>{b.manifest.description}</p>
          <span class="count">
            {#if b.manifest.kind === 'free_canvas'}
              <Icon name="brush" size={14} /> {b.manifest.backgrounds?.length ?? 0} backgrounds
            {:else}
              <Icon name="image" size={14} /> {b.pages.length} pages
            {/if}
            {#if b.source === 'installed'}<em>Downloaded</em>{/if}
          </span>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
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
  .book {
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
  .book:hover {
    transform: translateY(-5px) rotate(-0.4deg);
    box-shadow: var(--shadow-l);
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
  .info p {
    color: var(--ink-soft);
    font-size: 0.84rem;
    line-height: 1.4;
  }
  .count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--accent);
    filter: brightness(0.82);
  }
  .count em {
    font-style: normal;
    background: var(--mint);
    color: var(--c-green);
    padding: 2px 8px;
    border-radius: 999px;
    margin-left: 4px;
    font-size: 0.72rem;
  }
</style>
