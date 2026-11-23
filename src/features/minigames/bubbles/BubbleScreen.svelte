<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { settings } from '../../../core/settings';
  import { sfx } from '../../../core/audio';
  import Button from '../../../ui/Button.svelte';
  import Icon from '../../../ui/Icon.svelte';
  import GameFrame from '../GameFrame.svelte';
  import { GameLoop } from '../loop';
  import { ParticleSystem } from '../particles';
  import { BubbleGarden, FIELD_H, FIELD_W, type BubbleMode } from './logic';
  import { drawScenery } from '../scenery';
  import { recordPlayed } from '../progress';

  let { levelId, mode: initialMode = 'relax' }: { levelId?: string; mode?: BubbleMode } = $props();

  const levels = $derived($catalog.bubbleLevels);
  let canvas: HTMLCanvasElement | undefined = $state();
  let ctx: CanvasRenderingContext2D;
  let game: BubbleGarden | null = null;
  const particles = new ParticleSystem(160);
  let loop: GameLoop | null = null;

  let mode = $state<BubbleMode>(untrack(() => initialMode));
  let idx = $state(0);
  let paused = $state(false);
  let popped = $state(0);
  let request = $state<{ color: string; need: number; got: number } | null>(null);
  let completed = $state(0);
  let finished = $state(false);

  const level = $derived(levels[idx]);
  const calm = $derived($settings.reducedMotion || $settings.lowPowerMode ? 0.55 : 1);

  function sync() {
    if (!game) return;
    popped = game.popped;
    completed = game.completed;
    finished = game.finished;
    const r = game.request;
    if (!r) request = null;
    else if (!request || request.color !== r.color || request.got !== r.got || request.need !== r.need) request = { ...r };
  }

  function start(m: BubbleMode = mode, i = idx) {
    const lv = levels[i];
    if (!lv) return;
    mode = m;
    idx = i;
    particles.clear();
    held = null;
    game = new BubbleGarden(lv.manifest, m, Math.random, {
      onPop: (b, merged) => {
        particles.burst(b.x, b.y, b.color, merged ? 14 : 7);
        sfx.bubble();
      },
      onMerge: () => sfx.match(),
      onRequestDone: () => sfx.chime(),
      onFinish: () => recordPlayed('bubbles', lv.manifest.id)
    }, calm);
    sync();
    loop?.start();
  }

  onMount(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas!.width = FIELD_W * dpr;
    canvas!.height = FIELD_H * dpr;
    ctx = canvas!.getContext('2d', { alpha: false })!;
    ctx.scale(dpr, dpr);
    loop = new GameLoop(
      (dt) => {
        if (!game || paused) return;
        particles.enabled = !($settings.disableParticles || $settings.lowPowerMode);
        game.update(dt);
        particles.update(dt);
        sync();
      },
      () => draw()
    );
    const i = levelId ? Math.max(0, levels.findIndex((l) => l.manifest.id === levelId)) : 0;
    start(initialMode, i);
  });
  onDestroy(() => loop?.dispose());

  function draw() {
    if (!game || !level) return;
    const lv = level.manifest;
    drawScenery(ctx, FIELD_W, FIELD_H, lv.sky, lv.scenery);
    for (const b of game.bubbles) {
      const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.35, b.color + 'cc');
      g.addColorStop(1, b.color + '88');
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = b.held ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.38, b.r * 0.2, Math.PI * 1.1, Math.PI * 1.7);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    particles.draw(ctx);
  }

  // ---- pointer: tap to pop, drag to merge ----
  let held: { id: number; moved: number; sx: number; sy: number } | null = null;
  function pos(e: PointerEvent) {
    const r = canvas!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * FIELD_W, y: ((e.clientY - r.top) / r.height) * FIELD_H };
  }
  function down(e: PointerEvent) {
    if (!game || paused || game.finished) return;
    const p = pos(e);
    const b = game.at(p.x, p.y);
    if (!b) return;
    try {
      canvas!.setPointerCapture(e.pointerId);
    } catch {
      /* some pointers cannot be captured: dragging still works */
    }
    held = { id: b.id, moved: 0, sx: p.x, sy: p.y };
  }
  function move(e: PointerEvent) {
    if (!game || !held) return;
    const p = pos(e);
    held.moved = Math.max(held.moved, Math.hypot(p.x - held.sx, p.y - held.sy));
    if (held.moved > 10) {
      game.drag(held.id, p.x, p.y);
      loop?.drawOnce();
    }
  }
  function up() {
    if (!game || !held) return;
    const h = held;
    held = null;
    if (h.moved <= 10) game.pop(h.id);
    else game.release(h.id);
    sync();
    loop?.drawOnce();
  }

  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate({ name: 'minigames' });
    else if (e.key.toLowerCase() === 'p') paused = !paused;
    else if ((e.key === ' ' || e.key === 'Enter') && game && !paused && !game.finished && !(e.target instanceof HTMLButtonElement)) {
      // Keyboard play: pop the lowest bubble.
      e.preventDefault();
      const b = [...game.bubbles].sort((a, c) => c.y - a.y)[0];
      if (b) {
        game.pop(b.id);
        sync();
      }
    }
  }

  $effect(() => {
    if (paused) {
      loop?.drawOnce();
      loop?.stop();
    } else if (loop && game) loop.start();
  });
