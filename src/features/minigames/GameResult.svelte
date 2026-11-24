<script lang="ts">
  import type { Snippet } from 'svelte';
  import { navigate } from '../../core/router';
  import Button from '../../ui/Button.svelte';

  /**
   * The screen every game shows when a level is finished. It always congratulates, and it puts
   * "Play again" on the left and the way forward ("Next level") on the right. After the very last
   * level it says so instead of offering a next one.
   */
  interface Props {
    big: string;
    title: string;
    message?: string;
    /** The level just finished (1-based) and how many there are. Leave `total` at 0 when levels do not apply. */
    level?: number;
    total?: number;
    /** What a level is called in this game: "level", "wall", "board", "picture". */
    noun?: string;
    onAgain?: () => void;
    againLabel?: string;
    onNext?: () => void;
    nextLabel?: string;
    /** After the last level: go back to the first one. */
    onFirst?: () => void;
    /** Extra buttons that sit between the two main ones. */
    extra?: Snippet;
  }
  let { big, title, message = '', level = 0, total = 0, noun = 'level', onAgain, againLabel = 'Play again', onNext, nextLabel, onFirst, extra }: Props = $props();

  const last = $derived(total > 0 && level >= total);
  const Noun = $derived(noun.charAt(0).toUpperCase() + noun.slice(1));
</script>

<div class="overlay" role="status" aria-live="polite">
  <div class="big" aria-hidden="true">{big}</div>
  {#if last}
    <p class="eyebrow">Congratulations!</p>
    <h2>You finished every {noun}!</h2>
    <p class="muted">All {total} {noun}s are done.{message ? ` ${message}` : ''} Thank you for playing.</p>
  {:else}
    <p class="eyebrow">{total > 0 ? `Congratulations! ${Noun} ${level} complete` : 'Congratulations!'}</p>
    <h2>{title}</h2>
    {#if message}<p class="muted">{message}</p>{/if}
  {/if}
  <div class="acts">
    {#if onAgain}<Button variant="soft" onclick={onAgain}>{againLabel}</Button>{/if}
    {@render extra?.()}
    {#if last}
      {#if onFirst}<Button variant="primary" onclick={onFirst}>Back to {noun} 1</Button>{/if}
    {:else if onNext}
      <Button variant="primary" onclick={onNext}>{nextLabel ?? `Next ${noun}`}</Button>
    {/if}
  </div>
  <Button variant="ghost" size="sm" onclick={() => navigate({ name: 'minigames' })}>All games</Button>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: rgba(240, 236, 252, 0.82);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    animation: fade 0.3s ease-out;
    text-align: center;
    padding: 20px;
    color: #4a4768;
  }
  .big {
    font-size: 3rem;
    animation: bob 2.4s ease-in-out infinite;
  }
  .eyebrow {
    font-weight: 900;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #7b6fc4;
  }
  h2 {
    font-size: 1.6rem;
  }
  .muted {
    color: #6c6990;
    max-width: 420px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin: 10px 0 2px;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes bob {
    50% {
      transform: translateY(-5px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .big {
      animation: none;
    }
  }
</style>
