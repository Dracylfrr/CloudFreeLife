<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { findMeditation } from '../../core/content/registry';
  import { navigate } from '../../core/router';
  import { settings } from '../../core/settings';
  import { setSessionSound, sfx } from '../../core/audio';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { PHASE_WORDS, breathAt, clock, cueAt, minutesLabel } from './breath';
  import { markFinished, markStarted } from './progress';

  let { sessionId }: { sessionId: string } = $props();
  const item = findMeditation(untrack(() => sessionId));
  const m = item?.manifest;

  type Stage = 'choose' | 'ready' | 'running' | 'paused' | 'done';
  let stage = $state<Stage>(m?.kind === 'timer' ? 'choose' : 'ready');
  let minutes = $state(m?.kind === 'timer' ? (m.durations?.[2] ?? m.durations?.[0] ?? 5) : (m?.minutes ?? 5));
  let t = $state(0); // seconds elapsed
  let soundOn = $state(true);

  let startedAt = 0;
  let pausedAt = 0;
  let pausedTotal = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const total = $derived(minutes * 60);
  const breath = $derived(m?.breath ? breathAt(t, m.breath) : null);
  const cue = $derived(m ? cueAt(t, m.cues) : null);
  const calm = $derived($settings.reducedMotion || $settings.lowPowerMode);
  const scale = $derived(calm ? 1 : breath ? 0.62 + 0.38 * breath.size : 0.9);
  const left = $derived(Math.max(0, total - t));

  function now() {
    return performance.now();
  }
  function tick() {
    if (stage !== 'running') return;
    t = Math.min(total, (now() - startedAt - pausedTotal) / 1000);
    if (t >= total) finish(true);
  }
  function begin() {
    if (!m) return;
    startedAt = now();
    pausedTotal = 0;
    t = 0;
    stage = 'running';
    markStarted(m.id);
    applySound();
    sfx.bowl(196);
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 200);
  }
  function applySound() {
    setSessionSound(soundOn && m ? m.ambience : 'none');
  }
  function pause() {
    if (stage !== 'running') return;
    stage = 'paused';
    pausedAt = now();
    setSessionSound('none');
  }
  function resume() {
    if (stage !== 'paused') return;
    pausedTotal += now() - pausedAt;
    stage = 'running';
    applySound();
  }
  function finish(natural = false) {
    if (!m || stage === 'done') return;
    if (timer) clearInterval(timer);
    timer = null;
    stage = 'done';
    markFinished(m.id);
    setSessionSound(null);
    if (natural) sfx.bowl(174);
  }
  function toggleSound() {
    soundOn = !soundOn;
    if (stage === 'running') applySound();
  }
  function leave() {
    navigate({ name: 'meditation' });
  }
  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape') leave();
    else if (e.key === ' ' && (stage === 'running' || stage === 'paused') && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      if (stage === 'running') pause();
      else resume();
    }
  }
  onDestroy(() => {
    if (timer) clearInterval(timer);
    setSessionSound(null);
  });
</script>

<svelte:window onkeydown={key} />

