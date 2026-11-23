<script lang="ts">
  import { navigate } from '../../core/router';
  import { catalog, asset, shelfSort } from '../../core/content/registry';
  import { artworks, artworksLoaded } from '../gallery/artwork';
  import ArtThumb from '../gallery/ArtThumb.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { openArtwork } from '../books/open';
  import CoverImg from '../books/CoverImg.svelte';
  import ReadingCover from '../stories/ReadingCover.svelte';
  import { sfx } from '../../core/audio';
  import { onMount } from 'svelte';
  import { onAmbientTick } from '../../ui/ticker';
  import { storyProgress } from '../stories/progress';
  import { buildReadingList, mostRecentUnfinished } from '../stories/readingList';
  import { meditationProgress } from '../meditation/progress';
  import { gamesProgress } from '../minigames/progress';
  import { listGardens, type Garden } from '../minigames/zen/gardens';
  import { pickContinue } from './continue';

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Peaceful night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  let heroEl: HTMLDivElement | undefined = $state();
  onMount(() => onAmbientTick((t) => heroEl && (heroEl.style.transform = `translate3d(0,${(Math.sin(t * 0.9) * -6).toFixed(1)}px,0)`)));

  const latest = $derived($artworks[0]);
  const recent = $derived($artworks.slice(0, 4));
  const shelf = $derived(shelfSort($catalog.books));

  // "Continue" resumes whichever was touched last: the latest painting, a story / adventure in progress,
  // the last meditation, or the last Zen garden.
  const reading = $derived(mostRecentUnfinished(buildReadingList($catalog.stories, $catalog.adventures, $storyProgress)));
  const meditation = $derived($meditationProgress.last ? ($catalog.meditations.find((m) => m.manifest.id === $meditationProgress.last!.id) ?? null) : null);
  let garden = $state<Garden | null>(null);
  onMount(() => {
    if ($gamesProgress.last?.game === 'zen') listGardens().then((l) => (garden = l[0] ?? null)).catch(() => {});
  });
  const zenAt = $derived(garden && $gamesProgress.last?.game === 'zen' ? $gamesProgress.last.at : 0);
  const pick = $derived(
    pickContinue([
      latest ? { kind: 'painting', at: latest.updatedAt } : null,
      reading ? { kind: 'reading', at: reading.opened } : null,
      meditation && $meditationProgress.last ? { kind: 'meditation', at: $meditationProgress.last.at } : null,
      garden && zenAt ? { kind: 'zen', at: zenAt } : null
    ])?.kind
  );
  const showReading = $derived(pick === 'reading' && !!reading);
  function resume() {
    if (pick === 'reading' && reading) navigate(reading.kind === 'story' ? { name: 'story', storyId: reading.id } : { name: 'adventure', adventureId: reading.id });
    else if (pick === 'meditation' && meditation) navigate({ name: 'meditate', sessionId: meditation.manifest.id });
    else if (pick === 'zen' && garden) navigate({ name: 'zen', gardenId: garden.id });
    else if (latest) openArtwork(latest.id);
    else navigate({ name: 'books' });
  }
</script>

