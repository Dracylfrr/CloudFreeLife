<script lang="ts">
  import { findBook, catalog } from '../../core/content/registry';
  import { navigate } from '../../core/router';
  import { artworks } from '../gallery/artwork';
  import ArtThumb from '../gallery/ArtThumb.svelte';
  import { startFreeCanvas, openArtwork } from '../books/open';
  import { backgroundCss } from './backgrounds';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';

  const book = $derived.by(() => {
    void $catalog;
    return findBook('free_canvas');
  });
  const recent = $derived($artworks.filter((a) => a.bookId === 'free_canvas').slice(0, 6));
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Free Canvas</p>
      <h1>Free Draw</h1>
      <p class="sub">Pick a soft background and draw whatever you like. Nothing to stay inside.</p>
    </div>
  </header>

  {#if book}
    <div class="bgs">
      {#each book.manifest.backgrounds ?? [] as b (b.id)}
        <button
          class="bg"
          onclick={() => {
            sfx.pageTurn();
            startFreeCanvas(b.id, `Free drawing`);
          }}
        >
          <span class="swatch" class:night={b.type === 'stars'} style="background:{backgroundCss(b)}">
            {#if b.type === 'stars'}
              <i class="s" style="left:18%; top:22%"></i><i class="s" style="left:64%; top:30%"></i><i class="s" style="left:40%; top:64%"></i><i class="s" style="left:80%; top:70%"></i><i class="s" style="left:12%; top:76%"></i>
            {:else if b.type === 'clouds'}
              <i class="c" style="left:14%; top:30%"></i><i class="c" style="left:56%; top:58%; transform:scale(.8)"></i>
            {/if}
            <span class="plus"><Icon name="plus" size={22} /></span>
          </span>
          <strong>{b.name}</strong>
        </button>
      {/each}
    </div>
  {:else}
    <p class="muted">The Free Canvas book isn't installed.</p>
  {/if}

  {#if recent.length}
    <section class="recent">
      <div class="row-head">
        <h2>Continue a drawing</h2>
        <button class="link" onclick={() => navigate({ name: 'gallery' })}>Gallery <Icon name="chevronRight" size={16} /></button>
      </div>
      <div class="rgrid">
        {#each recent as a (a.id)}
          <button class="rcard" onclick={() => openArtwork(a.id)}>
            <ArtThumb art={a} />
            <span>{a.title}</span>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .bgs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 22px;
    max-width: 1100px;
  }
  .bg {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 12px 14px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.85);
    font-weight: 800;
    text-align: left;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease);
  }
  .bg:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-l);
  }
  .swatch {
    aspect-ratio: 4 / 3;
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    display: block;
    box-shadow: inset 0 0 0 1px var(--line);
  }
  .plus {
    position: absolute;
    right: 10px;
    bottom: 10px;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.85);
    color: #6a58c4;
    box-shadow: var(--shadow-s);
  }
  .s {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.6);
  }
  .c {
    position: absolute;
    width: 70px;
    height: 26px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.85);
    box-shadow:
      18px -10px 0 4px rgba(255, 255, 255, 0.85),
      40px -2px 0 0 rgba(255, 255, 255, 0.85);
  }
  .recent {
    margin-top: 42px;
    max-width: 1100px;
  }
  .row-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
  }
  .rgrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 16px;
  }
  .rcard {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 10px 12px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-s);
    font-weight: 700;
    text-align: left;
  }
  .rcard span {
    padding: 0 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
