<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { settings } from '../../../core/settings';
  import { sfx } from '../../../core/audio';
  import Button from '../../../ui/Button.svelte';
  import Icon from '../../../ui/Icon.svelte';
  import { GameLoop } from '../loop';
  import { ParticleSystem } from '../particles';
  import { BreakerGame, FIELD_H, FIELD_W, levelToBlocks, randomLevel, type BreakerMode } from './logic';
  import { renderBreaker } from './render';

  let { levelId, mode: initialMode = 'relax' }: { levelId?: string; mode?: BreakerMode } = $props();

  const levels = $derived($catalog.breakerLevels);
  const PALETTE = ['#bfe4f7', '#ffd3e2', '#c6ecda', '#fff2bd', '#d9cdf6', '#ffdcc8'];

  let canvas: HTMLCanvasElement | undefined = $state();
  let wrap: HTMLDivElement | undefined = $state();
  let ctx: CanvasRenderingContext2D;
  let game: BreakerGame | null = null;
  const particles = new ParticleSystem(200);
  let loop: GameLoop | null = null;

  let mode = $state<BreakerMode>(untrack(() => initialMode));
  let idx = $state(0);
  let lives = $state<number | null>(null);
  let popped = $state(0);
  let status = $state<'ready' | 'playing' | 'won' | 'over'>('ready');
  let paused = $state(false);
  let levelName = $state('');
  let objective = $state('');
  let depth = $state(1);

  const rng = Math.random;

  function sync() {
    if (!game) return;
    if (lives !== game.lives) lives = game.lives;
    if (popped !== game.popped) popped = game.popped;
    if (status !== game.status) status = game.status;
  }

  function build(): BreakerGame {
    const g = new BreakerGame(mode, {
      onBreak: (b) => {
        particles.burst(b.x + b.w / 2, b.y + b.h / 2, b.color, 8);
        sfx.pop(0.85 + ((b.y / 40) % 5) * 0.08);
        sync();
      },
      onHit: () => sfx.thud(),
      onPaddle: () => sfx.thud(),
      onWin: () => {
        sfx.chime();
        for (let i = 0; i < 14; i++) particles.burst(Math.random() * FIELD_W, FIELD_H * 0.5 + Math.random() * 100, PALETTE[i % PALETTE.length], 3);
        sync();
      },
      onLost: () => sfx.bubble(),
      onGameOver: () => sync()
    });
    return g;
  }

  function loadLevel(i: number) {
    const lv = levels[i];
    if (!lv) return;
    idx = i;
    levelName = lv.manifest.name;
    objective = lv.manifest.objective;
    game!.loadBlocks(levelToBlocks(lv.manifest));
    sync();
    loop?.drawOnce();
  }

  function startEndlessLevel() {
    levelName = `Endless · Round ${depth}`;
    objective = 'Keep the calm going. Every round speeds up just a little.';
    game!.loadBlocks(levelToBlocks(randomLevel(rng, PALETTE, depth)));
    sync();
    loop?.drawOnce();
  }

  function restart(newMode: BreakerMode = mode) {
    mode = newMode;
    game = build();
    particles.clear();
    paused = false;
    depth = 1;
    if (mode === 'endless') startEndlessLevel();
    else loadLevel(Math.min(idx, levels.length - 1));
    positionPaddleFromLast();
    loop?.start();
  }

  function next() {
    if (!game) return;
    if (mode === 'endless') {
      depth++;
      game.nextLevel(levelToBlocks(randomLevel(rng, PALETTE, depth)));
      levelName = `Endless · Round ${depth}`;
    } else {
      const n = (idx + 1) % levels.length;
      idx = n;
      const lv = levels[n];
      levelName = lv.manifest.name;
      objective = lv.manifest.objective;
      game.nextLevel(levelToBlocks(lv.manifest));
    }
    sync();
    loop?.start();
  }

  let lastX = FIELD_W / 2;
  function positionPaddleFromLast() {
    game?.setPaddleTarget(lastX);
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
        if (game.status === 'won' || game.status === 'over') {
          // keep drawing celebration particles briefly, then stop the loop to save power
          if (particles.count === 0) loop?.stop();
        }
      },
      () => game && renderBreaker(ctx, game, particles)
    );
    const startIdx = levelId ? Math.max(0, levels.findIndex((l) => l.manifest.id === levelId)) : 0;
    idx = startIdx;
    restart(initialMode);
    return () => {};
  });

  onDestroy(() => loop?.dispose());

  function toField(e: PointerEvent) {
    const r = canvas!.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * FIELD_W;
  }

  function move(e: PointerEvent) {
    lastX = toField(e);
    game?.setPaddleTarget(lastX);
  }
  function click() {
    if (paused || !game) return;
    game.launch();
    sync();
  }

  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') game?.nudgePaddle(-50);
    else if (e.key === 'ArrowRight') game?.nudgePaddle(50);
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      click();
    } else if (e.key.toLowerCase() === 'p') paused = !paused;
    else if (e.key === 'Escape') navigate({ name: 'minigames' });
  }

  const hearts = $derived(lives === null ? 0 : lives);
