<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { sfx } from '../../../core/audio';
  import Button from '../../../ui/Button.svelte';
  import GameResult from '../GameResult.svelte';
  import { recordPlayed } from '../progress';
  import Icon from '../../../ui/Icon.svelte';
  import { MEMORY_ICON_IDS } from '../../../core/manifests';
  import { ENDLESS_MAX_CARDS, MemoryGame, endlessColumns, endlessPairs, endlessSymbols, type Card } from './logic';
  import { iconSvg } from './icons';

  let { levelId }: { levelId?: string } = $props();

  const levels = $derived($catalog.memoryLevels);
  let idx = $state(0);
  /** "levels" are the hand-made boards; "endless" keeps adding cards, round after round. */
  let mode = $state<'levels' | 'endless'>('levels');
  let round = $state(1);
  let game: MemoryGame | null = null;
  let cards = $state<Card[]>([]);
  let matches = $state(0);
  let complete = $state(false);
  let hinted = $state<number[]>([]);
  let justMatched = $state<number[]>([]);
  let timers: ReturnType<typeof setTimeout>[] = [];

  const level = $derived(levels[idx]);
  const pairsNow = $derived(mode === 'endless' ? endlessPairs(round) : (level?.manifest.symbols.length ?? 0));
  const cols = $derived(mode === 'endless' ? endlessColumns(pairsNow) : (level?.manifest.columns ?? 4));
  const rows = $derived(Math.max(1, Math.ceil((pairsNow * 2) / cols)));
  const biggest = $derived(pairsNow * 2 >= ENDLESS_MAX_CARDS);
  // a crowded board gets smaller gaps so the cards can stay a readable size
  const gap = $derived(cols > 8 ? 6 : cols > 6 ? 9 : 14);

  function later(fn: () => void, ms: number) {
    timers.push(setTimeout(fn, ms));
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function sync() {
    if (!game) return;
    cards = game.cards.map((c) => ({ ...c }));
    matches = game.matches;
    const was = complete;
    complete = game.complete;
    if (complete && !was && mode === 'levels' && level) recordPlayed('memory', level.manifest.id);
  }

  function start(i = idx) {
    clearTimers();
    let symbols: string[];
    if (mode === 'endless') {
      symbols = endlessSymbols(endlessPairs(round), MEMORY_ICON_IDS, Math.random);
    } else {
      const lv = levels[i];
      if (!lv) return;
      idx = i;
      symbols = lv.manifest.symbols;
    }
    game = new MemoryGame(symbols, Math.random);
    hinted = [];
    justMatched = [];
    sync();
  }

  onMount(() => {
    const i = levelId ? Math.max(0, levels.findIndex((l) => l.manifest.id === levelId)) : 0;
    start(i);
  });
  onDestroy(clearTimers);

  function flip(i: number) {
    if (!game || complete) return;
    hinted = [];
    const r = game.flip(i);
    if (r === 'ignored') return;
    sfx.flip();
    sync();
    if (r === 'match') {
      const pair = game.cards.map((c, k) => (c.matched && c.symbol === game!.cards[i].symbol ? k : -1)).filter((k) => k >= 0);
      justMatched = pair;
      later(() => (justMatched = []), 700);
      sfx.match();
      if (game.complete) later(() => sfx.chime(), 250);
    } else if (r === 'mismatch') {
      later(() => {
        if (!game?.hasMismatch) return;
        game.clearMismatch();
        sync();
      }, 950);
    }
  }

  function setMode(m: 'levels' | 'endless') {
    if (mode === m) return;
    mode = m;
    round = 1;
    start();
  }

  function nextRound() {
    round++;
    start();
  }

  function hint() {
    if (!game || complete) return;
    const h = game.hint(Math.random);
    if (!h) return;
    hinted = h;
    sfx.bubble();
    later(() => (hinted = []), 1600);
  }

  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate({ name: 'minigames' });
    else if (e.key.toLowerCase() === 'h') hint();
  }
</script>

<svelte:window onkeydown={key} />

