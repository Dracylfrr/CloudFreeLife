<script lang="ts">
  import { navigate } from '../../core/router';
  import { asset, findBook, type LoadedPage } from '../../core/content/registry';
  import { artworks, allForPage } from '../gallery/artwork';
  import { openColoringPage } from './open';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';

  let { bookId }: { bookId: string } = $props();
  const book = $derived(findBook(bookId));

  let thumbs = $state<Record<string, string | null>>({});
  $effect(() => {
    const b = book;
    if (!b) return;
    let live = true;
    Promise.all(b.pages.map(async (p: LoadedPage) => [p.manifest.id, await asset(p.tree, p.dir, p.manifest.thumbnail).url()] as const)).then((entries) => {
      if (live) thumbs = Object.fromEntries(entries);
    });
    return () => {
      live = false;
    };
  });

  function started(p: LoadedPage) {
    return $artworks.some((a) => a.bookId === bookId && a.pageId === p.manifest.id && a.hasPaint);
  }
</script>

<div class="page">
  {#if !book}
    <p>This book isn't available.</p>
    <Button onclick={() => navigate({ name: 'books' })}>Back to books</Button>
  {:else}
    <header class="page-head">
      <div>
        <button class="back" onclick={() => navigate({ name: 'books' })}><Icon name="chevronLeft" size={18} /> Coloring Books</button>
        <h1>{book.manifest.name}</h1>
        <p class="sub">{book.manifest.description}</p>
      </div>
      <span class="pill">{book.pages.length} pages</span>
    </header>

    <div class="pages">
      {#each book.pages as p, i (p.manifest.id)}
        {@const n = allForPage(bookId, p.manifest.id).length}
        <article class="pg">
          <button
            class="thumb"
            onclick={() => {
              sfx.pageTurn();
              openColoringPage(bookId, p.manifest.id);
            }}
          >
            {#if thumbs[p.manifest.id]}<img src={thumbs[p.manifest.id]} alt="" draggable="false" />{/if}
            {#if started(p)}<span class="badge"><Icon name="check" size={13} stroke={3} /> Started</span>{/if}
          </button>
          <div class="cap">
            <div>
              <span class="num">{String(i + 1).padStart(2, '0')}</span>
              <strong>{p.manifest.name}</strong>
              <p>{p.manifest.description}</p>
            </div>
            <div class="btns">
              <Button size="sm" variant="primary" icon="brush" onclick={() => openColoringPage(bookId, p.manifest.id)}>{n ? 'Continue' : 'Paint'}</Button>
              {#if n}
                <Button size="sm" variant="ghost" icon="plus" title="Start a fresh copy of this page" onclick={() => openColoringPage(bookId, p.manifest.id, { fresh: true })}>New copy</Button>
              {/if}
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
    margin-bottom: 8px;
  }
  .pill {
    background: var(--panel-strong);
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 800;
    box-shadow: var(--shadow-s);
  }
  /* five cards across, so the whole shelf shows at once; fewer columns only on a narrow window */
  .pages {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 1180px) {
    .pages {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  @media (max-width: 940px) {
    .pages {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 680px) {
    .pages {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
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
    background: #fffdf8;
    position: relative;
    display: block;
    width: 100%;
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .badge {
    position: absolute;
    top: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--mint);
    color: var(--c-green);
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 800;
  }
  .cap {
    padding: 10px 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    font-size: 0.82rem;
    margin-top: 2px;
  }
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
