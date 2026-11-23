<script lang="ts">
  import type { Snippet } from 'svelte';
  import { navigate } from '../../core/router';
  import Button from '../../ui/Button.svelte';

  // The shared frame for the relaxing games added in 1.4: a header with Back, a level picker,
  // mode chips and a few stats, then a stage for the game itself.
  interface Props {
    title: string;
    /** Which game page "Levels" returns to. */
    game: string;
    levels?: string[];
    idx?: number;
    onLevel?: (i: number) => void;
    modes?: { id: string; label: string }[];
    mode?: string;
    onMode?: (id: string) => void;
    name?: string;
    objective?: string;
    stats?: Snippet;
    actions?: Snippet;
    children: Snippet;
  }
  let { title, game, levels = [], idx = 0, onLevel, modes = [], mode = '', onMode, name = '', objective = '', stats, actions, children }: Props = $props();
</script>

<div class="screen">
  <header class="bar">
    <Button variant="soft" size="sm" icon="chevronLeft" onclick={() => navigate({ name: 'minigames', game })}>Levels</Button>
    <h2>{title}</h2>
    {#if modes.length}
      <div class="seg" role="group" aria-label="Mode">
        {#each modes as m (m.id)}
          <button class:on={mode === m.id} aria-pressed={mode === m.id} onclick={() => onMode?.(m.id)}>{m.label}</button>
        {/each}
      </div>
    {/if}
    {#if levels.length > 1}
      <label class="pick">
        <span class="sr-only">Level</span>
        <select value={idx} onchange={(e) => onLevel?.(Number(e.currentTarget.value))}>
          {#each levels as l, i}<option value={i}>{String(i + 1).padStart(2, '0')} · {l}</option>{/each}
        </select>
      </label>
    {/if}
    <span class="spacer"></span>
    {@render stats?.()}
    {@render actions?.()}
  </header>

  <div class="stage">
    {#if name || objective}<div class="title"><strong>{name}</strong><span>{objective}</span></div>{/if}
    {@render children()}
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
    background: rgb(var(--w) / 0.7);
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
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .pick select {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--panel-solid);
    color: var(--ink);
    font-weight: 700;
    max-width: 240px;
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
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: var(--ink-soft);
    font-size: 0.92rem;
  }
  .title strong {
    color: var(--ink);
    font-size: 1.05rem;
  }
</style>
