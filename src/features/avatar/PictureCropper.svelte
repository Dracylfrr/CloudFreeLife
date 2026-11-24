<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../ui/Button.svelte';
  import Slider from '../../ui/Slider.svelte';
  import { DEFAULT_CROP, PICTURE_SIZE, ZOOM_MAX, ZOOM_MIN, clampOffset, drawCrop, type CropState } from './picture';

  /**
   * Lets the person place their picture inside the round avatar: drag to move, wheel or slider to
   * zoom, slider or buttons to turn. Nothing is saved until they press "Use this picture".
   */
  let { file, ondone, oncancel }: { file: File; ondone: (png: Uint8Array) => void; oncancel: () => void } = $props();

  const VIEW = 280;
  let canvas = $state<HTMLCanvasElement | undefined>();
  let image: ImageBitmap | null = null;
  let crop = $state<CropState>({ ...DEFAULT_CROP });
  let error = $state('');
  let ready = $state(false);
  let drag: { x: number; y: number; cx: number; cy: number } | null = null;

  function redraw() {
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCrop(ctx, image, image.width, image.height, VIEW, crop);
    // dim everything outside the circle that will be kept
    ctx.save();
    ctx.fillStyle = 'rgba(40, 36, 80, 0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, VIEW, VIEW);
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 2, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  onMount(() => {
    let live = true;
    createImageBitmap(file).then(
      (bmp) => {
        if (!live) return bmp.close();
        image = bmp;
        ready = true;
        redraw();
      },
      () => (error = 'That picture could not be opened. Please try another one.')
    );
    return () => {
      live = false;
      image?.close();
    };
  });

  $effect(() => {
    void crop.zoom;
    void crop.rotation;
    void crop.x;
    void crop.y;
    void ready;
    redraw();
  });

  function down(e: PointerEvent) {
    if (!ready) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, cx: crop.x, cy: crop.y };
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    // the preview is drawn at VIEW pixels but may be shown smaller or larger
    const scale = VIEW / (canvas?.getBoundingClientRect().width || VIEW);
    crop.x = clampOffset(drag.cx + (e.clientX - drag.x) * scale, VIEW);
    crop.y = clampOffset(drag.cy + (e.clientY - drag.y) * scale, VIEW);
  }
  function up() {
    drag = null;
  }
  function wheel(e: WheelEvent) {
    e.preventDefault();
    crop.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((crop.zoom - e.deltaY * 0.0015) * 100) / 100));
  }
  function key(e: KeyboardEvent) {
    const step = e.shiftKey ? 16 : 4;
    const k = e.key;
    if (k === 'ArrowLeft') crop.x = clampOffset(crop.x - step, VIEW);
    else if (k === 'ArrowRight') crop.x = clampOffset(crop.x + step, VIEW);
    else if (k === 'ArrowUp') crop.y = clampOffset(crop.y - step, VIEW);
    else if (k === 'ArrowDown') crop.y = clampOffset(crop.y + step, VIEW);
    else if (k === '+' || k === '=') crop.zoom = Math.min(ZOOM_MAX, Math.round((crop.zoom + 0.1) * 100) / 100);
    else if (k === '-') crop.zoom = Math.max(ZOOM_MIN, Math.round((crop.zoom - 0.1) * 100) / 100);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
  function turn(by: number) {
    let r = crop.rotation + by;
    if (r > 180) r -= 360;
    if (r < -180) r += 360;
    crop.rotation = r;
  }

  async function use() {
    if (!image) return;
    const out = document.createElement('canvas');
    out.width = out.height = PICTURE_SIZE;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    const k = PICTURE_SIZE / VIEW;
    drawCrop(ctx, image, image.width, image.height, PICTURE_SIZE, { ...crop, x: crop.x * k, y: crop.y * k });
    const blob = await new Promise<Blob | null>((res) => out.toBlob(res, 'image/png'));
    if (!blob) {
      error = 'The picture could not be saved. Please try again.';
      return;
    }
    ondone(new Uint8Array(await blob.arrayBuffer()));
  }
</script>

<div class="crop" role="group" aria-label="Place your picture">
  {#if error}
    <p class="err" role="alert">{error}</p>
    <Button variant="soft" onclick={oncancel}>Back</Button>
  {:else}
    <canvas
      bind:this={canvas}
      width={VIEW}
      height={VIEW}
      tabindex="0"
      aria-label="Your picture. Drag to move it, scroll to zoom, or use the arrow keys."
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
      onwheel={wheel}
      onkeydown={key}
    ></canvas>
    <div class="ctl">
      <Slider label="Zoom" value={crop.zoom} min={ZOOM_MIN} max={ZOOM_MAX} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onchange={(v) => (crop.zoom = v)} />
      <Slider label="Turn" value={crop.rotation} min={-180} max={180} step={1} format={(v) => `${Math.round(v)}°`} onchange={(v) => (crop.rotation = v)} />
      <div class="row">
        <Button variant="soft" size="sm" onclick={() => turn(-90)}>Turn left</Button>
        <Button variant="soft" size="sm" onclick={() => turn(90)}>Turn right</Button>
        <Button variant="ghost" size="sm" onclick={() => (crop = { ...DEFAULT_CROP })}>Reset</Button>
      </div>
      <p class="hint">Drag the picture to move it. Everything inside the white circle is kept.</p>
      <div class="row end">
        <Button variant="ghost" onclick={oncancel}>Cancel</Button>
        <Button variant="primary" disabled={!ready} onclick={use}>Use this picture</Button>
      </div>
    </div>
  {/if}
</div>

<style>
  .crop {
    display: flex;
    gap: 22px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  canvas {
    width: 280px;
    height: 280px;
    max-width: 100%;
    border-radius: 18px;
    background: var(--panel);
    box-shadow: var(--shadow-m);
    cursor: grab;
    touch-action: none;
  }
  canvas:active {
    cursor: grabbing;
  }
  .ctl {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }
  .row.end {
    justify-content: flex-end;
    margin-top: 12px;
  }
  .hint {
    color: var(--ink-soft);
    font-size: 0.85rem;
    margin: 6px 0 0;
  }
  .err {
    color: var(--c-rose);
    font-weight: 700;
  }
</style>
