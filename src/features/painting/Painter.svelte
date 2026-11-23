<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { CANVAS_H, CANVAS_W } from '../../core/config';
  import { Autosaver } from '../../core/autosave';
  import { asset, findBook, findPage } from '../../core/content/registry';
  import { confirmDialog, confirmRequest, toast } from '../../core/feedback';
  import { navigate, onBeforeLeave } from '../../core/router';
  import { brushSound, sfx } from '../../core/audio';
  import { settings, updateSettings } from '../../core/settings';
  import { isAppHidden, onVisibilityChange } from '../../core/visibility';
  import { clamp } from '../../core/util';
  import Icon from '../../ui/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import SaveIndicator from '../../ui/SaveIndicator.svelte';
  import { loadArtwork, saveArtwork, type ArtworkMeta } from '../gallery/artwork';
  import PalettePanel from './PalettePanel.svelte';
  import { PaintEngine } from './engine';
  import { savePngFile } from './export';
  import { isBrushTool, TOOLS, type ToolId } from './tools';
  import type { PaintballSize } from '../../core/splat';

  let { artworkId }: { artworkId: string } = $props();

  let meta = $state<ArtworkMeta | null>(null);
  let engine = $state.raw<PaintEngine | null>(null);
  let ready = $state(false);
  let failed = $state(false);
  let autosaver: Autosaver | null = null;

  // ui state
  let tool = $state<ToolId>('brush');
  let color = $state($settings.lastColor);
  let size = $state($settings.brushSize);
  let paintballSize = $state<PaintballSize>('medium');
  let canUndo = $state(false);
  let canRedo = $state(false);
  let stayInside = $state($settings.stayInsideLines);
  let hasRegions = $state(false);
  let title = $state('');
  let backTo = $state<'books' | 'draw'>('books');
  let bookId = $state('');

  // view state
  let viewEl: HTMLDivElement | undefined = $state();
  let stageHost: HTMLDivElement | undefined = $state();
  let viewW = $state(800);
  let viewH = $state(600);
  let zoom = $state(1);
  let tx = $state(0);
  let ty = $state(0);
  let spaceDown = $state(false);
  let panning = false;
  let panStart = { x: 0, y: 0, tx: 0, ty: 0 };
  let cursorEl: HTMLDivElement | undefined = $state();
  let cursorVisible = $state(false);
  let lastPt = { x: 0, y: 0, t: 0 };

  const MARGIN = 28;
  const fit = $derived.by(() => {
    const s = Math.min((viewW - MARGIN * 2) / CANVAS_W, (viewH - MARGIN * 2) / CANVAS_H);
    return Math.max(0.2, s);
  });
  const stageW = $derived(CANVAS_W * fit);
  const stageH = $derived(CANVAS_H * fit);
  const activeToolInfo = $derived(TOOLS.find((t) => t.id === tool)!);
  const effectiveTool = $derived<ToolId>(spaceDown ? 'pan' : tool);

  function centerView() {
    zoom = 1;
    tx = (viewW - stageW) / 2;
    ty = (viewH - stageH) / 2;
  }

  function clampPan() {
    const keep = 120;
    const w = stageW * zoom;
    const h = stageH * zoom;
    tx = clamp(tx, keep - w, viewW - keep);
    ty = clamp(ty, keep - h, viewH - keep);
  }

  function zoomAt(factor: number, cx = viewW / 2, cy = viewH / 2) {
    const nz = clamp(zoom * factor, 0.5, 6);
    const k = nz / zoom;
    tx = cx - (cx - tx) * k;
    ty = cy - (cy - ty) * k;
    zoom = nz;
    clampPan();
  }

  // ------------------------------------------------------------- loading

  onMount(() => {
    const ro = new ResizeObserver(([e]) => {
      const first = viewW === 800 && !ready;
      viewW = e.contentRect.width;
      viewH = e.contentRect.height;
      if (first || zoom === 1) centerView();
    });
    if (viewEl) ro.observe(viewEl);
    void load();
    const offVis = onVisibilityChange(() => {
      if (isAppHidden()) void autosaver?.flush();
    });
    const unguard = onBeforeLeave(() => autosaver?.flush());
    return () => {
      ro.disconnect();
      offVis();
      unguard();
    };
  });

  async function load() {
    try {
      const data = await loadArtwork(artworkId);
      if (!data) throw new Error('Artwork not found');
      meta = data.meta;
      title = data.meta.title;
      bookId = data.meta.bookId;
      const e = new PaintEngine(CANVAS_W, CANVAS_H);
      e.state = { ...e.state, color, size, stayInside, reduceMotion: $settings.reducedMotion, particles: !$settings.disableParticles };
      if (data.meta.pageId) {
        const page = findPage(data.meta.bookId, data.meta.pageId);
        if (!page) throw new Error('Page missing');
        const svg = await asset(page.tree, page.dir, page.manifest.lineArt).text();
        if (!svg) throw new Error('Line art missing');
        await e.setLineArt(svg, page.regions);
        title = data.meta.title || page.manifest.name;
        hasRegions = true;
        backTo = 'books';
      } else {
        const book = findBook('free_canvas');
        const def = book?.manifest.backgrounds?.find((b) => b.id === data.meta.background) ?? book?.manifest.backgrounds?.[0] ?? null;
        e.setBackground(def);
        tool = 'brush';
        backTo = 'draw';
      }
      await e.loadPaint(data.paint);
      e.onHistory = () => {
        canUndo = e.history.canUndo;
        canRedo = e.history.canRedo;
      };
      autosaver = new Autosaver(save);
      e.onChange = () => autosaver?.markDirty();
      engine = e;
      for (const c of [e.bg, e.paint, e.lines, e.fx]) {
        c.className = 'layer';
        stageHost?.appendChild(c);
      }
      e.lines.classList.add('lines');
      e.fx.classList.add('fx');
      ready = true;
      centerView();
    } catch (err) {
      console.error(err);
      failed = true;
      toast("Couldn't open this artwork.", 'error');
    }
  }

  async function save() {
    if (!engine || !meta) return;
    const png = engine.blank && !meta.hasPaint ? null : await engine.exportPaintPng();
    const thumb = png ? await engine.thumbnailPng(360) : null;
    meta = await saveArtwork(meta, png, thumb);
  }

  onDestroy(() => {
    // Flush synchronously-scheduled write; the router guard has normally already done this.
    void autosaver?.flush().finally(() => {
      autosaver?.dispose();
      engine?.dispose();
    });
  });

  // keep engine in sync with ui state
  $effect(() => {
    if (!engine) return;
    engine.state.tool = tool;
    engine.state.color = color;
    engine.state.size = size;
    engine.state.stayInside = stayInside;
    engine.state.paintballSize = paintballSize;
    engine.state.reduceMotion = $settings.reducedMotion || $settings.lowPowerMode;
    engine.state.particles = !($settings.disableParticles || $settings.lowPowerMode);
  });
  $effect(() => {
    updateSettings({ lastColor: color });
  });
  let sizeTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const s = size;
    clearTimeout(sizeTimer);
    sizeTimer = setTimeout(() => updateSettings({ brushSize: s }), 600);
  });
  $effect(() => {
    updateSettings({ stayInsideLines: stayInside });
  });

  // ------------------------------------------------------------- pointer input

  function toCanvas(e: { clientX: number; clientY: number }) {
    const r = engine!.paint.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * CANVAS_W, y: ((e.clientY - r.top) / r.height) * CANVAS_H };
  }

  function moveCursor(e: PointerEvent) {
    if (!cursorEl || !viewEl) return;
    const r = viewEl.getBoundingClientRect();
    cursorEl.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
  }

  const cursorSize = $derived(
    tool === 'paintball' ? 0 : isBrushTool(tool) ? Math.max(6, size * (tool === 'airbrush' ? 2.4 : tool === 'marker' ? 1.25 : tool === 'eraser' ? 1.3 : 1) * fit * zoom) : 0
  );

  function down(e: PointerEvent) {
    if (!engine || !ready) return;
    viewEl?.setPointerCapture(e.pointerId);
    const wantPan = e.button === 1 || e.button === 2 || effectiveTool === 'pan';
    if (wantPan) {
      panning = true;
      panStart = { x: e.clientX, y: e.clientY, tx, ty };
      return;
    }
    if (e.button !== 0) return;
    const p = toCanvas(e);
    const t = effectiveTool;
    if (isBrushTool(t)) {
      if (engine.beginStroke(p.x, p.y)) {
        brushSound.begin(t === 'crayon' ? 'grainy' : 'soft');
        lastPt = { ...p, t: performance.now() };
      }
    } else if (t === 'fill') {
      if (engine.fillAt(p.x, p.y)) sfx.fill();
    } else if (t === 'clearRegion') {
      if (engine.clearRegionAt(p.x, p.y)) sfx.pop(0.8);
      else toast('Nothing to clear there.', 'info', 1600);
    } else if (t === 'paintball') {
      sfx.throw();
      engine.paintball(p.x, p.y);
      setTimeout(() => sfx.splash(), 230);
    } else if (t === 'picker') {
      const hex = engine.sampleColor(p.x, p.y);
      if (hex) {
        color = hex;
        sfx.pop(1.3);
      }
    }
  }

  function move(e: PointerEvent) {
    moveCursor(e);
    if (panning) {
      tx = panStart.tx + (e.clientX - panStart.x);
      ty = panStart.ty + (e.clientY - panStart.y);
      clampPan();
      return;
    }
    if (!engine?.isDrawing) return;
    const evs = e.getCoalescedEvents?.() ?? [];
    const list = evs.length ? evs : [e];
    const pts = list.map((ev) => toCanvas(ev));
    engine.moveStroke(pts);
    const last = pts[pts.length - 1];
    const now = performance.now();
    const dt = Math.max(1, now - lastPt.t);
    brushSound.move(Math.hypot(last.x - lastPt.x, last.y - lastPt.y) / dt);
    lastPt = { ...last, t: now };
  }

  function up(e: PointerEvent) {
    if (panning) {
      panning = false;
    }
    if (engine?.isDrawing) {
      engine.endStroke();
      brushSound.end();
    }
    if (viewEl?.hasPointerCapture(e.pointerId)) viewEl.releasePointerCapture(e.pointerId);
  }

  function wheel(e: WheelEvent) {
    e.preventDefault();
    const r = viewEl!.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) >= 1) zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }

  // ------------------------------------------------------------- keyboard

  function key(e: KeyboardEvent) {
    if (!ready || $confirmRequest || (e.target instanceof HTMLInputElement && e.target.type !== 'range')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    } else if ((e.ctrlKey || e.metaKey) && k === 'y') {
      e.preventDefault();
      redo();
    } else if ((e.ctrlKey || e.metaKey) && k === 's') {
      e.preventDefault();
      void autosaver?.flush();
    } else if (k === ' ') {
      e.preventDefault();
      spaceDown = true;
    } else if (k === '[') size = clamp(size - 3, 2, 90);
    else if (k === ']') size = clamp(size + 3, 2, 90);
    else if (k === '0') centerView();
    else if (k === '+' || k === '=') zoomAt(1.2);
    else if (k === '-') zoomAt(1 / 1.2);
    else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = TOOLS.find((x) => x.key.toLowerCase() === k);
      if (t) tool = t.id;
    }
  }
  function keyUp(e: KeyboardEvent) {
    if (e.key === ' ') spaceDown = false;
  }

  function undo() {
    if (engine?.undo()) sfx.thud();
  }
  function redo() {
    if (engine?.redo()) sfx.thud();
  }

  async function resetPage() {
    if (!engine) return;
    const ok = await confirmDialog({
      title: hasRegions ? 'Reset this page?' : 'Clear this canvas?',
      message: hasRegions ? 'This clears all the color on the page. You can still undo right after.' : 'This clears everything you drew. You can still undo right after.',
      confirmLabel: hasRegions ? 'Reset page' : 'Clear canvas',
      danger: true
    });
    if (ok) {
      engine.resetAll();
      toast('Page reset', 'info', 1800);
    }
  }

  async function exportPng() {
    if (!engine) return;
    await savePngFile(await engine.exportFlatPng(), title || 'cloud-freelife');
  }

  async function goBack() {
    await navigate(backTo === 'books' ? { name: 'book', bookId } : { name: 'draw' });
  }
