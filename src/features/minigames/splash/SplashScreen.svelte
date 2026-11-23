<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { asset, catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { settings } from '../../../core/settings';
  import { sfx } from '../../../core/audio';
  import { canvasToPng } from '../../painting/raster';
  import { savePngFile } from '../../painting/export';
  import { confirmDialog, toast } from '../../../core/feedback';
  import { saveWallToGallery } from './gallery';
  import Button from '../../../ui/Button.svelte';
  import Icon from '../../../ui/Icon.svelte';
  import { GameLoop } from '../loop';
  import { SplashGame } from './game';
  import { WALL_H, WALL_W, type GoalStatus } from './wall';

  let { levelId }: { levelId?: string } = $props();

  const levels = $derived($catalog.splashLevels);
  let canvas: HTMLCanvasElement | undefined = $state();
  let ctx: CanvasRenderingContext2D;
  let game: SplashGame | null = null;
  let loop: GameLoop | null = null;

  let idx = $state(0);
  let loading = $state(true);
  let error = $state('');
  let status = $state<GoalStatus>({ done: false, progress: 0, label: '', items: [] });
  let complete = $state(false);
  let colorIdx = $state(1);
  let surprise = $state(false);
  let palette = $state<string[]>([]);
  let power = $state(0);

  const level = $derived(levels[idx]);

  async function openLevel(i: number) {
    const lv = levels[i];
    if (!lv || !canvas) return;
    idx = i;
    loading = true;
    error = '';
    complete = false;
    try {
      const svg = await asset(lv.tree, lv.dir, lv.manifest.wall).text();
      if (!svg) throw new Error('missing wall');
      game = new SplashGame({
        onThrow: () => {
          sfx.throw();
          loop?.start();
        },
        onImpact: () => {
          sfx.splash();
          setTimeout(() => sfx.bubble(), 120);
        },
        onProgress: (s) => (status = s),
        onComplete: () => {
          complete = true;
          sfx.chime();
          const g = game!;
          for (let k = 0; k < 10; k++) g.particles.burst(Math.random() * WALL_W, 200 + Math.random() * 300, g.palette[k % g.palette.length], 4);
          loop?.start();
        }
      });
      await game.load(svg, lv.manifest.goal, lv.manifest.colors ?? ['#f6b8cf', '#bfe4f7', '#c6ecda', '#fff2bd', '#d9cdf6', '#ffdcc8']);
      palette = game.palette;
      colorIdx = 1;
      surprise = false;
      game.reducedMotion = $settings.reducedMotion || $settings.lowPowerMode;
      game.particles.enabled = !($settings.disableParticles || $settings.lowPowerMode);
      loop?.drawOnce();
    } catch (e) {
      console.error(e);
      error = "This wall couldn't be loaded.";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas!.width = WALL_W * dpr;
    canvas!.height = WALL_H * dpr;
    ctx = canvas!.getContext('2d', { alpha: false })!;
    ctx.scale(dpr, dpr);
    loop = new GameLoop(
      (dt) => {
        if (!game) return;
        game.reducedMotion = $settings.reducedMotion || $settings.lowPowerMode;
        game.particles.enabled = !($settings.disableParticles || $settings.lowPowerMode);
        game.update(dt);
        power = game.charging ? game.power : 0;
        if (!game.busy) loop?.stop();
      },
      () => game && game.map && game.render(ctx)
    );
    const start = levelId ? Math.max(0, levels.findIndex((l) => l.manifest.id === levelId)) : 0;
    void openLevel(start);
  });
  onDestroy(() => loop?.dispose());

  function toWall(e: PointerEvent) {
    const r = canvas!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * WALL_W, y: ((e.clientY - r.top) / r.height) * WALL_H };
  }
  function move(e: PointerEvent) {
    if (!game) return;
    const p = toWall(e);
    game.aim.x = p.x;
    game.aim.y = p.y;
    game.aim.inside = true;
    if (!game.busy) loop?.drawOnce();
  }
  function leave() {
    if (!game) return;
    game.aim.inside = false;
    if (!game.busy) loop?.drawOnce();
  }
  function down(e: PointerEvent) {
    if (!game || e.button !== 0 || loading) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    move(e);
    game.startCharge();
    loop?.start();
  }
  function up(e: PointerEvent) {
    if (!game) return;
    game.release();
    power = 0;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    loop?.start();
  }

  function chooseColor(i: number) {
    colorIdx = i;
    surprise = false;
    if (game) {
      game.colorIdx = i;
      game.surprise = false;
    }
    sfx.pop(1.1);
    if (game && !game.busy) loop?.drawOnce();
  }
  function toggleSurprise() {
    surprise = !surprise;
    if (game) game.surprise = surprise;
    sfx.sparkle();
  }

  async function reset() {
    const ok = await confirmDialog({ title: 'Wash the wall?', message: 'All the paint on this wall will be rinsed away.', confirmLabel: 'Wash wall', danger: true });
    if (!ok || !game) return;
    game.resetWall();
    complete = false;
    loop?.drawOnce();
  }

  async function save() {
    if (!game) return;
    await savePngFile(await canvasToPng(await game.exportPng()), `${level?.manifest.name ?? 'splash wall'}`);
  }

  let savingToGallery = $state(false);
  async function saveToGallery() {
    if (!game || savingToGallery) return;
    savingToGallery = true;
    try {
      await saveWallToGallery(await game.exportPng(), level?.manifest.name);
      sfx.chime();
      toast('Saved to your Gallery ✨', 'success');
    } catch (e) {
      console.error(e);
      toast("Couldn't save to the Gallery. Please try again.", 'error');
    } finally {
      savingToGallery = false;
    }
  }

  function key(e: KeyboardEvent) {
    const n = Number(e.key);
    if (n >= 1 && n <= palette.length) chooseColor(n);
    else if (e.key === 'Escape') navigate({ name: 'minigames' });
  }

  function nextLevel() {
    complete = false;
    void openLevel((idx + 1) % levels.length);
  }
