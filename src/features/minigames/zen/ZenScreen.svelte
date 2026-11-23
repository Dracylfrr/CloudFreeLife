<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { catalog } from '../../../core/content/registry';
  import { confirmDialog, promptDialog, toast } from '../../../core/feedback';
  import { navigate, onBeforeLeave } from '../../../core/router';
  import { Autosaver } from '../../../core/autosave';
  import { sfx } from '../../../core/audio';
  import Button from '../../../ui/Button.svelte';
  import Icon from '../../../ui/Icon.svelte';
  import Slider from '../../../ui/Slider.svelte';
  import GameFrame from '../GameFrame.svelte';
  import { recordOpened } from '../progress';
  import {
    FIELD_H,
    FIELD_W,
    MAX_OBJECTS,
    MAX_STROKES,
    addPoint,
    deleteGarden,
    duplicateGarden,
    emptyGarden,
    listGardens,
    loadGarden,
    objectAt,
    saveGarden,
    strokeAt,
    type Garden,
    type ZenKind,
    type ZenObject
  } from './gardens';
  import { drawGarden, drawSand, drawStroke } from './render';

  let { levelId, gardenId }: { levelId?: string; gardenId?: string } = $props();

  type Tool = 'rake' | ZenKind | 'move' | 'erase';
  const TOOLS: { id: Tool; label: string; icon: string }[] = [
    { id: 'rake', label: 'Rake', icon: 'brush' },
    { id: 'stone', label: 'Stone', icon: 'grid' },
    { id: 'plant', label: 'Plant', icon: 'leaf' },
    { id: 'flower', label: 'Flower', icon: 'flower' },
    { id: 'bush', label: 'Bush', icon: 'cloud' },
    { id: 'move', label: 'Move', icon: 'hand' },
    { id: 'erase', label: 'Erase', icon: 'eraser' }
  ];

  const levels = $derived($catalog.zenLevels);
  let canvas: HTMLCanvasElement | undefined = $state();
  let sandLayer: HTMLCanvasElement | null = null;
  let garden = $state<Garden | null>(null);
  let tool = $state<Tool>('rake');
  let size = $state(1);
  let list = $state<Garden[]>([]);
  let showList = $state(false);
  let undoStack: string[] = [];
  let dpr = 1;
  let raf = 0;
  let drawing: { stroke: { pts: number[] }; from: number } | null = null;
  let dragging: ZenObject | null = null;
  let placed: ZenObject | null = null;
  let counter = $state(0); // refreshes counts in the toolbar

  const level = $derived(levels.find((l) => l.manifest.id === garden?.levelId) ?? levels[0]);
  const levelIdx = $derived(Math.max(0, levels.findIndex((l) => l.manifest.id === level?.manifest.id)));

  const saver = new Autosaver(async () => {
    if (garden) await saveGarden($state.snapshot(garden) as Garden);
  }, { delay: 1200, onStatus: () => {} });

  function changed() {
    counter++;
    saver.markDirty();
    scheduleDraw();
  }
  function pushUndo() {
    if (!garden) return;
    undoStack.push(JSON.stringify({ s: garden.strokes, o: garden.objects }));
    if (undoStack.length > 30) undoStack.shift();
  }
  function undo() {
    const prev = undoStack.pop();
    if (!prev || !garden) return;
    const d = JSON.parse(prev) as { s: Garden['strokes']; o: Garden['objects'] };
    garden.strokes = d.s;
    garden.objects = d.o;
    rebuildSand();
    changed();
  }

  function scheduleDraw() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      draw();
    });
  }
  function rebuildSand() {
    if (!sandLayer || !garden || !level) return;
    const g = sandLayer.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSand(sandLayer, garden, level.manifest);
  }
  function draw() {
    if (!canvas || !garden || !level) return;
    const g = canvas.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGarden(g, garden, level.manifest, sandLayer ?? undefined);
  }

  async function open(g: Garden) {
    await saver.flush();
    garden = g;
    undoStack = [];
    rebuildSand();
    draw();
    recordOpened('zen', g.levelId);
  }

  onMount(() => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas!.width = FIELD_W * dpr;
    canvas!.height = FIELD_H * dpr;
    sandLayer = document.createElement('canvas');
    sandLayer.width = FIELD_W * dpr;
    sandLayer.height = FIELD_H * dpr;
    const off = onBeforeLeave(() => saver.flush());
    void (async () => {
      let g: Garden | null = gardenId ? await loadGarden(gardenId) : null;
      if (!g) {
        const all = await listGardens();
        g = all[0] ?? null;
      }
      if (!g) {
        g = emptyGarden(levelId && levels.some((l) => l.manifest.id === levelId) ? levelId : (levels[0]?.manifest.id ?? 'warm_sand'));
        await saveGarden(g);
      } else if (levelId && levels.some((l) => l.manifest.id === levelId) && !gardenId) {
        g.levelId = levelId;
      }
      await open(g);
    })();
    return off;
  });
  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf);
    void saver.flush();
  });

  // ---- pointer ----
  const pos = (e: PointerEvent) => {
    const r = canvas!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * FIELD_W, y: ((e.clientY - r.top) / r.height) * FIELD_H };
  };
  function down(e: PointerEvent) {
    if (!garden) return;
    const p = pos(e);
    try {
      canvas!.setPointerCapture(e.pointerId);
    } catch {
      /* some pointers cannot be captured: dragging still works */
    }
    if (tool === 'rake') {
      pushUndo();
      drawing = { stroke: { pts: [] }, from: 0 };
      addPoint(drawing.stroke, p.x, p.y);
    } else if (tool === 'move') {
      dragging = objectAt(garden, p.x, p.y);
      if (dragging) pushUndo();
    } else if (tool === 'erase') {
      const o = objectAt(garden, p.x, p.y);
      if (o) {
        pushUndo();
        garden.objects = garden.objects.filter((q) => q !== o);
        sfx.click();
        changed();
      } else {
        const i = strokeAt(garden, p.x, p.y);
        if (i >= 0) {
          pushUndo();
          garden.strokes = garden.strokes.filter((_, k) => k !== i);
          rebuildSand();
          sfx.click();
          changed();
        }
      }
    } else if (garden.objects.length < MAX_OBJECTS) {
      pushUndo();
      const o: ZenObject = { id: Math.max(0, ...garden.objects.map((q) => q.id)) + 1, kind: tool as ZenKind, x: p.x, y: p.y, size, variant: Math.floor(Math.random() * 4), rot: (Math.random() - 0.5) * 3 };
      garden.objects = [...garden.objects, o];
      placed = o;
      if (tool === 'stone') sfx.thud();
      else sfx.bubble();
      changed();
    } else {
      toast('The garden is full. Erase something to make room.', 'info');
    }
  }
  function move(e: PointerEvent) {
    if (!garden) return;
    const p = pos(e);
    if (drawing && sandLayer && level) {
      const before = drawing.stroke.pts.length;
      if (addPoint(drawing.stroke, p.x, p.y)) {
        const g = sandLayer.getContext('2d')!;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawStroke(g, drawing.stroke, level.manifest, Math.max(0, before - 2));
        scheduleDraw();
      }
    } else if (dragging) {
      dragging.x = Math.max(0, Math.min(FIELD_W, p.x));
      dragging.y = Math.max(0, Math.min(FIELD_H, p.y));
      scheduleDraw();
    } else if (placed) {
      placed.x = p.x;
      placed.y = p.y;
      scheduleDraw();
    }
  }
  function up() {
    if (drawing && garden) {
      if (drawing.stroke.pts.length >= 4) {
        garden.strokes = [...garden.strokes, drawing.stroke].slice(-MAX_STROKES);
        if (garden.strokes.length === MAX_STROKES) rebuildSand();
        changed();
      }
      drawing = null;
    }
    if (dragging || placed) changed();
    dragging = null;
    placed = null;
  }

  // ---- actions ----
  async function newGarden() {
    await saver.flush();
    const g = emptyGarden(garden?.levelId ?? levels[0]?.manifest.id ?? 'warm_sand', 'New garden');
    await saveGarden(g);
    await open(g);
    toast('A fresh garden.', 'success', 1800);
  }
  async function save() {
    if (!garden) return;
    await saver.flush();
    await saveGarden($state.snapshot(garden) as Garden);
    toast('Garden saved.', 'success', 1800);
  }
  async function duplicate() {
    if (!garden) return;
    await saver.flush();
    const copy = duplicateGarden($state.snapshot(garden) as Garden);
    await saveGarden(copy);
    await open(copy);
    toast('Copied. You are now in the copy.', 'success', 2200);
  }
  async function clearAll() {
    if (!garden) return;
    const ok = await confirmDialog({ title: 'Clear this garden?', message: 'This smooths the sand and removes everything you placed. You can still Undo right after.', confirmLabel: 'Clear', danger: true });
    if (!ok) return;
    pushUndo();
    garden.strokes = [];
    garden.objects = [];
    rebuildSand();
    changed();
  }
  async function rename() {
    if (!garden) return;
    const name = await promptDialog({ title: 'Name your garden', message: 'A short name you like.', confirmLabel: 'Save', input: { value: garden.name, maxLength: 40 } });
    if (name && name.trim()) {
      garden.name = name.trim();
      changed();
    }
  }
  async function openList() {
    await saver.flush();
    list = await listGardens();
    showList = true;
  }
  async function remove(g: Garden) {
    const ok = await confirmDialog({ title: `Delete ${g.name}?`, message: 'This garden will be removed.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    await deleteGarden(g.id);
    list = list.filter((x) => x.id !== g.id);
    if (garden?.id === g.id) {
      const rest = list[0] ?? emptyGarden(garden.levelId);
      if (!list[0]) await saveGarden(rest);
      await open(rest);
    }
  }
  function setLevel(i: number) {
    if (!garden || !levels[i]) return;
    garden.levelId = levels[i].manifest.id;
    rebuildSand();
    changed();
  }
  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape') {
      if (showList) showList = false;
      else navigate({ name: 'minigames' });
    } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      undo();
    }
  }

  // small previews for the saved-gardens panel
  function thumb(node: HTMLCanvasElement, g: Garden) {
    const paint = (garden: Garden) => {
      const lv = levels.find((l) => l.manifest.id === garden.levelId) ?? levels[0];
      if (!lv) return;
      const c = node.getContext('2d')!;
      c.setTransform(node.width / FIELD_W, 0, 0, node.height / FIELD_H, 0, 0);
      drawGarden(c, garden, lv.manifest);
    };
    paint(g);
    return { update: paint };
  }
