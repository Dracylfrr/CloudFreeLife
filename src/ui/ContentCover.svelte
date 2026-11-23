<script lang="ts">
  import { asset, type Located } from '../core/content/registry';

  // A cover picture for any content item (meditation, movement card, level...). It loads only
  // when shown, and shows a soft placeholder if the picture is missing: nothing ever breaks.
  let { item, file }: { item: Located; file: string } = $props();
  let url = $state<string | null>(null);
  let failed = $state(false);

  $effect(() => {
    const f = file;
    let live = true;
    url = null;
    failed = false;
    asset(item.tree, item.dir, f)
      .url()
      .then((u) => {
        if (!live) return;
        if (u) url = u;
        else failed = true;
      })
      .catch(() => live && (failed = true));
    return () => {
      live = false;
    };
  });
</script>

{#if url && !failed}
  <img src={url} alt="" draggable="false" loading="lazy" decoding="async" onerror={() => (failed = true)} />
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