<div class="screen">
  <header class="bar">
    <Button variant="soft" size="sm" icon="chevronLeft" onclick={() => navigate({ name: 'minigames', game: 'memory' })}>Levels</Button>
    <h2>Memory Meadow</h2>
    <div class="seg" role="group" aria-label="Mode">
      <button class:on={mode === 'levels'} aria-pressed={mode === 'levels'} onclick={() => setMode('levels')}>Levels</button>
      <button class:on={mode === 'endless'} aria-pressed={mode === 'endless'} onclick={() => setMode('endless')}>Endless</button>
    </div>
    {#if mode === 'levels'}
      <label class="pick">
        <span class="sr-only">Level</span>
        <select value={idx} onchange={(e) => start(Number(e.currentTarget.value))}>
          {#each levels as l, i}<option value={i}>{String(i + 1).padStart(2, '0')} · {l.manifest.name}</option>{/each}
        </select>
      </label>
    {/if}
    <span class="spacer"></span>
    <span class="stat"><Icon name="heart" size={16} /> {matches}/{pairsNow} pairs</span>
    <Button variant="soft" size="sm" icon="sparkle" title="Show me a pair (H)" onclick={hint}>Hint</Button>
    <Button variant="ghost" size="sm" icon="refresh" title="Shuffle and start over" onclick={() => start()}>Shuffle</Button>
  </header>

  <div class="stage">
    {#if mode === 'endless'}
      <div class="info"><strong>Endless · Round {round}</strong><span>{pairsNow * 2} cards. {biggest ? 'The biggest board — the rounds keep coming at this size.' : 'Every round adds a few more.'}</span></div>
    {:else}
      <div class="info"><strong>{level?.manifest.name ?? ''}</strong><span>{level?.manifest.objective ?? ''}</span></div>
    {/if}

    <div class="board" style="--cols:{cols}; --rows:{rows}; --gap:{gap}px; --back:{level?.manifest.cardBack ?? '#bfe4f7'}" role="group" aria-label="Cards">
      {#each cards as c (c.id)}
        <button
          class="card"
          class:up={c.faceUp || c.matched}
          class:matched={c.matched}
          class:pop={justMatched.includes(c.id)}
          class:hint={hinted.includes(c.id)}
          disabled={c.matched}
          aria-label={c.faceUp || c.matched ? c.symbol : 'Hidden card'}
          onclick={() => flip(c.id)}
        >
          <span class="inner">
            <span class="side back"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M17 47a11 11 0 0 1 1-22a15 15 0 0 1 28 4a9 9 0 0 1 0 18z" fill="rgba(255,255,255,0.85)" /><circle cx="27" cy="37" r="2.2" fill="rgba(110,106,142,0.7)" /><circle cx="37" cy="37" r="2.2" fill="rgba(110,106,142,0.7)" /><path d="M29 42q3 3 6 0" fill="none" stroke="rgba(110,106,142,0.7)" stroke-width="2.2" stroke-linecap="round" /></svg></span>
            <span class="side front">{@html iconSvg(c.symbol)}</span>
          </span>
        </button>
      {/each}
    </div>

    <p class="how">Flip two cards at a time and find the pairs. No timer — take all the time you like.</p>

    {#if complete}
      {#if mode === 'endless'}
        <GameResult
          big="🌼"
          title="Round {round} complete!"
          message="All {pairsNow} pairs found. Lovely."
          onAgain={() => start()}
          againLabel="Play again"
          onNext={nextRound}
          nextLabel="Next round"
        />
      {:else}
        <GameResult
          big="🌼"
          title="All pairs found!"
          message="Every pair found. Lovely."
          level={idx + 1}
          total={levels.length}
          noun="level"
          onAgain={() => start()}
          onNext={() => start(idx + 1)}
          onFirst={() => start(0)}
        />
      {/if}
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
    container-type: inline-size;
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
    --gap: 14px;
    /* never smaller than a readable card; a very big board then scrolls instead of shrinking away */
    --w: max(36px, min(150px, calc((100vh - 270px - var(--gap) * var(--rows)) / var(--rows) / 1.2), calc((100cqw - var(--gap) * (var(--cols) - 1)) / var(--cols))));
    display: grid;
    grid-template-columns: repeat(var(--cols), var(--w));
    gap: var(--gap);
    justify-content: center;
    margin: auto 0;
    perspective: 900px;
  }
  .card {
    width: var(--w);
    height: calc(var(--w) * 1.2);
    padding: 0;
    background: none;
    border-radius: 18px;
  }
  .card:disabled {
    cursor: default;
  }
  .inner {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.38s var(--ease);
  }
  .card.up .inner {
    transform: rotateY(180deg);
  }
  .side {
    position: absolute;
    inset: 0;
    border-radius: 18px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    display: grid;
    place-items: center;
    border: 3px solid #fff;
    box-shadow: var(--shadow-s);
  }
  .back {
    background: var(--back);
  }
  .back svg {
    width: 62%;
    height: 62%;
  }
  .front {
    transform: rotateY(180deg);
    background: #fffdf8;
  }
  .front :global(svg) {
    width: 72%;
    height: 72%;
  }
  .card:not(:disabled):not(.up):hover .inner {
    transform: translateY(-4px) scale(1.03);
  }
  .card.matched .front {
    background: #f1fbf5;
    box-shadow:
      0 0 0 3px #c6ecda,
      var(--shadow-s);
  }
  .card.pop .inner {
    animation: pop 0.6s var(--ease);
  }
  .card.hint .side {
    box-shadow:
      0 0 0 4px #b7a8ec,
      0 0 22px rgba(183, 168, 236, 0.8);
  }
  @keyframes pop {
    40% {
      transform: rotateY(180deg) scale(1.1);
    }
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
