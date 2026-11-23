<script lang="ts">
  import { asset, type LoadedStory } from '../../core/content/registry';

  // One optional picture. It loads only when the page that shows it is opened, and if the file
  // is missing or broken the whole figure disappears: reading never depends on a picture.
  let {
    story,
    file,
    alt = '',
    caption = '',
    wide = false
  }: { story: LoadedStory; file: string; alt?: string; caption?: string; wide?: boolean } = $props();

  let url = $state<string | null>(null);
  let failed = $state(false);
  let ready = $state(false);

  $effect(() => {
    const f = file;
    let live = true;
    url = null;
    failed = false;
    ready = false;
    asset(story.tree, story.dir, f)
      .url()
      .then((u) => {
        if (!live) return;
        if (u) url = u;
        else failed = true;
      })
      .catch(() => {
        if (live) failed = true;
      });
    return () => {
      live = false;
    };
  });
</script>

{#if !failed}
  <figure class="art" class:wide class:ready>
    {#if url}
      <img src={url} {alt} loading="lazy" decoding="async" draggable="false" onload={() => (ready = true)} onerror={() => (failed = true)} />
    {/if}
    {#if caption && ready}<figcaption>{caption}</figcaption>{/if}
  </figure>
{/if}

<style>
  .art {
    margin: 4px 0 22px;
    border-radius: 22px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    box-shadow: var(--shadow-s);
    aspect-ratio: 5 / 3;
    position: relative;
  }
  .art.wide {
    aspect-ratio: 2 / 1;
  }
  .art.ready {
    aspect-ratio: auto;
    background: none;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    opacity: 0;
    transition: opacity 0.5s var(--ease);
  }
  .ready img {
    opacity: 1;
  }
  figcaption {
    padding: 8px 16px 10px;
    font-size: 0.85rem;
    font-style: italic;
    color: var(--ink-soft);
    text-align: center;
    background: rgb(var(--w) / 0.5);
  }
</style>
