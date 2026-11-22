<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { catalog } from '../../../core/content/registry';
  import { navigate } from '../../../core/router';
  import { sfx } from '../../../core/audio';
  import Button from '../../../ui/Button.svelte';
  import Icon from '../../../ui/Icon.svelte';
  import { MemoryGame, type Card } from './logic';
  import { iconSvg } from './icons';

  let { levelId }: { levelId?: string } = $props();

  const levels = $derived($catalog.memoryLevels);
  let idx = $state(0);
  let game: MemoryGame | null = null;
  let cards = $state<Card[]>([]);
  let moves = $state(0);
  let matches = $state(0);
  let complete = $state(false);
  let hinted = $state<number[]>([]);
  let justMatched = $state<number[]>([]);
  let timers: ReturnType<typeof setTimeout>[] = [];

  const level = $derived(levels[idx]);
  const cols = $derived(level?.manifest.columns ?? 4);
  const rows = $derived(level ? Math.ceil((level.manifest.symbols.length * 2) / cols) : 3);

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
    moves = game.moves;
    matches = game.matches;
    complete = game.complete;
  }

  function start(i = idx) {
    clearTimers();
    const lv = levels[i];
    if (!lv) return;
    idx = i;
    game = new MemoryGame(lv.manifest.symbols, Math.random);
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
    sfx.pop(1 + (i % 4) * 0.08);
    sync();
    if (r === 'match') {
      const pair = game.cards.map((c, k) => (c.matched && c.symbol === game!.cards[i].symbol ? k : -1)).filter((k) => k >= 0);
      justMatched = pair;
      later(() => (justMatched = []), 700);
      sfx.sparkle();
      if (game.complete) later(() => sfx.chime(), 250);
    } else if (r === 'mismatch') {
      later(() => {
        if (!game?.hasMismatch) return;
        game.clearMismatch();
        sync();
      }, 950);
    }
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
    <Button variant="soft" size="sm" icon="chevronLeft" onclick={() => navigate({ name: 'minigames' })}>Mini-Games</Button>
    <h2>Memory Meadow</h2>
    <label class="pick">
      <span class="sr-only">Level</span>
      <select value={idx} onchange={(e) => start(Number(e.currentTarget.value))}>
        {#each levels as l, i}<option value={i}>{String(i + 1).padStart(2, '0')} · {l.manifest.name}</option>{/each}
      </select>
    </label>
    <span class="spacer"></span>
    <span class="stat"><Icon name="heart" size={16} /> {matches}/{level?.manifest.symbols.length ?? 0} pairs</span>
    <span class="stat">{moves} {moves === 1 ? 'try' : 'tries'}</span>
    <Button variant="soft" size="sm" icon="sparkle" title="Show me a pair (H)" onclick={hint}>Hint</Button>
    <Button variant="ghost" size="sm" icon="refresh" title="Shuffle and start over" onclick={() => start()}>Shuffle</Button>
  </header>

  <div class="stage">
    <div class="info"><strong>{level?.manifest.name ?? ''}</strong><span>{level?.manifest.objective ?? ''}</span></div>

    <div class="board" style="--cols:{cols}; --rows:{rows}; --back:{level?.manifest.cardBack ?? '#bfe4f7'}" role="group" aria-label="Cards">
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
      <div class="overlay">
        <div class="big">🌼</div>
        <h2>All pairs found!</h2>
        <p class="muted">{moves} {moves === 1 ? 'try' : 'tries'}. Lovely.</p>
        <div class="acts">
          <Button variant="primary" onclick={() => start((idx + 1) % levels.length)}>Next level</Button>
          <Button variant="soft" onclick={() => start()}>Play again</Button>
          <Button variant="ghost" onclick={() => navigate({ name: 'minigames' })}>All games</Button>
        </div>
      </div>
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
    --w: min(150px, calc((100vh - 270px) / var(--rows) / 1.2));
    display: grid;
    grid-template-columns: repeat(var(--cols), var(--w));
    gap: 14px;
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
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(240, 236, 252, 0.8);
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