</script>

<svelte:window onkeydown={key} />

<div class="screen">
  <header class="bar">
    <Button variant="soft" size="sm" icon="chevronLeft" onclick={() => navigate({ name: 'minigames', game: 'splash' })}>Levels</Button>
    <h2>Splash Wall</h2>
    <label class="pick">
      <span class="sr-only">Level</span>
      <select value={idx} onchange={(e) => openLevel(Number(e.currentTarget.value))}>
        {#each levels as l, i}<option value={i}>{String(i + 1).padStart(2, '0')} · {l.manifest.name}</option>{/each}
      </select>
    </label>
    <span class="spacer"></span>
    <Button variant="ghost" size="sm" icon="image" title="Save this wall to your Gallery" disabled={savingToGallery || loading} onclick={saveToGallery}>Save to Gallery</Button>
    <Button variant="ghost" size="sm" icon="download" title="Export the picture as a PNG file" onclick={save}>Export PNG</Button>
    <Button variant="ghost" size="sm" icon="refresh" title="Wash the wall" onclick={reset}>Wash</Button>
  </header>

  <div class="stage">
    <div class="info">
      <strong>{level?.manifest.name ?? ''}</strong>
      <span>{level?.manifest.objective ?? ''}</span>
    </div>

    <div class="field">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="inner" onpointermove={move} onpointerleave={leave} onpointerdown={down} onpointerup={up} onpointercancel={up}>
        <canvas bind:this={canvas}></canvas>
      </div>
      {#if loading}<div class="overlay soft"><i class="spin"></i> Setting up the wall…</div>{/if}
      {#if error}<div class="overlay soft">{error}</div>{/if}
      {#if complete}
        <div class="overlay">
          <div class="big">🎉</div>
          <h2>Wall complete!</h2>
          <p class="muted">It looks wonderful. Keep splashing, or move on whenever you like.</p>
          <div class="acts">
            <Button variant="primary" onclick={nextLevel}>Next wall</Button>
            <Button variant="soft" icon="image" disabled={savingToGallery} onclick={saveToGallery}>Save to Gallery</Button>
            <Button variant="soft" onclick={() => (complete = false)}>Keep splashing</Button>
            <Button variant="ghost" onclick={() => navigate({ name: 'minigames' })}>All games</Button>
          </div>
        </div>
      {/if}
    </div>

    <div class="dock">
      <div class="colors" role="group" aria-label="Balloon colors">
        {#each palette as c, i}
          <button class="chip" class:on={!surprise && colorIdx === i + 1} style="--c:{c}" title="Color {i + 1}" aria-label="Color {i + 1}" onclick={() => chooseColor(i + 1)}></button>
        {/each}
        <button class="chip surprise" class:on={surprise} title="Surprise me — a random color each throw" aria-label="Random colors" onclick={toggleSurprise}><Icon name="sparkle" size={18} /></button>
      </div>
      <div class="power" aria-hidden="true"><i style="width:{Math.round(power * 100)}%"></i></div>
      <div class="goal">
        <strong>{status.label}</strong>
        {#if status.items.length}
          <div class="items">
            {#each status.items as it}
              <span class="item" class:done={it.done} title={it.name}>
                {#if it.color}<i style="background:{it.color}"></i>{/if}
                {it.name}
                {#if it.done}<Icon name="check" size={13} stroke={3} />{/if}
              </span>
            {/each}
          </div>
        {:else if level?.manifest.goal.type === 'coverage'}
          <div class="bar-prog"><i style="width:{Math.round(status.progress * 100)}%"></i></div>
        {/if}
      </div>
    </div>
    <p class="how">Aim with the mouse. Click to throw — hold the button for a bigger splash, then release.</p>
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
    margin: 14px 18px 8px;
    padding: 8px 14px;
    border-radius: 28px;
    background: var(--panel);
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
  .pick select {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: #fff;
    font-weight: 700;
  }
  .stage {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 18px 12px;
    gap: 8px;
  }
  .info {
    display: flex;
    gap: 12px;
    align-items: baseline;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .info strong {
    color: var(--ink);
    font-size: 1.05rem;
  }
  .field {
    position: relative;
    flex: 1;
    min-height: 0;
    aspect-ratio: 1000 / 750;
    max-width: 100%;
    border-radius: var(--radius-l);
    overflow: hidden;
    box-shadow: var(--shadow-l);
    border: 3px solid #fff;
    background: #fffdf8;
  }
  .inner {
    width: 100%;
    height: 100%;
    cursor: crosshair;
    touch-action: none;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(240, 236, 252, 0.75);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    animation: fade 0.3s ease-out;
    text-align: center;
    padding: 20px;
  }
  .overlay.soft {
    flex-direction: row;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .big {
    font-size: 3rem;
  }
  .acts {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .spin {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 4px solid #d8cff5;
    border-top-color: #9b86df;
    animation: spin 1s linear infinite;
  }
  .dock {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 10px 18px;
    border-radius: 999px;
    background: var(--panel);
    box-shadow: var(--shadow-s);
    max-width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }
  .colors {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .chip {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--c);
    border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(80, 70, 140, 0.25);
    transition: transform 0.15s var(--ease);
    display: grid;
    place-items: center;
  }
  .chip:hover {
    transform: scale(1.12);
  }
  .chip.on {
    box-shadow:
      0 0 0 3px var(--lavender-deep),
      0 3px 8px rgba(80, 70, 140, 0.3);
    transform: scale(1.1);
  }
  .surprise {
    background: conic-gradient(#f6b8cf, #fff2bd, #c6ecda, #bfe4f7, #d9cdf6, #f6b8cf);
    color: #fff;
  }
  .power {
    width: 110px;
    height: 10px;
    border-radius: 999px;
    background: #e8e3f6;
    overflow: hidden;
  }
  .power i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #9fd3f2, #f49bbd);
    border-radius: 999px;
  }
  .goal {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.88rem;
    min-width: 150px;
  }
  .items {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    max-width: 360px;
  }
  .item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 9px;
    border-radius: 999px;
    background: rgb(var(--w) / 0.8);
    font-weight: 700;
    font-size: 0.74rem;
    color: var(--ink-soft);
  }
  .item i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(80, 70, 140, 0.3);
  }
  .item.done {
    background: var(--mint);
    color: var(--c-green);
  }
  .bar-prog {
    height: 8px;
    border-radius: 999px;
    background: #e8e3f6;
    overflow: hidden;
  }
  .bar-prog i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--g1), var(--g2));
    transition: width 0.3s;
  }
  .how {
    color: var(--ink-faint);
    font-size: 0.8rem;
    font-weight: 700;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
