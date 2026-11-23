<script lang="ts">
  import { asset, type LoadedBook } from '../../core/content/registry';

  let { book }: { book: LoadedBook } = $props();
  let url = $state<string | null>(null);

  $effect(() => {
    let live = true;
    asset(book.tree, book.dir, book.manifest.cover)
      .url()
      .then((u) => {
        if (live) url = u;
      });
    return () => {
      live = false;
    };
  });
</script>

{#if url}
  <img src={url} alt="" draggable="false" />
{:else}
  <div class="ph"></div>
{/if}

<style>
  img,
  .ph {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .ph {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
  }
</style>
