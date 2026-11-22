<script lang="ts">
  import { onDestroy } from 'svelte';
  import { findPage, asset } from '../../core/content/registry';
  import { thumbUrl, type ArtworkMeta } from './artwork';
  import { backgroundCss } from '../painting/backgrounds';
  import { findBook } from '../../core/content/registry';

  interface Props {
    art: ArtworkMeta;
    /** bump to force reload (after saves) */
    version?: number;
  }
  let { art, version = 0 }: Props = $props();

  let url = $state<string | null>(null);
  let fallback = $state<string | null>(null);
  let objectUrl: string | null = null;

  $effect(() => {
    void version;
    void art.updatedAt;
    let cancelled = false;
    (async () => {
      const u = art.hasPaint ? await thumbUrl(art.id) : null;
      if (cancelled) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = u;
      url = u;
      if (!u && art.pageId) {
        const p = findPage(art.bookId, art.pageId);
        fallback = p ? await asset(p.tree, p.dir, p.manifest.thumbnail).url() : null;
      }
    })();
    return () => {
      cancelled = true;
    };
  });
  onDestroy(() => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });

  const bg = $derived.by(() => {
    if (art.pageId) return '#fffdf8';
    const book = findBook(art.bookId);
    const def = book?.manifest.backgrounds?.find((b) => b.id === art.background);
    return def ? backgroundCss(def) : '#fffdf8';
  });
</script>

<div class="thumb" style="background:{bg}">
  {#if url}
    <img src={url} alt="" draggable="false" />
  {:else if fallback}
    <img class="ghost" src={fallback} alt="" draggable="false" />
  {/if}
</div>

<style>
  .thumb {
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-m);
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 0 0 1px var(--line);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .ghost {
    opacity: 0.55;
    filter: saturate(0.6);
  }
</style>