<div class="page home">
  <header class="hero">
    <div class="hero-text">
      <p class="eyebrow">{greeting} ☁</p>
      <h1>Paint something peaceful.</h1>
      <p class="sub">Soft colors, slow clouds and nothing to win. Pick up a brush whenever you like — your art saves itself.</p>
    </div>
    <div class="hero-cloud" aria-hidden="true" bind:this={heroEl}>
      <svg viewBox="0 0 260 150" width="260" height="150"><g fill="#fff"><circle cx="78" cy="88" r="40"/><circle cx="128" cy="62" r="52"/><circle cx="184" cy="84" r="42"/><rect x="36" y="82" width="190" height="52" rx="26"/></g><circle cx="100" cy="98" r="5" fill="#7c77a1"/><circle cx="156" cy="98" r="5" fill="#7c77a1"/><path d="M118 110q10 11 20 0" stroke="#7c77a1" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="84" cy="112" rx="10" ry="6" fill="#ffc0d6" opacity=".8"/><ellipse cx="172" cy="112" rx="10" ry="6" fill="#ffc0d6" opacity=".8"/></svg>
    </div>
  </header>

  <section class="actions" aria-label="Start here">
    <button class="card cont" onclick={resume}>
      <div class="visual">
        {#if showReading && reading}
          <div class="read-cover"><ReadingCover item={(reading.story ?? reading.adventure)!} /></div>
        {:else if pick === 'meditation'}
          <div class="soft-thumb med" aria-hidden="true"><Icon name="wind" size={44} /></div>
        {:else if pick === 'zen'}
          <div class="soft-thumb sand" aria-hidden="true"><Icon name="leaf" size={44} /></div>
        {:else if latest}
          <ArtThumb art={latest} />
        {:else}
          <div class="empty-thumb"><Icon name="brush" size={40} /></div>
        {/if}
      </div>
      <div class="meta">
        <span class="tag peach"><Icon name="play" size={14} /> Continue</span>
        {#if showReading && reading}
          <h3>{(reading.story ?? reading.adventure)!.manifest.name}</h3>
          <p>{reading.label}. Pick up where you left off.</p>
        {:else if pick === 'meditation' && meditation}
          <h3>{meditation.manifest.name}</h3>
          <p>Another quiet moment, whenever you like.</p>
        {:else if pick === 'zen' && garden}
          <h3>{garden.name}</h3>
          <p>Back to your Zen garden.</p>
        {:else}
          <h3>{latest ? latest.title : 'Your first picture'}</h3>
          <p>{latest ? 'Pick up right where you left off.' : 'Nothing started yet — choose a page to begin.'}</p>
        {/if}
      </div>
    </button>

    <button class="card books" onclick={() => navigate({ name: 'books' })}>
      <div class="visual stack">
        {#each shelf.filter((b) => b.manifest.kind === 'coloring').slice(0, 3) as b, i}
          <div class="mini" style="--i:{i}"><CoverImg book={b} /></div>
        {/each}
      </div>
      <div class="meta">
        <span class="tag sky"><Icon name="book" size={14} /> Open Coloring Books</span>
        <h3>Coloring Books</h3>
        <p>{$catalog.books.filter((b) => b.manifest.kind === 'coloring').reduce((n, b) => n + b.pages.length, 0)} cute pages across {$catalog.books.filter((b) => b.manifest.kind === 'coloring').length} books.</p>
      </div>
    </button>

    <button class="card stories" onclick={() => navigate({ name: 'stories' })}>
      <div class="visual stack warm">
        {#each $catalog.stories.slice(0, 3) as s, i}
          <div class="mini" style="--i:{i}"><ReadingCover item={s} /></div>
        {/each}
      </div>
      <div class="meta">
        <span class="tag pink"><Icon name="bookOpen" size={14} /> Read Slowly</span>
        <h3>Cozy Stories</h3>
        <p>{$catalog.stories.length} illustrated stories to read slowly. No choices, just calm.</p>
      </div>
    </button>

    <button class="card adventures" onclick={() => navigate({ name: 'adventures' })}>
      <div class="visual stack cool">
        {#each $catalog.adventures.slice(0, 3) as a, i}
          <div class="mini" style="--i:{i}"><ReadingCover item={a} /></div>
        {/each}
      </div>
      <div class="meta">
        <span class="tag butter"><Icon name="compass" size={14} /> Choose Your Path</span>
        <h3>Story Adventures</h3>
        <p>{$catalog.adventures.length} stories where you decide. Be the guy or the girl, and find every ending.</p>
      </div>
    </button>

    <button class="card draw" onclick={() => navigate({ name: 'draw' })}>
      <div class="visual swatches" aria-hidden="true">
        <i style="background:#bfe4f7"></i><i style="background:#e6d8f8"></i><i style="background:#ffd3e2"></i><i style="background:#c6ecda"></i><i style="background:#fff2bd"></i>
        <svg viewBox="0 0 300 90" width="100%" height="90"><path d="M12 62 C 60 12, 100 100, 150 48 S 240 22, 288 58" fill="none" stroke="#b7a8ec" stroke-width="12" stroke-linecap="round"/><path d="M12 72 C 70 40, 110 96, 160 66 S 240 50, 288 74" fill="none" stroke="#ffb7d1" stroke-width="8" stroke-linecap="round" opacity=".8"/></svg>
      </div>
      <div class="meta">
        <span class="tag mint"><Icon name="brush" size={14} /> Start Free Draw</span>
        <h3>Free Draw</h3>
        <p>A blank canvas in soft pastel backgrounds.</p>
      </div>
    </button>

    <button class="card games" onclick={() => navigate({ name: 'minigames' })}>
      <div class="visual play" aria-hidden="true">
        <span style="--c:#bfe4f7"></span><span style="--c:#ffd3e2"></span><span style="--c:#c6ecda"></span><span style="--c:#fff2bd"></span><span style="--c:#e6d8f8"></span>
        <b></b>
      </div>
      <div class="meta">
        <span class="tag lilac"><Icon name="gamepad" size={14} /> Mini-Games</span>
        <h3>Mini-Games</h3>
        <p>Pastel Breaker, Splash Wall and more. Calm, quick and relaxing.</p>
      </div>
    </button>

    <button class="card meditate" onclick={() => navigate({ name: 'meditation' })}>
      <div class="visual calm" aria-hidden="true">
        <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><g fill="#fff"><circle cx="78" cy="70" r="26"/><circle cx="108" cy="54" r="34"/><circle cx="138" cy="70" r="27"/><rect x="52" y="66" width="112" height="32" rx="16"/></g><circle cx="94" cy="76" r="3" fill="#7c77a1"/><circle cx="124" cy="76" r="3" fill="#7c77a1"/><path d="M104 83q5 5 10 0" stroke="#7c77a1" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
      </div>
      <div class="meta">
        <span class="tag mint"><Icon name="wind" size={14} /> A quiet moment</span>
        <h3>Meditation</h3>
        <p>{$catalog.meditations.length} gentle sessions, from one minute to twenty. No streaks, no pressure.</p>
      </div>
    </button>

    <button class="card movement" onclick={() => navigate({ name: 'movement' })}>
      <div class="visual stretchy" aria-hidden="true">
        <svg viewBox="0 0 200 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><ellipse cx="100" cy="116" rx="46" ry="6" fill="#fff" opacity=".6"/><rect x="82" y="64" width="36" height="46" rx="18" fill="#ffd3e2"/><circle cx="100" cy="44" r="22" fill="#ffd3e2"/><path d="M84 70 Q60 52 56 30" stroke="#ffd3e2" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M116 70 Q140 52 144 30" stroke="#ffd3e2" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="92" cy="44" r="2.6" fill="#7c77a1"/><circle cx="108" cy="44" r="2.6" fill="#7c77a1"/><path d="M95 52q5 5 10 0" stroke="#7c77a1" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>
      </div>
      <div class="meta">
        <span class="tag sky"><Icon name="stretch" size={14} /> Stretch a little</span>
        <h3>Gentle Movement</h3>
        <p>{$catalog.movements.length} easy stretches for a short break. General ideas, go at your own pace.</p>
      </div>
    </button>
  </section>

  {#if recent.length > 1}
    <section class="recent">
      <div class="row-head">
        <h2>Recent artwork</h2>
        <button class="link" onclick={() => navigate({ name: 'gallery' })}>See Gallery <Icon name="chevronRight" size={16} /></button>
      </div>
      <div class="recent-grid">
        {#each recent as a (a.id)}
          <button class="rcard" onclick={() => { sfx.pageTurn(); openArtwork(a.id); }}>
            <ArtThumb art={a} />
            <span>{a.title}</span>
          </button>
        {/each}
      </div>
    </section>
  {:else if $artworksLoaded && $artworks.length === 0}
    <p class="hint muted">Tip: pick any page in a coloring book. Tap a region to fill it, or switch to a brush to paint freely.</p>
  {/if}
</div>

<style>
  .home {
    max-width: 1180px;
    margin: 0 auto;
  }
  .hero {
    flex-wrap: wrap;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 18px 12px 30px;
  }
  .hero h1 {
    font-size: 2.7rem;
    line-height: 1.08;
    margin: 6px 0 10px;
    background: linear-gradient(110deg, var(--hero-a), var(--hero-b) 60%, var(--hero-c));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .hero .sub {
    max-width: 520px;
    color: var(--ink-soft);
    font-size: 1.08rem;
  }
  .hero-cloud {
    flex: none;
    will-change: transform;
  }
  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }
  .card {
    display: flex;
    align-items: stretch;
    gap: 20px;
    padding: 18px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    text-align: left;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease);
    min-height: 178px;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-l);
  }
  .card:active {
    transform: translateY(0) scale(0.99);
  }
  .visual {
    flex: none;
    width: 40%;
    border-radius: 22px;
    overflow: hidden;
    position: relative;
    display: grid;
    place-items: center;
  }
  .cont .visual {
    background: #fffdf8;
  }
  .empty-thumb {
    width: 100%;
    aspect-ratio: 4/3;
    display: grid;
    place-items: center;
    color: #b9a9ec;
    background: linear-gradient(135deg, #fdf3ea, #f1e9fb);
    border-radius: 18px;
  }
  .meta {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    min-width: 0;
  }
  .meta h3 {
    font-size: 1.28rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta p {
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
  .tag {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 800;
  }
  .tag.peach {
    background: var(--peach);
    color: var(--c-peach);
  }
  .tag.sky {
    background: var(--sky);
    color: var(--c-blue);
  }
  .tag.mint {
    background: var(--mint);
    color: var(--c-green);
  }
  .tag.lilac {
    background: var(--lilac);
    color: var(--c-violet);
  }
  .tag.pink {
    background: var(--pink);
    color: var(--c-pink);
  }
  .read-cover {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    overflow: hidden;
  }
  .tag.butter {
    background: var(--c-gold-bg);
    color: var(--c-gold);
  }
  .soft-thumb {
    width: 100%;
    aspect-ratio: 4/3;
    display: grid;
    place-items: center;
    border-radius: 18px;
    color: #8d84c9;
  }
  .soft-thumb.med {
    background: linear-gradient(135deg, #e3f1fb, #ece3fb);
  }
  .soft-thumb.sand {
    background: linear-gradient(135deg, #f8ecd7, #f3e3d0);
    color: #b49266;
  }
  .calm {
    background: linear-gradient(135deg, #dff0fb, #e9e0fa);
    min-height: 140px;
  }
  .stretchy {
    background: linear-gradient(135deg, #e3f5ee, #fde6ef);
    min-height: 140px;
  }
  .calm svg,
  .stretchy svg {
    position: absolute;
    inset: 0;
  }
  .stack.cool {
    background: linear-gradient(135deg, #e3f5ee, #e6dcfa);
  }
  .stack {
    background: linear-gradient(135deg, #dff0fb, #ece3fb);
  }
  .stack.warm {
    background: linear-gradient(135deg, #fde6ef, #fff0d8);
  }
  .mini :global(img) {
    object-fit: cover;
  }
  .mini {
    position: absolute;
    width: 44%;
    aspect-ratio: 3/4;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 6px 14px rgba(100, 90, 170, 0.25);
    left: calc(8% + var(--i) * 20%);
    top: calc(14% + var(--i) * 4%);
    transform: rotate(calc((var(--i) - 1) * 7deg));
  }
  .stack {
    min-height: 140px;
  }
  .swatches {
    background: linear-gradient(135deg, #e3f5ee, #e6effa);
    padding: 12px;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    gap: 6px;
    min-height: 140px;
  }
  .swatches i {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(100, 90, 170, 0.18);
  }
  .swatches svg {
    margin-top: 6px;
  }
  .play {
    background: linear-gradient(135deg, #ece3fb, #fde6ef);
    min-height: 140px;
    display: block;
  }
  .play span {
    position: absolute;
    top: 20px;
    width: 26px;
    height: 14px;
    border-radius: 6px;
    background: var(--c);
    box-shadow: 0 2px 5px rgba(100, 90, 170, 0.2);
  }
  .play span:nth-child(1) { left: 12%; }
  .play span:nth-child(2) { left: 32%; }
  .play span:nth-child(3) { left: 52%; }
  .play span:nth-child(4) { left: 72%; }
  .play span:nth-child(5) { left: 42%; top: 40px; }
  .play b {
    position: absolute;
    bottom: 34px;
    left: 40%;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff, #ffb7d1 70%);
    box-shadow: 0 4px 10px rgba(240, 140, 180, 0.4);
  }
  .play::after {
    content: '';
    position: absolute;
    bottom: 16px;
    left: 28%;
    width: 44%;
    height: 10px;
    border-radius: 6px;
    background: linear-gradient(90deg, var(--g1), var(--g2));
  }
  .recent {
    margin-top: 40px;
  }
  .row-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
  }
  .recent-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }
  .rcard {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 10px 12px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-s);
    font-weight: 700;
    text-align: left;
    transition: transform 0.2s var(--ease);
  }
  .rcard:hover {
    transform: translateY(-3px);
  }
  .rcard span {
    padding: 0 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint {
    margin-top: 34px;
    text-align: center;
  }
  @media (max-width: 1180px) {
    .actions {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 900px) {
    .hero-cloud {
      display: none;
    }
    .hero h1 {
      font-size: 2rem;
    }
  }
</style>