</script>

<svelte:window onkeydown={key} />

<GameFrame
  title="Zen Garden"
  game="zen"
  levels={levels.map((l) => l.manifest.name)}
  idx={levelIdx}
  onLevel={setLevel}
  name={garden?.name ?? ''}
  objective="Rake the sand, place stones and plants, and simply relax. Everything saves itself."
>
  {#snippet stats()}
    <span class="stat">{garden?.objects.length ?? 0} things</span>
  {/snippet}
  {#snippet actions()}
    <Button variant="soft" size="sm" icon="plus" onclick={newGarden}>New</Button>
    <Button variant="soft" size="sm" icon="check" onclick={save}>Save</Button>
    <Button variant="ghost" size="sm" icon="copy" onclick={duplicate}>Duplicate</Button>
    <Button variant="ghost" size="sm" icon="image" onclick={openList}>Gardens</Button>
  {/snippet}

  <div class="row">
    <div class="tools" role="radiogroup" aria-label="Tool">
      {#each TOOLS as t}
        <button class:on={tool === t.id} role="radio" aria-checked={tool === t.id} title={t.label} onclick={() => (tool = t.id)}>
          <Icon name={t.icon} size={20} /><span>{t.label}</span>
        </button>
      {/each}
      <div class="sep"></div>
      <Slider label="Size" value={size} min={0.6} max={1.8} step={0.1} format={(v) => `${Math.round(v * 100)}%`} onchange={(v) => (size = v)} />
      <Button variant="ghost" size="sm" icon="undo" onclick={undo}>Undo</Button>
      <Button variant="ghost" size="sm" icon="refresh" onclick={clearAll}>Clear</Button>
      <Button variant="ghost" size="sm" icon="edit" onclick={rename}>Rename</Button>
    </div>
    <div class="field">
      <canvas bind:this={canvas} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} aria-label="Zen Garden. Rake the sand or place things by clicking and dragging."></canvas>
    </div>
  </div>

  {#if showList}
    <div class="panel" role="dialog" aria-label="Your gardens">
      <div class="panel-head">
        <h3>Your gardens</h3>
        <Button variant="ghost" size="sm" icon="x" onclick={() => (showList = false)}>Close</Button>
      </div>
      {#if list.length === 0}<p class="muted">No saved gardens yet.</p>{/if}
      <div class="grid">
        {#each list as g (g.id)}
          <div class="gcard" class:cur={g.id === garden?.id}>
            <button class="open" onclick={() => { void open(g); showList = false; }} aria-label="Open {g.name}">
              <canvas width="270" height="174" use:thumb={g}></canvas>
              <strong>{g.name}</strong>
            </button>
            <Button variant="ghost" size="sm" icon="trash" onclick={() => remove(g)}>Delete</Button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</GameFrame>

<style>
  .row {
    display: flex;
    gap: 14px;
    width: 100%;
    max-width: 1200px;
    min-height: 0;
    flex: 1;
    align-items: flex-start;
    justify-content: center;
  }
  .tools {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    width: 150px;
    flex: none;
    border-radius: 24px;
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .tools button:not(.btn) {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 14px;
    font-weight: 800;
    color: var(--ink-soft);
    text-align: left;
  }
  .tools button.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .tools button:hover:not(.on):not(.btn) {
    background: rgb(var(--w) / 0.7);
  }
  .sep {
    height: 1px;
    background: var(--line);
    margin: 4px 0;
  }
  .field {
    flex: 1;
    min-width: 0;
    max-width: calc((100vh - 200px) * 900 / 580);
    aspect-ratio: 900 / 580;
    border-radius: var(--radius-l);
    overflow: hidden;
    box-shadow: var(--shadow-m);
    border: 4px solid rgb(var(--w) / 0.85);
    touch-action: none;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
  }
  .stat {
    font-weight: 800;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .panel {
    position: absolute;
    inset: 64px 18px 18px 18px;
    z-index: 30;
    overflow: auto;
    padding: 22px 24px;
    border-radius: var(--radius-xl);
    background: var(--panel-solid);
    box-shadow: var(--shadow-l);
    border: 1px solid rgb(var(--w) / 0.9);
  }
  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }
  .gcard {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border-radius: 20px;
    background: rgb(var(--w) / 0.55);
  }
  .gcard.cur {
    box-shadow: 0 0 0 3px var(--lavender-deep);
  }
  .gcard .open {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }
  .gcard canvas {
    width: 100%;
    height: auto;
    border-radius: 14px;
    aspect-ratio: 900 / 580;
  }
  @media (max-width: 760px) {
    .row {
      flex-direction: column;
      align-items: stretch;
    }
    .tools {
      width: auto;
      flex-direction: row;
      flex-wrap: wrap;
    }
    .tools button span {
      display: none;
    }
  }
</style>
