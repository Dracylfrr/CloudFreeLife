<script lang="ts">
  import { asset, type LoadedAdventure, type LoadedStory } from '../../core/content/registry';

  let { item }: { item: LoadedStory | LoadedAdventure } = $props();
  let url = $state<string | null>(null);

  $effect(() => {
    let live = true;
    asset(item.tree, item.dir, item.manifest.cover)
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
    background: linear-gradient(135deg, #e3f1fb, #ece3fb);
  }
</style>