{#if !m || !item}
  <div class="page">
    <p>This session isn't available.</p>
    <Button onclick={leave}>Back to Meditation</Button>
  </div>
{:else}
  <div class="stage scene-{m.scene}" style="--accent:{m.accent ?? '#b7a8ec'}">
    <header class="bar">
      <Button variant="soft" size="sm" icon="chevronLeft" onclick={leave}>Meditation</Button>
      <h2>{m.name}</h2>
      <span class="spacer"></span>
      {#if stage === 'running' || stage === 'paused'}
        <Button variant="ghost" size="sm" icon={soundOn ? 'volume' : 'mute'} title={soundOn ? 'Mute this session' : 'Unmute this session'} onclick={toggleSound}>{soundOn ? 'Sound' : 'Muted'}</Button>
      {/if}
    </header>

    <div class="decor" aria-hidden="true">
      {#if m.scene === 'evening' || m.scene === 'garden'}
        {#each [[12, 18], [24, 62], [70, 14], [84, 40], [58, 8], [40, 30], [92, 70], [8, 78]] as [x, y], i}
          <i class="star" style="left:{x}%; top:{y}%; animation-delay:{i * 0.7}s"></i>
        {/each}
      {/if}
      {#if m.scene === 'rain'}
        {#each Array.from({ length: 16 }, (_, i) => i) as i}
          <i class="drop" style="left:{(i * 6.4 + 3) % 98}%; animation-delay:{(i * 0.37) % 2.4}s; animation-duration:{2.2 + (i % 4) * 0.4}s"></i>
        {/each}
      {/if}
    </div>

    <main class="center">
      {#if stage === 'choose'}
        <h1>How long would you like?</h1>
        <p class="hint">No guidance, just quiet. A soft bell rings at the start and the end.</p>
        <div class="lengths" role="radiogroup" aria-label="Length">
          {#each m.durations ?? [] as d}
            <button class="len" class:on={minutes === d} role="radio" aria-checked={minutes === d} onclick={() => (minutes = d)}>{d}<small>min</small></button>
          {/each}
        </div>
        <Button variant="primary" icon="play" onclick={() => (stage = 'ready')}>Continue</Button>
      {:else if stage === 'ready'}
        <div class="orb" style="--s:0.9"><svg viewBox="0 0 220 120" aria-hidden="true"><g class="cloudfill"><circle cx="70" cy="70" r="34" /><circle cx="112" cy="54" r="42" /><circle cx="158" cy="68" r="34" /><rect x="36" y="64" width="150" height="40" rx="20" /></g><circle cx="96" cy="76" r="4" class="eye" /><circle cx="132" cy="76" r="4" class="eye" /><path d="M106 86q6 7 12 0" class="mouth" /></svg></div>
        <h1>{m.name}</h1>
        <p class="hint">{m.kind === 'timer' ? minutesLabel(minutes) : minutesLabel(m.minutes)}. {m.description}</p>
        <Button variant="primary" icon="play" onclick={begin}>Begin</Button>
        <p class="tiny">You can pause, finish or leave at any time.</p>
      {:else if stage === 'done'}
        <div class="orb" style="--s:1"><svg viewBox="0 0 220 120" aria-hidden="true"><g class="cloudfill"><circle cx="70" cy="70" r="34" /><circle cx="112" cy="54" r="42" /><circle cx="158" cy="68" r="34" /><rect x="36" y="64" width="150" height="40" rx="20" /></g><path d="M92 76q6 6 12 0M128 76q6 6 12 0" class="mouth" /><path d="M106 88q6 7 12 0" class="mouth" /></svg></div>
        <h1>That was lovely.</h1>
        <p class="hint">Take a moment before you move on.</p>
        <div class="row">
          <Button variant="soft" icon="refresh" onclick={() => { stage = 'ready'; t = 0; }}>Again</Button>
          <Button variant="primary" onclick={leave}>Done</Button>
        </div>
      {:else}
        <div class="orb" style="--s:{scale}; --dur:{calm ? 0 : 0.35}s" class:float={!breath && !calm}>
          <svg viewBox="0 0 220 120" aria-hidden="true"><g class="cloudfill"><circle cx="70" cy="70" r="34" /><circle cx="112" cy="54" r="42" /><circle cx="158" cy="68" r="34" /><rect x="36" y="64" width="150" height="40" rx="20" /></g><circle cx="96" cy="76" r="4" class="eye" /><circle cx="132" cy="76" r="4" class="eye" /><path d="M106 86q6 7 12 0" class="mouth" /></svg>
        </div>
        {#if breath}
          <p class="phase" aria-live="polite">{PHASE_WORDS[breath.phase]}</p>
        {:else if m.kind === 'timer'}
          <p class="phase quiet">Quiet time</p>
        {/if}
        <p class="cue" aria-live="polite">{cue ?? ' '}</p>
        <p class="time" role="timer" aria-label="Time left">{clock(left)}</p>
        <div class="row">
          {#if stage === 'running'}
            <Button variant="soft" icon="pause" onclick={pause}>Pause</Button>
          {:else}
            <Button variant="primary" icon="play" onclick={resume}>Resume</Button>
          {/if}
          <Button variant="ghost" onclick={() => finish(false)}>Finish</Button>
        </div>
      {/if}
    </main>
  </div>
{/if}

<style>
  .stage {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg, var(--bg-a), var(--bg-b));
  }
  .scene-evening {
    background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 40%, var(--bg-b)), var(--bg-a));
  }
  .scene-rain {
    background: linear-gradient(180deg, color-mix(in srgb, #8fa6c8 28%, var(--bg-a)), var(--bg-b));
  }
  .scene-garden {
    background: linear-gradient(180deg, var(--bg-a), color-mix(in srgb, #9fd8b2 30%, var(--bg-b)));
  }
  .bar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 22px 0;
  }
  .bar h2 {
    font-size: 1.1rem;
  }
  .spacer {
    flex: 1;
  }
  .center {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 12px 24px 40px;
    text-align: center;
  }
  h1 {
    font-size: clamp(1.4rem, 3.4vw, 2rem);
  }
  .hint {
    color: var(--ink-soft);
    max-width: 440px;
    font-weight: 600;
  }
  .tiny {
    color: var(--ink-soft);
    font-size: 0.85rem;
    font-weight: 600;
  }
  .orb {
    width: min(300px, 62vw);
    transform: scale(var(--s, 1));
    transition: transform var(--dur, 0.35s) linear;
    filter: drop-shadow(0 12px 28px rgba(110, 100, 170, 0.22));
  }
  .orb svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .orb .cloudfill {
    fill: var(--cloud);
    stroke: var(--ink-soft);
    stroke-width: 3;
  }
  .orb .eye {
    fill: var(--ink-soft);
  }
  .orb .mouth {
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .orb.float {
    animation: float 7s ease-in-out infinite;
  }
  @keyframes float {
    50% {
      transform: translateY(-10px) scale(var(--s, 1));
    }
  }
  .phase {
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    font-weight: 800;
    color: var(--ink);
    min-height: 1.4em;
  }
  .phase.quiet {
    color: var(--ink-soft);
  }
  .cue {
    min-height: 1.6em;
    max-width: 480px;
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 1.05rem;
  }
  .time {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }
  .row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .lengths {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin: 6px 0 10px;
  }
  .len {
    width: 76px;
    height: 76px;
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--ink);
    background: rgb(var(--w) / 0.6);
    border: 2px solid transparent;
    box-shadow: var(--shadow-s);
  }
  .len small {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .len.on {
    border-color: var(--lavender-deep);
    background: rgb(var(--w) / 0.95);
  }
  .decor {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .star {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--spark);
    opacity: 0.7;
    animation: twinkle 4s ease-in-out infinite;
  }
  @keyframes twinkle {
    50% {
      opacity: 0.2;
    }
  }
  .drop {
    position: absolute;
    top: -20px;
    width: 3px;
    height: 22px;
    border-radius: 3px;
    background: linear-gradient(transparent, rgba(150, 190, 230, 0.7));
    animation: fall 2.6s linear infinite;
  }
  @keyframes fall {
    to {
      transform: translateY(110vh);
    }
  }
</style>
