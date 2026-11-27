<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { settings } from '../../../core/settings';
  import { sfx } from '../../../core/audio';
  import type { CatcherKind } from '../../../core/manifests14';
  import Button from '../../../ui/Button.svelte';
  import GameResult from '../GameResult.svelte';
  import Icon from '../../../ui/Icon.svelte';
  import GameFrame from '../GameFrame.svelte';
  import { GameLoop } from '../loop';
  import { ParticleSystem } from '../particles';
  import { drawScenery } from '../scenery';
  import { recordPlayed } from '../progress';
  import { CloudCatcher, FIELD_H, FIELD_W, MATCH_GOAL, PATTERN_REPEATS, type CatcherMode, type Drifter } from './logic';

  let { levelId, mode: initialMode = 'relax' }: { levelId?: string; mode?: CatcherMode } = $props();

  const levels = $derived($catalog.catcherLevels);
  let canvas: HTMLCanvasElement | undefined = $state();
  let ctx: CanvasRenderingContext2D;
  let game: CloudCatcher | null = null;
  const particles = new ParticleSystem(140);
  let loop: GameLoop | null = null;

  let mode = $state<CatcherMode>(untrack(() => initialMode));
  let idx = $state(0);
  let paused = $state(false);
  let caught = $state(0);
  let step = $state(0);
  let repeats = $state(0);
  let finished = $state(false);
  const level = $derived(levels[idx]);
  const calm = $derived($settings.reducedMotion || $settings.lowPowerMode ? 0.55 : 1);

  const NAMES: Record<CatcherKind, string> = { cloud: 'clouds', star: 'stars', moon: 'moons', drop: 'drops', petal: 'petals' };

  function sync() {
    if (!game) return;
    caught = game.caught;
    step = game.step;
    repeats = game.repeats;
    finished = game.finished;
  }

  function start(m: CatcherMode = mode, i = idx) {
    const lv = levels[i];
    if (!lv) return;
    mode = m;
    idx = i;
    particles.clear();
    held = null;
    game = new CloudCatcher(lv.manifest, m, Math.random, {
      onCatch: (d, z) => {
        particles.burst(z.x + z.w / 2, z.y + 30, d.color, 8);
        sfx.sparkle();
      },
      onReject: () => sfx.thud(),
      onPatternStep: () => sfx.match(),
      onFinish: () => {
        sfx.chime();
        recordPlayed('catcher', lv.manifest.id);
      }
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

  // ---- drawing ----
  function shape(d: Drifter) {
    const { x, y, r } = d;
    ctx.fillStyle = d.color;
    ctx.strokeStyle = d.held ? '#ffffff' : 'rgba(110,106,142,0.55)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    if (d.kind === 'cloud') {
      // One clean outline: stroke every part, then fill every part again without a stroke on top.
      const parts: [number, number, number][] = [[x - r * 0.5, y + r * 0.12, r * 0.46], [x - r * 0.05, y - r * 0.22, r * 0.58], [x + r * 0.5, y + r * 0.1, r * 0.44]];
      const bar = () => {
        ctx.beginPath();
        ctx.roundRect(x - r * 0.9, y + r * 0.02, r * 1.8, r * 0.52, r * 0.26);
      };
      for (const [cx, cy, cr] of parts) {
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      bar();
      ctx.fill();
      ctx.stroke();
      for (const [cx, cy, cr] of parts) {
        ctx.beginPath();
        ctx.arc(cx, cy, cr - 1.4, 0, 7);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.roundRect(x - r * 0.9 + 1.4, y + r * 0.02 + 1.4, r * 1.8 - 2.8, r * 0.52 - 2.8, r * 0.24);
      ctx.fill();
      ctx.fillStyle = 'rgba(110,106,142,0.7)';
      ctx.beginPath();
      ctx.arc(x - r * 0.2, y + r * 0.2, 2.8, 0, 7);
      ctx.arc(x + r * 0.2, y + r * 0.2, 2.8, 0, 7);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    switch (d.kind) {
      case 'star': {
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const rad = i % 2 ? r * 0.45 : r;
          ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
        }
        ctx.closePath();
        break;
      }
      case 'moon':
        ctx.arc(x, y, r * 0.9, 0.55, Math.PI * 2 - 0.55);
        ctx.arc(x + r * 0.42, y - r * 0.05, r * 0.7, Math.PI * 2 - 0.95, 0.95, true);
        ctx.closePath();
        break;
      case 'drop':
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x + r * 0.95, y + r * 0.3, x, y + r * 0.95);
        ctx.quadraticCurveTo(x - r * 0.95, y + r * 0.3, x, y - r);
        break;
      case 'petal':
        ctx.ellipse(x, y, r * 0.55, r * 0.95, 0.5, 0, 7);
        break;
    }
    ctx.fill();
    ctx.stroke();
    if (d.kind === 'moon') {
      ctx.fillStyle = 'rgba(110,106,142,0.7)';
      ctx.beginPath();
      ctx.arc(x - r * 0.18, y + r * 0.12, 2.6, 0, 7);
      ctx.arc(x + r * 0.2, y + r * 0.12, 2.6, 0, 7);
      ctx.fill();
    }
  }

  function draw() {
    if (!game || !level) return;
    const lv = level.manifest;
    drawScenery(ctx, FIELD_W, FIELD_H, lv.sky, lv.scenery);
    for (const z of game.zones) {
      const glow = z.flash ? Math.min(1, z.flash / 0.5) : 0;
      // a solid box: it stays easy to see on any sky, including the night one
      ctx.fillStyle = '#fbf9ff';
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.w, z.h, 28);
      ctx.fill();
      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.roundRect(z.x + 6, z.y + 6, z.w - 12, z.h - 12, 24);
      ctx.fill();
      if (glow) {
        ctx.fillStyle = `rgba(226,84,96,${0.85 * glow})`;
        ctx.beginPath();
        ctx.roundRect(z.x + 6, z.y + 6, z.w - 12, z.h - 12, 24);
        ctx.fill();
      }
      ctx.lineWidth = 4;
      ctx.strokeStyle = glow ? `rgba(200,50,70,${0.6 + 0.4 * glow})` : 'rgba(70,66,110,0.75)';
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.w, z.h, 28);
      ctx.stroke();
      // the name sits on a light chip so it can be read on any color
      ctx.font = '800 15px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(z.label).width + 22;
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.beginPath();
      ctx.roundRect(z.x + z.w / 2 - tw / 2, z.y + z.h - 36, tw, 24, 12);
      ctx.fill();
      ctx.fillStyle = 'rgba(60,56,100,0.95)';
      ctx.fillText(z.label, z.x + z.w / 2, z.y + z.h - 19);
      if (game.selected !== null) {
        ctx.setLineDash([8, 7]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.roundRect(z.x - 5, z.y - 5, z.w + 10, z.h + 10, 32);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    for (const d of game.items) {
      const a = d.settling ? Math.max(0, 1 - Math.max(0, d.settling.t - 0.6) * 2.4) : 1;
      ctx.globalAlpha = a;
      shape(d);
      ctx.globalAlpha = 1;
      if (game.selected === d.id) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([7, 6]);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r + 11, 0, 7);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    particles.draw(ctx);
  }

  // ---- pointer ----
  let held: { id: number; moved: number; sx: number; sy: number } | null = null;
  const pos = (e: PointerEvent) => {
    const r = canvas!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * FIELD_W, y: ((e.clientY - r.top) / r.height) * FIELD_H };
  };
  function down(e: PointerEvent) {
    if (!game || paused || game.finished) return;
    const p = pos(e);
    const d = game.at(p.x, p.y);
    if (!d) {
      // with something picked up, a tap on a box sends it there; a tap anywhere else lets it go
      if (game.selected !== null) {
        const z = game.zoneAt(p.x, p.y);
        if (z) game.sendTo(z.id);
        else game.selected = null;
        sync();
        loop?.drawOnce();
      }
      return;
    }
    try {
      canvas!.setPointerCapture(e.pointerId);
    } catch {
      /* some pointers cannot be captured: dragging still works */
    }
    held = { id: d.id, moved: 0, sx: p.x, sy: p.y };
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
    if (h.moved <= 10) game.select(h.id);
    else game.drop(h.id);
    sync();
    loop?.drawOnce();
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate({ name: 'minigames' });
    else if (e.key.toLowerCase() === 'p') paused = !paused;
    else if ((e.key === ' ' || e.key === 'Enter') && game && !paused && !game.finished && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      const d = game.items.filter((q) => !q.settling).sort((a, b) => a.x - b.x).find((q) => game!.zones.some((z) => game!.accepts(z, q)));
      if (d) game.autoCatch(d.id);
      sync();
    }
  }
  $effect(() => {
    if (paused) {
      loop?.drawOnce();
      loop?.stop();
    } else if (loop && game) loop.start();
  });

  const objective = $derived(
    mode === 'relax'
      ? 'Drag anything into any zone, or click it and then click a zone. There is nothing to get right.'
      : mode === 'pattern'
        ? 'Catch them in the order shown above. Click one, then click a zone, or drag it there.'
        : mode === 'match'
          ? 'Match each color to the zone of the same color. Click one, then click a zone, or drag it there.'
          : 'Match colors for as long as you like.'
  );
</script>

<svelte:window onkeydown={key} />

<GameFrame
  title="Cloud Catcher"
  game="catcher"
  levels={levels.map((l) => l.manifest.name)}
  {idx}
  onLevel={(i) => start(mode, i)}
  modes={[
    { id: 'relax', label: 'Relax' },
    { id: 'match', label: 'Color Match' },
    { id: 'pattern', label: 'Pattern' },
    { id: 'endless', label: 'Endless' }
  ]}
  {mode}
  onMode={(m) => start(m as CatcherMode)}
  name={level?.manifest.name ?? ''}
  {objective}
>
  {#snippet stats()}
    {#if mode !== 'relax'}<span class="stat"><Icon name="sparkle" size={16} /> {caught}{mode === 'match' ? ` / ${MATCH_GOAL}` : ''}</span>{/if}
  {/snippet}
  {#snippet actions()}
    <Button variant="ghost" size="sm" icon={paused ? 'play' : 'pause'} title="Pause (P)" onclick={() => (paused = !paused)} />
  {/snippet}

  <div class="field">
    {#if mode === 'pattern' && level}
      <div class="pattern" aria-live="polite" aria-label="Pattern">
        {#each level.manifest.pattern as k, i}
          <span class="pk" class:now={i === step % level.manifest.pattern.length} class:past={step % level.manifest.pattern.length > i}>{NAMES[k]}</span>
        {/each}
        <small>{Math.min(repeats, PATTERN_REPEATS)} of {PATTERN_REPEATS}</small>
      </div>
    {/if}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <canvas bind:this={canvas} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} aria-label="Cloud Catcher. Drag floating clouds and stars into the zones, or click one and then click a zone."></canvas>
    {#if paused}
      <div class="overlay"><h2>Paused</h2><Button variant="primary" icon="play" onclick={() => (paused = false)}>Resume</Button></div>
    {/if}
    {#if finished}
      <GameResult
        big="☁️"
        title="All caught, softly"
        message="What a calm sky."
        level={mode === 'match' || mode === 'pattern' ? idx + 1 : 0}
        total={mode === 'match' || mode === 'pattern' ? levels.length : 0}
        noun="level"
        onAgain={() => start(mode)}
        onNext={(mode === 'match' || mode === 'pattern') && idx + 1 < levels.length ? () => start(mode, idx + 1) : undefined}
        onFirst={() => start(mode, 0)}
      >
        {#snippet extra()}<Button variant="soft" onclick={() => start('relax')}>Just relax</Button>{/snippet}
      </GameResult>
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
    cursor: grab;
  }
  .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .pattern {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgb(var(--w) / 0.88);
    box-shadow: var(--shadow-s);
    white-space: nowrap;
  }
  .pk {
    padding: 4px 12px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.5);
  }
  .pk.now {
    background: linear-gradient(135deg, var(--g1), var(--g2));
    color: var(--g-ink);
  }
  .pk.past {
    opacity: 0.5;
  }
  .pattern small {
    margin-left: 6px;
    color: var(--ink-soft);
    font-weight: 700;
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
</style>