</script>

<svelte:window onkeydown={key} onkeyup={keyUp} />

<div class="painter">
  <header class="top">
    <Button variant="soft" size="sm" icon="chevronLeft" onclick={goBack}>{backTo === 'books' ? 'Book' : 'Free Draw'}</Button>
    <Button variant="ghost" size="sm" icon="home" title="Home" onclick={() => navigate({ name: 'home' })} />
    <h2 class="title" title={title}>{title}</h2>
    <SaveIndicator />
    <span class="spacer"></span>
    {#if hasRegions}
      <button class="chip" class:on={stayInside} onclick={() => (stayInside = !stayInside)} title="Keep paint inside the region where you start" aria-pressed={stayInside}>
        <Icon name="frame" size={16} /> Stay inside lines
      </button>
    {/if}
    <div class="group">
      <Button variant="ghost" size="sm" icon="undo" title="Undo (Ctrl+Z)" disabled={!canUndo} onclick={undo} />
      <Button variant="ghost" size="sm" icon="redo" title="Redo (Ctrl+Y)" disabled={!canRedo} onclick={redo} />
    </div>
    <div class="group">
      <Button variant="ghost" size="sm" icon="zoomOut" title="Zoom out (-)" onclick={() => zoomAt(1 / 1.25)} />
      <button class="zoomval" onclick={centerView} title="Fit to window (0)">{Math.round(zoom * 100)}%</button>
      <Button variant="ghost" size="sm" icon="zoomIn" title="Zoom in (+)" onclick={() => zoomAt(1.25)} />
    </div>
    <Button variant="soft" size="sm" icon="download" onclick={exportPng}>Export PNG</Button>
    <Button variant="danger" size="sm" icon="refresh" onclick={resetPage}>{hasRegions ? 'Reset page' : 'Clear canvas'}</Button>
  </header>

  <div class="work">
    <nav class="tools" aria-label="Tools">
      {#each TOOLS as t (t.id)}
        <button class="tool" class:on={tool === t.id} title="{t.label} ({t.key}) — {t.hint}" aria-label={t.label} aria-pressed={tool === t.id} onclick={() => { tool = t.id; sfx.click(); }}>
          <Icon name={t.icon} size={23} />
          <span>{t.label.split(' ')[0]}</span>
        </button>
      {/each}
    </nav>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="view"
      class:panning={effectiveTool === 'pan'}
      bind:this={viewEl}
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
      onpointerenter={() => (cursorVisible = true)}
      onpointerleave={() => (cursorVisible = false)}
      onwheel={wheel}
      oncontextmenu={(e) => e.preventDefault()}
      style="cursor:{effectiveTool === 'pan' ? 'grab' : cursorSize > 0 && $settings.showBrushCursor ? 'none' : tool === 'picker' ? 'crosshair' : 'crosshair'}"
    >
      <div class="stage" bind:this={stageHost} style="width:{stageW}px; height:{stageH}px; transform: translate({tx}px, {ty}px) scale({zoom});"></div>
      {#if cursorVisible && cursorSize > 0 && $settings.showBrushCursor && effectiveTool !== 'pan'}
        <div class="ring" bind:this={cursorEl} style="width:{cursorSize}px; height:{cursorSize}px; margin:{-cursorSize / 2}px 0 0 {-cursorSize / 2}px; {tool === 'eraser' ? 'border-style:dashed' : ''}"></div>
      {/if}
      {#if !ready && !failed}<div class="loading"><i></i> Opening…</div>{/if}
      {#if failed}
        <div class="loading">This artwork couldn't be opened. <Button size="sm" onclick={() => navigate({ name: 'gallery' })}>Go to Gallery</Button></div>
      {/if}
      <div class="hint-bar">{activeToolInfo.label}: {activeToolInfo.hint}</div>
    </div>

    <PalettePanel
      {color}
      {size}
      {tool}
      sizeEnabled={activeToolInfo.sized}
      {paintballSize}
      onColor={(c) => (color = c)}
      onSize={(n) => (size = n)}
      onPaintball={(s) => (paintballSize = s)}
    />
  </div>
</div>

<style>
  .painter {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 14px 14px 10px;
    padding: 8px 14px;
    border-radius: 28px;
    background: var(--panel);
    box-shadow: var(--shadow-s);
    flex-wrap: wrap;
    row-gap: 6px;
  }
  .title {
    font-size: 1.05rem;
    max-width: 22ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0 6px 0 4px;
  }
  .spacer {
    flex: 1;
  }
  .group {
    display: flex;
    align-items: center;
    background: rgb(var(--w) / 0.6);
    border-radius: 999px;
    padding: 0 2px;
  }
  .zoomval {
    font-weight: 800;
    font-size: 0.82rem;
    min-width: 48px;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.84rem;
    background: rgb(var(--w) / 0.7);
    color: var(--ink-soft);
    white-space: nowrap;
  }
  .chip.on {
    background: var(--mint);
    color: var(--c-green);
  }
  .work {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 14px;
    padding: 0 0 0 14px;
  }
  .tools {
    width: 74px;
    flex: none;
    margin-bottom: 14px;
    padding: 10px 6px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }
  .tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 7px 2px 5px;
    border-radius: 16px;
    color: var(--ink-soft);
    font-size: 0.66rem;
    font-weight: 800;
    transition:
      background 0.15s,
      transform 0.15s var(--ease);
  }
  .tool:hover {
    background: rgb(var(--w) / 0.85);
    color: var(--ink);
  }
  .tool.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
    box-shadow: var(--shadow-s);
  }
  .view {
    flex: 1;
    min-width: 0;
    margin-bottom: 14px;
    border-radius: var(--radius-l);
    background: rgb(var(--w) / 0.35);
    box-shadow: inset 0 0 0 1px rgb(var(--w) / 0.7);
    position: relative;
    overflow: hidden;
    touch-action: none;
  }
  .view.panning {
    cursor: grab;
  }
  .stage {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    border-radius: 6px;
    box-shadow:
      0 10px 40px rgba(110, 95, 175, 0.25),
      0 0 0 1px rgba(120, 110, 170, 0.12);
    background: #fffdf8;
    will-change: transform;
  }
  .stage :global(.layer) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
    image-rendering: auto;
  }
  .stage :global(.lines) {
    mix-blend-mode: multiply;
  }
  .ring {
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 50%;
    border: 2px solid rgba(90, 80, 150, 0.7);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.85),
      inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    pointer-events: none;
    will-change: transform;
  }
  .loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .loading i {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 4px solid #d8cff5;
    border-top-color: #9b86df;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .hint-bar {
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    background: rgb(var(--w) / 0.82);
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--ink-soft);
    pointer-events: none;
    white-space: nowrap;
  }
</style>