</script>

<svelte:window onkeydown={key} />

<div class="screen">
  <header class="bar">
    <Button variant="soft" size="sm" icon="chevronLeft" onclick={() => navigate({ name: 'minigames' })}>Mini-Games</Button>
    <h2>Pastel Breaker</h2>
    <div class="seg" role="group" aria-label="Mode">
      {#each ['relax', 'classic', 'endless'] as m}
        <button class:on={mode === m} onclick={() => restart(m as BreakerMode)}>{m[0].toUpperCase() + m.slice(1)}</button>
      {/each}
    </div>
    {#if mode !== 'endless'}
      <label class="pick">
        <span class="sr-only">Level</span>
        <select value={idx} onchange={(e) => { idx = Number(e.currentTarget.value); restart(mode); }}>
          {#each levels as l, i}<option value={i}>{String(i + 1).padStart(2, '0')} · {l.manifest.name}</option>{/each}
        </select>
      </label>
    {/if}
    <span class="spacer"></span>
    <span class="stat"><Icon name="sparkle" size={16} /> {popped} popped</span>
    {#if lives !== null}
      <span class="stat hearts" aria-label="{hearts} lives">{#each Array(hearts) as _}<Icon name="heart" size={17} />{/each}</span>
    {:else}
      <span class="stat calm">No lives · relax</span>
    {/if}
    <Button variant="ghost" size="sm" icon={paused ? 'play' : 'pause'} title="Pause (P)" onclick={() => (paused = !paused)} />
  </header>

  <div class="stage">
    <div class="title"><strong>{levelName}</strong><span>{objective}</span></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="field" bind:this={wrap} onpointermove={move} onpointerdown={click}>
      <canvas bind:this={canvas}></canvas>
      {#if status === 'ready' && !paused}
        <div class="hint">{mode === 'relax' ? 'Click to launch — the ball always comes back' : 'Click to launch'}</div>
      {/if}
      {#if paused}
        <div class="overlay">
          <h2>Paused</h2>
          <Button variant="primary" icon="play" onclick={() => (paused = false)}>Resume</Button>
        </div>
      {/if}
      {#if status === 'won'}
        <div class="overlay">
          <div class="big">✨</div>
          <h2>Beautiful!</h2>
          <p class="muted">{popped} blocks popped so far.</p>
          <div class="acts">
            <Button variant="primary" onclick={next}>{mode === 'endless' ? 'Next round' : 'Next level'}</Button>
            <Button variant="soft" onclick={() => restart(mode)}>Replay</Button>
            <Button variant="ghost" onclick={() => navigate({ name: 'minigames' })}>All games</Button>
          </div>
        </div>
      {/if}
      {#if status === 'over'}
        <div class="overlay">
          <div class="big">☁</div>
          <h2>A gentle landing</h2>
          <p class="muted">{popped} blocks popped. That's lovely.</p>
          <div class="acts">
            <Button variant="primary" onclick={() => restart(mode)}>Try again</Button>
            <Button variant="soft" onclick={() => restart('relax')}>Switch to Relax</Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .screen {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 14px 18px 10px;
    padding: 8px 14px;
    border-radius: 999px;
    background: var(--panel);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-s);
    flex-wrap: wrap;
  }
  .bar h2 {
    font-size: 1.1rem;
    margin: 0 6px;
  }
  .spacer {
    flex: 1;
  }
  .seg {
    display: flex;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 999px;
    padding: 3px;
  }
  .seg button {
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--ink-soft);
  }
  .seg button.on {
    background: linear-gradient(135deg, #cfeaf9, #e6dcfa);
    color: #4c3f9c;
  }
  .pick select {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: #fff;
    font-weight: 700;
  }
  .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    color: var(--ink-soft);
    font-size: 0.88rem;
  }
  .hearts {
    color: var(--pink-deep);
  }
  .calm {
    color: #3f8a6a;
  }
  .stage {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 18px 18px;
    gap: 8px;
  }
  .title {
    display: flex;
    gap: 12px;
    align-items: baseline;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .title strong {
    color: var(--ink);
    font-size: 1.05rem;
  }
  .field {
    position: relative;
    flex: 1;
    min-height: 0;
    aspect-ratio: 900 / 640;
    max-width: 100%;
    max-height: 100%;
    border-radius: var(--radius-l);
    overflow: hidden;
    box-shadow: var(--shadow-l);
    border: 3px solid #fff;
    cursor: none;
    touch-action: none;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  .hint {
    position: absolute;
    bottom: 76px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.85);
    padding: 7px 18px;
    border-radius: 999px;
    font-weight: 800;
    color: var(--ink-soft);
    pointer-events: none;
    white-space: nowrap;
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(240, 236, 252, 0.72);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: default;
    animation: fade 0.3s ease-out;
  }
  .big {
    font-size: 3rem;
  }
  .acts {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
