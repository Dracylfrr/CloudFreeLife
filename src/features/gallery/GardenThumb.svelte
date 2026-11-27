<script lang="ts">
  import { catalog } from '../../core/content/registry';
  import { FIELD_H, FIELD_W, type Garden } from '../minigames/zen/gardens';
  import { drawGarden } from '../minigames/zen/render';

  // A small picture of a saved Zen Garden, drawn the same way the game draws it.
  let { garden }: { garden: Garden } = $props();
  let canvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    const c = canvas;
    if (!c) return;
    const lv = $catalog.zenLevels.find((l) => l.manifest.id === garden.levelId) ?? $catalog.zenLevels[0];
    if (!lv) return;
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(c.width / FIELD_W, 0, 0, c.height / FIELD_H, 0, 0);
    drawGarden(g, garden, lv.manifest);
  });
</script>

<canvas bind:this={canvas} width="360" height="232" aria-hidden="true"></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 360 / 232;
    border-radius: 20px;
  }
</style>
