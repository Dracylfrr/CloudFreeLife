<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { sfx } from '../../../core/audio';
  import Button from '../../../ui/Button.svelte';
  import GameResult from '../GameResult.svelte';
  import Icon from '../../../ui/Icon.svelte';
  import GameFrame from '../GameFrame.svelte';
  import { gamesProgress, recordFlowSolved, recordOpened } from '../progress';
  import { FlowBoard, randomBoard, type Cell } from './logic';

  type Mode = 'puzzle' | 'relax' | 'free';
  let { levelId, mode: initialMode = 'puzzle' }: { levelId?: string; mode?: Mode } = $props();

  const levels = $derived($catalog.flowLevels);
  const PASTELS = ['#f49bbd', '#7fb8f0', '#7fd2a8', '#f6c36a', '#b49af0', '#ff9f80', '#6fd0d8', '#e0a0d8'];

  let canvas: HTMLCanvasElement | undefined = $state();
  let box: HTMLDivElement | undefined = $state();
  let mode = $state<Mode>(untrack(() => initialMode));
  let idx = $state(0);
  let size = $state(5); // Relax board size, and the Free Flow grid
  let board = $state<FlowBoard | null>(null);
  let version = $state(0); // bumped to redraw / refresh counts
  let solved = $state(false);
  let name = $state('');
  let cursor = $state<Cell>([0, 0]);
  let keyDrawing = false;

  // Free Flow: your own colorful lines
  let freeColor = $state(PASTELS[0]);
  let freePaths = $state<{ color: string; cells: Cell[] }[]>([]);
  let freeActive = -1;

  const level = $derived(levels[idx]);
  const cells = $derived(mode === 'free' ? 8 : (board?.size ?? size));
  const connected = $derived.by(() => {
    void version; // the board changes in place, so the counter is what tells us to look again
    return board ? board.connectedCount : 0;
  });
  const total = $derived(board?.pairs.length ?? 0);
  const solvedIds = $derived($gamesProgress.flowSolved);

  function newPuzzle(i = idx) {
    const lv = levels[i];
    if (!lv) return;
    idx = i;
    board = new FlowBoard(lv.manifest, lv.manifest.solution);
    name = lv.manifest.name;
    solved = false;
    recordOpened('flow', lv.manifest.id);
    redraw();
  }
  function newRelax() {
    const pairs = Math.max(3, Math.min(7, size));
    const g = randomBoard(size, pairs, PASTELS);
    board = new FlowBoard(g.level, g.solution);
    name = `Relax · ${size} × ${size}`;
    solved = false;
    redraw();
  }
  function setMode(m: Mode) {
    mode = m;
    solved = false;
    if (m === 'puzzle') newPuzzle();
    else if (m === 'relax') newRelax();
    else {
      board = null;
      name = 'Free Flow';
      freePaths = [];
    }
    redraw();
  }
  function redraw() {
    version++;
    draw();
  }

  onMount(() => {
    const ro = new ResizeObserver(() => fit());
    ro.observe(box!);
    fit();
    const i = levelId ? Math.max(0, levels.findIndex((l) => l.manifest.id === levelId)) : 0;
    idx = i;
    setMode(initialMode);
    return () => ro.disconnect();
  });
  onDestroy(() => {});

  let px = 560;
  function fit() {
    if (!canvas || !box) return;
    const side = Math.max(240, Math.min(box.clientWidth, box.clientHeight, 640));
    px = side;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = side * dpr;
    canvas.height = side * dpr;
    canvas.style.width = `${side}px`;
    canvas.style.height = `${side}px`;
    canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function colorOfPair(i: number) {
    return board!.pairs[i].color;
  }

  function draw() {
    if (!canvas) return;
    const c = canvas.getContext('2d')!;
    const n = cells;
    const s = px / n;
    c.clearRect(0, 0, px, px);
    c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--panel-solid') || '#fff';
    c.beginPath();
    c.roundRect(0, 0, px, px, 28);
    c.fill();
    c.strokeStyle = 'rgba(140,130,190,0.22)';
    c.lineWidth = 2;
    for (let i = 1; i < n; i++) {
      c.beginPath();
      c.moveTo(i * s, 10);
      c.lineTo(i * s, px - 10);
      c.moveTo(10, i * s);
      c.lineTo(px - 10, i * s);
      c.stroke();
    }
    const center = (cell: Cell) => [cell[1] * s + s / 2, cell[0] * s + s / 2] as const;
    const stroke = (list: Cell[], color: string, alpha = 1) => {
      if (list.length === 0) return;
      c.globalAlpha = alpha;
      c.strokeStyle = color;
      c.lineWidth = s * 0.42;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      list.forEach((cell, k) => {
        const [x, y] = center(cell);
        if (k) c.lineTo(x, y);
        else c.moveTo(x, y);
      });
      if (list.length === 1) {
        const [x, y] = center(list[0]);
        c.lineTo(x + 0.01, y);
      }
      c.stroke();
      c.globalAlpha = 1;
    };
    if (mode === 'free') {
      for (const p of freePaths) stroke(p.cells, p.color);
    } else if (board) {
      board.paths.forEach((p, i) => stroke(p, colorOfPair(i), board!.isConnected(i) ? 1 : 0.85));
      board.pairs.forEach((pr) => {
        for (const cell of [pr.a, pr.b]) {
          const [x, y] = center(cell);
          c.fillStyle = pr.color;
          c.beginPath();
          c.arc(x, y, s * 0.3, 0, 7);
          c.fill();
          c.lineWidth = 3;
          c.strokeStyle = 'rgba(255,255,255,0.95)';
          c.stroke();
        }
      });
    }
    // keyboard cursor
    if (keyboardActive) {
      c.strokeStyle = 'rgba(110,100,190,0.9)';
      c.lineWidth = 4;
      c.beginPath();
      c.roundRect(cursor[1] * s + 4, cursor[0] * s + 4, s - 8, s - 8, 12);
      c.stroke();
    }
  }
  let keyboardActive = false;

  // ---- pointer ----
  let stroking = false;
  function cellAt(e: PointerEvent): Cell | null {
    const r = canvas!.getBoundingClientRect();
    const n = cells;
    const col = Math.floor(((e.clientX - r.left) / r.width) * n);
    const row = Math.floor(((e.clientY - r.top) / r.height) * n);
    if (row < 0 || col < 0 || row >= n || col >= n) return null;
    return [row, col];
  }
  function down(e: PointerEvent) {
    if (solved) return;
    const c = cellAt(e);
    if (!c) return;
    try {
      canvas!.setPointerCapture(e.pointerId);
    } catch {
      /* some pointers cannot be captured: dragging still works */
    }
    beginAt(c);
    stroking = true;
  }
  function move(e: PointerEvent) {
    if (!stroking) return;
    const c = cellAt(e);
    if (c) extendTo(c);
  }
  function up() {
    if (!stroking) return;
    stroking = false;
    finishStroke();
  }

  function beginAt(c: Cell) {
    if (mode === 'free') {
      freePaths = [...freePaths, { color: freeColor, cells: [c] }];
      freeActive = freePaths.length - 1;
      sfx.click();
    } else if (board) {
      if (board.begin(c) >= 0) sfx.bubble();
    }
    redraw();
  }
  function extendTo(c: Cell) {
    if (mode === 'free') {
      const p = freePaths[freeActive];
      if (!p) return;
      const last = p.cells[p.cells.length - 1];
      if (Math.abs(last[0] - c[0]) + Math.abs(last[1] - c[1]) !== 1) return;
      if (p.cells.length > 1 && p.cells[p.cells.length - 2][0] === c[0] && p.cells[p.cells.length - 2][1] === c[1]) p.cells.pop();
      else if (!p.cells.some((q) => q[0] === c[0] && q[1] === c[1])) p.cells.push(c);
      else return;
      if (freePaths.length > 400) freePaths = freePaths.slice(-400);
      redraw();
      return;
    }
    if (board?.extend(c)) {
      redraw();
    }
  }
  function finishStroke() {
    if (mode === 'free') {
      freeActive = -1;
      return;
    }
    if (!board) return;
    const before = solved;
    board.end();
    if (board.solved && !before) {
      solved = true;
      sfx.chime();
      if (mode === 'puzzle' && level) recordFlowSolved(level.manifest.id);
    } else if (board.paths.some((_, i) => board!.isConnected(i))) sfx.match();
    redraw();
  }

  function undo() {
    if (mode === 'free') {
      freePaths = freePaths.slice(0, -1);
    } else if (board?.undo()) solved = false;
    redraw();
  }
  function reset() {
    if (mode === 'free') freePaths = [];
    else {
      board?.reset();
      solved = false;
    }
    redraw();
  }
  function hint() {
    if (board?.hint() !== undefined) {
      sfx.sparkle();
      if (board.solved) {
        solved = true;
        sfx.chime();
        if (mode === 'puzzle' && level) recordFlowSolved(level.manifest.id);
      }
      redraw();
    }
  }

  // ---- keyboard: arrows move, Space starts / ends a line ----
  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape') {
      navigate({ name: 'minigames' });
      return;
    }
    if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      undo();
      return;
    }
    const d: Record<string, Cell> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (d[e.key]) {
      e.preventDefault();
      keyboardActive = true;
      const n = cells;
      const next: Cell = [Math.max(0, Math.min(n - 1, cursor[0] + d[e.key][0])), Math.max(0, Math.min(n - 1, cursor[1] + d[e.key][1]))];
      cursor = next;
      if (keyDrawing) extendTo(next);
      draw();
    } else if ((e.key === ' ' || e.key === 'Enter') && !(e.target instanceof HTMLButtonElement) && !solved) {
      e.preventDefault();
      keyboardActive = true;
      if (!keyDrawing) {
        keyDrawing = true;
        beginAt(cursor);
      } else {
        keyDrawing = false;
        finishStroke();
      }
      draw();
    }
  }

  const levelNames = $derived(levels.map((l) => l.manifest.name));
  const doneCount = $derived(levels.filter((l) => solvedIds.includes(l.manifest.id)).length);