</script>

<svelte:window onkeydown={key} />

<GameFrame
  title="Bubble Garden"
  game="bubbles"
  levels={levels.map((l) => l.manifest.name)}
  {idx}
  onLevel={(i) => start(mode, i)}
  modes={[
    { id: 'relax', label: 'Relax' },
    { id: 'match', label: 'Color Match' },
    { id: 'endless', label: 'Endless' }
  ]}
  {mode}
  onMode={(m) => start(m as BubbleMode)}
  name={level?.manifest.name ?? ''}
  objective={mode === 'relax' ? 'Pop them, drag matching colors together, or simply watch them float.' : (level?.manifest.objective ?? '')}
>
  {#snippet stats()}
    {#if mode !== 'relax'}<span class="stat"><Icon name="sparkle" size={16} /> {popped}</span>{/if}
  {/snippet}
  {#snippet actions()}
    <Button variant="ghost" size="sm" icon={paused ? 'play' : 'pause'} title="Pause (P)" onclick={() => (paused = !paused)} />
  {/snippet}

  <div class="field">
    {#if request && mode !== 'relax'}
      <div class="request" aria-live="polite">
        <i style="background:{request.color}"></i>
        <span>Pop or merge <b>{Math.max(0, request.need - request.got)}</b> more of this color</span>
        {#if mode === 'match'}<small>{completed} of {level?.manifest.rounds ?? 0}</small>{/if}
      </div>
    {/if}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <canvas bind:this={canvas} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} aria-label="Bubble Garden. Click a bubble to pop it, or drag one onto a matching color."></canvas>
    {#if paused}
      <div class="overlay">
        <h2>Paused</h2>
        <Button variant="primary" icon="play" onclick={() => (paused = false)}>Resume</Button>
      </div>
    {/if}
    {#if finished}
      <div class="overlay">
        <div class="big">🫧</div>
        <h2>A lovely round</h2>
        <p class="muted">All your bubbles are happy.</p>
        <div class="acts">
          <Button variant="primary" onclick={() => start(mode)}>Play again</Button>
          <Button variant="soft" onclick={() => start('relax')}>Just relax</Button>
          <Button variant="ghost" onclick={() => navigate({ name: 'minigames' })}>All games</Button>
        </div>
      </div>
    {/if}
  </div>
</GameFrame>

<style>
  .field {
    position: relative;
    width: min(100%, calc((100vh - 190px) * 900 / 580));
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
    cursor: pointer;
  }
  .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .request {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 16px 6px 8px;
    border-radius: 999px;
    background: rgb(var(--w) / 0.85);
    box-shadow: var(--shadow-s);
    font-weight: 700;
    color: var(--ink);
    font-size: 0.92rem;
    white-space: nowrap;
  }
  .request i {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 0 1px rgba(110, 106, 142, 0.25);
  }
  .request small {
    color: var(--ink-soft);
  }
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgb(var(--w) / 0.55);
    backdrop-filter: blur(3px);
    text-align: center;
  }
  .big {
    font-size: 3rem;
  }
  .acts {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>
