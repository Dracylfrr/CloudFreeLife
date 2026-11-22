<script lang="ts">
  // Pure-CSS ambient scenery: no JS timers, no per-frame work.
  // It is removed entirely by Reduced Motion / Low Power, paused when the
  // window is hidden, and fully hidden while painting.
  interface Props {
    calm?: boolean; // painting screen: static gradient only
  }
  let { calm = false }: Props = $props();

  const clouds = [
    { top: 6, scale: 1.1, dur: 150, delay: -20, op: 0.75 },
    { top: 22, scale: 0.7, dur: 190, delay: -90, op: 0.6 },
    { top: 48, scale: 1.35, dur: 230, delay: -150, op: 0.5 },
    { top: 70, scale: 0.9, dur: 170, delay: -60, op: 0.55 },
    { top: 84, scale: 0.6, dur: 210, delay: -120, op: 0.45 }
  ];
  const bubbles = Array.from({ length: 9 }, (_, i) => ({
    left: 6 + ((i * 11.7) % 90),
    size: 10 + ((i * 7) % 22),
    dur: 22 + ((i * 5) % 16),
    delay: -((i * 6.3) % 30),
    tint: ['#bfe4f7', '#e6d8f8', '#c6ecda', '#ffd3e2', '#fff2bd'][i % 5]
  }));
  const sparkles = Array.from({ length: 6 }, (_, i) => ({
    left: 8 + ((i * 17.3) % 84),
    top: 10 + ((i * 23.1) % 72),
    dur: 9 + (i % 3) * 3,
    delay: -(i * 2.7)
  }));
</script>

<div class="ambient" class:calm aria-hidden="true">
  <div class="wash"></div>
  {#if !calm}
    <span class="glow g1"></span>
    <span class="glow g2"></span>
    {#each clouds as c}
      <svg class="cloud" style="top:{c.top}%; --s:{c.scale}; --dur:{c.dur}s; --delay:{c.delay}s; opacity:{c.op}" viewBox="0 0 220 110" width="220" height="110">
        <g fill="#fff">
          <circle cx="62" cy="64" r="32" />
          <circle cx="104" cy="48" r="40" />
          <circle cx="150" cy="62" r="34" />
          <rect x="30" y="58" width="150" height="40" rx="20" />
        </g>
      </svg>
    {/each}
    {#each bubbles as b}
      <span class="bubble" style="left:{b.left}%; width:{b.size}px; height:{b.size}px; --dur:{b.dur}s; --delay:{b.delay}s; --tint:{b.tint}"></span>
    {/each}
    {#each sparkles as s}
      <span class="sparkle" style="left:{s.left}%; top:{s.top}%; --dur:{s.dur}s; --delay:{s.delay}s"></span>
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
    inset: -20%;
    background:
      radial-gradient(60% 55% at 15% 10%, #d3ebfa 0, transparent 70%),
      radial-gradient(55% 50% at 90% 18%, #eadffb 0, transparent 70%),
      radial-gradient(60% 60% at 70% 95%, #fde3ee 0, transparent 70%),
      radial-gradient(50% 50% at 8% 90%, #dcf4e8 0, transparent 70%),
      linear-gradient(160deg, var(--bg-a), var(--bg-b) 55%, var(--bg-c));
  }
  /* A full-screen layer that animates costs real GPU time every frame, so the wash stays still and two
     small soft glows drift slowly over it instead ("gentle gradient movement" at a fraction of the cost). */
  .glow {
    position: absolute;
    width: 46vmax;
    height: 46vmax;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 66%);
    will-change: transform;
    animation: glow-a 70s ease-in-out infinite alternate;
  }
  .g1 {
    left: -12vmax;
    top: -14vmax;
  }
  .g2 {
    right: -14vmax;
    bottom: -16vmax;
    background: radial-gradient(circle, rgba(255, 224, 238, 0.65), rgba(255, 224, 238, 0) 66%);
    animation-name: glow-b;
    animation-duration: 90s;
  }
  @keyframes glow-a {
    to {
      transform: translate3d(16vmax, 12vmax, 0);
    }
  }
  @keyframes glow-b {
    to {
      transform: translate3d(-18vmax, -10vmax, 0);
    }
  }
  .cloud {
    position: absolute;
    left: -260px;
    transform: scale(var(--s));
    animation: float var(--dur) linear infinite;
    animation-delay: var(--delay);
    will-change: transform;
  }
  @keyframes float {
    from {
      transform: translate3d(0, 0, 0) scale(var(--s));
    }
    to {
      transform: translate3d(calc(100vw + 560px), 0, 0) scale(var(--s));
    }
  }
  .bubble {
    position: absolute;
    bottom: -40px;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.95), var(--tint) 55%, transparent 72%);
    border: 1px solid rgba(255, 255, 255, 0.8);
    opacity: 0;
    animation: rise var(--dur) ease-in infinite;
    animation-delay: var(--delay);
    will-change: transform, opacity;
  }
  @keyframes rise {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 0;
    }
    10% {
      opacity: 0.7;
    }
    85% {
      opacity: 0.5;
    }
    100% {
      transform: translate3d(24px, -110vh, 0);
      opacity: 0;
    }
  }
  .sparkle {
    position: absolute;
    width: 14px;
    height: 14px;
    opacity: 0;
    background: #fffbe0;
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
    animation: twinkle var(--dur) ease-in-out infinite;
    animation-delay: var(--delay);
  }
  @keyframes twinkle {
    0%,
    70%,
    100% {
      opacity: 0;
      transform: scale(0.4) rotate(0deg);
    }
    80% {
      opacity: 0.95;
      transform: scale(1) rotate(45deg);
    }
    90% {
      opacity: 0;
      transform: scale(0.6) rotate(90deg);
    }
  }
  :global(:root[data-paused='true']) .ambient * {
    animation-play-state: paused !important;
  }
</style>
