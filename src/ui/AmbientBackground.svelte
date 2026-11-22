<script lang="ts">
  import { onMount } from 'svelte';
  import { onAmbientTick } from './ticker';

  // Decorative scenery. Positions are updated by the shared ~10 fps ambient clock
  // (see ticker.ts), not by 60 fps CSS animations: far cheaper, and identical to
  // look at because everything here moves slowly. It is removed entirely by
  // Reduced Motion / Low Power, stops while the window is hidden, and the
  // painting screen shows only the static gradient (`calm`).
  interface Props {
    calm?: boolean;
  }
  let { calm = false }: Props = $props();

  const clouds = [
    { top: 6, scale: 1.1, speed: 7, phase: 0.1, op: 0.75 },
    { top: 22, scale: 0.7, speed: 5, phase: 0.45, op: 0.6 },
    { top: 48, scale: 1.35, speed: 4.5, phase: 0.8, op: 0.5 },
    { top: 70, scale: 0.9, speed: 6, phase: 0.3, op: 0.55 },
    { top: 84, scale: 0.6, speed: 5.5, phase: 0.62, op: 0.45 }
  ];
  const bubbles = Array.from({ length: 9 }, (_, i) => ({
    left: 6 + ((i * 11.7) % 90),
    size: 10 + ((i * 7) % 22),
    period: 24 + ((i * 5) % 16),
    offset: (i * 6.3) % 30,
    tint: ['#bfe4f7', '#e6d8f8', '#c6ecda', '#ffd3e2', '#fff2bd'][i % 5]
  }));
  const sparkles = Array.from({ length: 6 }, (_, i) => ({
    left: 8 + ((i * 17.3) % 84),
    top: 10 + ((i * 23.1) % 72),
    period: 9 + (i % 3) * 3,
    offset: i * 2.7
  }));

  let cloudEls: SVGSVGElement[] = [];
  let bubbleEls: HTMLSpanElement[] = [];
  let sparkEls: SVGSVGElement[] = [];

  onMount(() => {
    if (calm) return;
    return onAmbientTick((t) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const span = w + 560;
      clouds.forEach((c, i) => {
        const el = cloudEls[i];
        if (!el) return;
        const x = ((c.phase * span + t * c.speed) % span) - 260;
        el.style.transform = `translate3d(${x.toFixed(1)}px,0,0) scale(${c.scale})`;
      });
      bubbles.forEach((b, i) => {
        const el = bubbleEls[i];
        if (!el) return;
        const u = ((t + b.offset) / b.period) % 1;
        const y = -u * (h + 120);
        const x = Math.sin(u * 9.4 + i) * 14;
        const o = u < 0.1 ? (u / 0.1) * 0.7 : u > 0.85 ? ((1 - u) / 0.15) * 0.5 : 0.6;
        el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
        el.style.opacity = o.toFixed(2);
      });
      sparkles.forEach((s, i) => {
        const el = sparkEls[i];
        if (!el) return;
        const u = ((t + s.offset) / s.period) % 1;
        const v = (u - 0.7) / 0.25;
        if (v < 0 || v > 1) {
          el.style.opacity = '0';
          return;
        }
        el.style.opacity = Math.sin(v * Math.PI).toFixed(2);
      });
    });
  });
</script>

<div class="ambient" class:calm aria-hidden="true">
  <div class="wash"></div>
  {#if !calm}
    <span class="glow g1"></span>
    <span class="glow g2"></span>
    {#each clouds as c, i}
      <svg bind:this={cloudEls[i]} class="cloud" style="top:{c.top}%; opacity:{c.op}" viewBox="0 0 220 110" width="220" height="110">
        <g fill="#fff">
          <circle cx="62" cy="64" r="32" />
          <circle cx="104" cy="48" r="40" />
          <circle cx="150" cy="62" r="34" />
          <rect x="30" y="58" width="150" height="40" rx="20" />
        </g>
      </svg>
    {/each}
    {#each bubbles as b, i}
      <span bind:this={bubbleEls[i]} class="bubble" style="left:{b.left}%; width:{b.size}px; height:{b.size}px; --tint:{b.tint}"></span>
    {/each}
    {#each sparkles as s, i}
      <svg bind:this={sparkEls[i]} class="sparkle" style="left:{s.left}%; top:{s.top}%" viewBox="0 0 24 24" width="16" height="16"><path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fffbe0" /></svg>
    {/each}
  {/if}
</div>

<style>
  .ambient {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .wash {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 55% at 15% 10%, #d3ebfa 0, transparent 70%),
      radial-gradient(55% 50% at 90% 18%, #eadffb 0, transparent 70%),
      radial-gradient(60% 60% at 70% 95%, #fde3ee 0, transparent 70%),
      radial-gradient(50% 50% at 8% 90%, #dcf4e8 0, transparent 70%),
      linear-gradient(160deg, var(--bg-a), var(--bg-b) 55%, var(--bg-c));
  }
  .glow {
    position: absolute;
    width: 46vmax;
    height: 46vmax;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 66%);
  }
  .g1 {
    left: -12vmax;
    top: -14vmax;
  }
  .g2 {
    right: -14vmax;
    bottom: -16vmax;
    background: radial-gradient(circle, rgba(255, 224, 238, 0.65), rgba(255, 224, 238, 0) 66%);
  }
  .cloud {
    position: absolute;
    left: 0;
    will-change: transform;
    transform: translate3d(-300px, 0, 0);
  }
  .bubble {
    position: absolute;
    bottom: -40px;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.95), var(--tint) 55%, transparent 72%);
    border: 1px solid rgba(255, 255, 255, 0.8);
    opacity: 0;
    will-change: transform, opacity;
  }
  .sparkle {
    position: absolute;
    opacity: 0;
    will-change: opacity;
  }
</style>
