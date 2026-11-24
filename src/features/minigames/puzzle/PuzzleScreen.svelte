<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { asset, catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { settings } from '../../../core/settings';
  import { sfx } from '../../../core/audio';
  import Button from '../../../ui/Button.svelte';
  import GameResult from '../GameResult.svelte';
  import { recordPlayed } from '../progress';
  import Icon from '../../../ui/Icon.svelte';
  import { PuzzleGame } from './logic';

  let { levelId }: { levelId?: string } = $props();

  const levels = $derived($catalog.puzzleLevels);
  let idx = $state(0);
  let game: PuzzleGame | null = null;
  let order = $state<number[]>([]);
  let selected = $state<number | null>(null);
  let swaps = $state(0);
  let home = $state(0);
  let solved = $state(false);
  let picture = $state('');
  let showHelpers = $state(true);
  let peek = $state(false);
  let peekTimer: ReturnType<typeof setTimeout> | undefined;

  const level = $derived(levels[idx]);
  const cols = $derived(level?.manifest.columns ?? 3);
  const rows = $derived(level?.manifest.rows ?? 2);
  const duration = $derived($settings.reducedMotion || $settings.lowPowerMode ? 0 : 260);

  function sync() {
    if (!game) return;
    order = [...game.order];
    selected = game.selected;
    swaps = game.swaps;
    home = game.home;
    const was = solved;
    solved = game.solved;
    if (solved && !was && level) recordPlayed('puzzle', level.manifest.id);
  }

  async function start(i = idx) {
    const lv = levels[i];
    if (!lv) return;
    idx = i;
    picture = (await asset(lv.tree, lv.dir, lv.manifest.picture).url()) ?? '';
    game = new PuzzleGame(lv.manifest.columns, lv.manifest.rows, Math.random);
    peek = false;
    sync();
  }

  onMount(() => {
    const i = levelId ? Math.max(0, levels.findIndex((l) => l.manifest.id === levelId)) : 0;
    void start(i);
  });
  onDestroy(() => clearTimeout(peekTimer));

  function pick(position: number) {
    if (!game) return;
    const r = game.select(position);
    if (r === 'ignored') return;
    if (r === 'swapped') {
      sfx.pop(game.isHome(position) ? 1.3 : 0.9);
      if (game.solved) setTimeout(() => sfx.chime(), 250);
    } else sfx.click();
    sync();
  }

  function doPeek() {
    peek = true;
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => (peek = false), 2600);
    sfx.bubble();
  }

  function tileStyle(tile: number) {
    const c = tile % cols;
    const r = Math.floor(tile / cols);
    const px = cols > 1 ? (c / (cols - 1)) * 100 : 0;
    const py = rows > 1 ? (r / (rows - 1)) * 100 : 0;
    return `background-image:url('${picture}'); background-size:${cols * 100}% ${rows * 100}%; background-position:${px}% ${py}%;`;
  }

  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate({ name: 'minigames' });
    else if (e.key.toLowerCase() === 'p') doPeek();
  }
</script>

<svelte:window onkeydown={key} />

<div class="screen">
  <header class="bar">
    <Button variant="soft" size="sm" icon="chevronLeft" onclick={() => navigate({ name: 'minigames', game: 'puzzle' })}>Levels</Button>
    <h2>Pastel Puzzle</h2>
    <label class="pick">
      <span class="sr-only">Level</span>
      <select value={idx} onchange={(e) => start(Number(e.currentTarget.value))}>
        {#each levels as l, i}<option value={i}>{String(i + 1).padStart(2, '0')} · {l.manifest.name}</option>{/each}
      </select>
    </label>
    <span class="spacer"></span>
    <span class="stat"><Icon name="grid" size={16} /> {home}/{cols * rows} home</span>
    <span class="stat">{swaps} {swaps === 1 ? 'swap' : 'swaps'}</span>
    <Button variant="soft" size="sm" icon="image" title="Peek at the finished picture (P)" onclick={doPeek}>Peek</Button>
    <Button variant={showHelpers ? 'mint' : 'ghost'} size="sm" icon="check" title="Softly outline pieces that are in the right place" onclick={() => (showHelpers = !showHelpers)}>Helpers</Button>
    <Button variant="ghost" size="sm" icon="refresh" title="Scramble again" onclick={() => start()}>Shuffle</Button>
  </header>

  <div class="stage">
    <div class="info"><strong>{level?.manifest.name ?? ''}</strong><span>{level?.manifest.objective ?? ''}</span></div>

    <div class="board" style="--cols:{cols}; --rows:{rows}" role="group" aria-label="Puzzle pieces">
      {#each order as tile, position (tile)}
        <button
          class="tile"
          class:sel={selected === position}
          class:ok={showHelpers && tile === position && !solved}
          style={tileStyle(tile)}
          aria-label="Piece {tile + 1}{tile === position ? ', in place' : ''}"
          animate:flip={{ duration }}
          onclick={() => pick(position)}
        ></button>
      {/each}
      {#if peek}
        <div class="peek" style={`background-image:url('${picture}')`} role="img" aria-label="The finished picture"></div>
      {/if}
    </div>

    <p class="how">Pick a piece, then pick another to swap them. No timer — take all the time you like.</p>

    {#if solved}
      <GameResult
        big="🧩"
        title="Picture complete!"
        message="{swaps} {swaps === 1 ? 'swap' : 'swaps'}. Lovely work."
        level={idx + 1}
        total={levels.length}
        noun="picture"
        onAgain={() => start()}
        onNext={() => start(idx + 1)}
        onFirst={() => start(0)}
      />
    {/if}
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
  .stage {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 18px 14px;
    gap: 10px;
    position: relative;
    overflow-y: auto;
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
  .board {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    width: min(100%, calc((100vh - 270px) * 4 / 3));
    aspect-ratio: 4 / 3;
    margin: auto 0;
    border-radius: var(--radius-l);
    overflow: hidden;
    border: 3px solid #fff;
    box-shadow: var(--shadow-l);
    background: #fffdf8;
  }
  .tile {
    border: none;
    padding: 0;
    background-repeat: no-repeat;
    box-shadow: inset 0 0 0 1.5px rgb(var(--w) / 0.85);
    transition:
      box-shadow 0.2s,
      filter 0.2s;
    position: relative;
  }
  .tile:hover {
    filter: brightness(1.04) saturate(1.05);
  }
  .tile.ok {
    box-shadow: inset 0 0 0 3px rgba(142, 210, 178, 0.95);
  }
  .tile.sel {
    box-shadow:
      inset 0 0 0 4px #a698e0,
      inset 0 0 0 7px rgb(var(--w) / 0.7);
    filter: brightness(1.06);
    z-index: 2;
  }
  .peek {
    position: absolute;
    inset: 0;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    animation: fade 0.25s ease-out;
    z-index: 3;
    pointer-events: none;
  }
  .how {
    color: var(--ink-faint);
    font-size: 0.8rem;
    font-weight: 700;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