</script>

<svelte:window onkeydown={key} />

<GameFrame
  title="Paint Flow"
  game="flow"
  levels={mode === 'puzzle' ? levelNames : []}
  {idx}
  onLevel={(i) => newPuzzle(i)}
  modes={[
    { id: 'puzzle', label: 'Puzzle' },
    { id: 'relax', label: 'Relax' },
    { id: 'free', label: 'Free Flow' }
  ]}
  {mode}
  onMode={(m) => setMode(m as Mode)}
  {name}
  objective={mode === 'puzzle' ? (level?.manifest.objective ?? '') : mode === 'relax' ? 'A fresh board every time. Join each pair of dots.' : 'Draw colorful lines wherever you like.'}
>
  {#snippet stats()}
    {#if mode !== 'free'}<span class="stat"><Icon name="check" size={16} /> {connected} / {total}</span>{/if}
    {#if mode === 'puzzle'}<span class="stat soft">{doneCount} of {levels.length} done</span>{/if}
  {/snippet}
  {#snippet actions()}
    <Button variant="soft" size="sm" icon="undo" title="Undo (Ctrl+Z)" onclick={undo}>Undo</Button>
    <Button variant="ghost" size="sm" icon="refresh" onclick={reset}>{mode === 'free' ? 'Clear' : 'Reset'}</Button>
    {#if mode !== 'free'}<Button variant="soft" size="sm" icon="sparkle" onclick={hint}>Hint</Button>{/if}
    {#if mode === 'relax'}<Button variant="ghost" size="sm" onclick={newRelax}>New board</Button>{/if}
  {/snippet}

  <div class="side">
    {#if mode === 'relax'}
      <div class="pickers" role="group" aria-label="Board size">
        {#each [4, 5, 6, 7] as n}<button class:on={size === n} onclick={() => { size = n; newRelax(); }}>{n}×{n}</button>{/each}
      </div>
    {:else if mode === 'free'}
      <div class="swatches" role="group" aria-label="Color">
        {#each PASTELS as col}<button class:on={freeColor === col} style="background:{col}" aria-label="Color {col}" onclick={() => (freeColor = col)}></button>{/each}
      </div>
    {/if}
  </div>

  <div class="board" bind:this={box}>
    <canvas bind:this={canvas} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} aria-label="Paint Flow board. Drag from a dot to its matching dot, or use the arrow keys and Space."></canvas>
    {#if solved}
      {#if mode === 'puzzle'}
        <GameResult
          big="🎨"
          title="Beautifully connected"
          level={idx + 1}
          total={levels.length}
          noun="board"
          onAgain={() => newPuzzle()}
          onNext={() => newPuzzle(idx + 1)}
          onFirst={() => newPuzzle(0)}
        />
      {:else}
        <GameResult big="🎨" title="Beautifully connected" onNext={newRelax} nextLabel="New board" />
      {/if}
    {/if}
  </div>
</GameFrame>

<style>
  .board {
    position: relative;
    flex: 1;
    min-height: 0;
    width: 100%;
    display: grid;
    place-items: center;
  }
  canvas {
    display: block;
    border-radius: 28px;
    box-shadow: var(--shadow-m);
    border: 4px solid rgb(var(--w) / 0.85);
    touch-action: none;
    cursor: crosshair;
  }
  .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .stat.soft {
    font-weight: 700;
    opacity: 0.85;
  }
  .side {
    min-height: 0;
  }
  .pickers {
    display: flex;
    gap: 6px;
    background: var(--panel);
    padding: 4px;
    border-radius: 999px;
    box-shadow: var(--shadow-s);
  }
  .pickers button {
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--ink-soft);
  }
  .pickers button.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .swatches {
    display: flex;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .swatches button {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 1px rgba(110, 106, 142, 0.3);
  }
  .swatches button.on {
    box-shadow: 0 0 0 3px var(--lavender-deep);
  }
</style>
