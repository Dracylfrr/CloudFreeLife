<script lang="ts">
  import { catalog } from '../../core/content/registry';
  import { navigate } from '../../core/router';
  import { formatDate } from '../../core/util';
  import { sfx } from '../../core/audio';
  import ContentCover from '../../ui/ContentCover.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { meditationProgress, toggleMeditationFavorite } from './progress';
  import { minutesLabel } from './breath';

  const sessions = $derived($catalog.meditations);
  const last = $derived($meditationProgress.last ? sessions.find((s) => s.manifest.id === $meditationProgress.last!.id) : undefined);

  function open(id: string) {
    sfx.pageTurn();
    navigate({ name: 'meditate', sessionId: id });
  }
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Optional quiet time</p>
      <h1>Meditation</h1>
      <p class="sub">A few minutes of quiet whenever you feel like it. There is nothing to achieve, no streaks, and you can stop at any time.</p>
    </div>
  </header>

  {#if last && $meditationProgress.last}
    <p class="lastline">Last time: <strong>{last.manifest.name}</strong>, {formatDate($meditationProgress.last.at)}</p>
  {/if}

  {#if sessions.length === 0}
    <p class="muted">No sessions are installed. New ones arrive through Updates.</p>
  {:else}
    <div class="shelf">
      {#each sessions as s (s.manifest.id)}
        {@const fav = $meditationProgress.favorites.includes(s.manifest.id)}
        {@const n = $meditationProgress.done[s.manifest.id] ?? 0}
        <article class="card" style="--accent:{s.manifest.accent ?? '#b7a8ec'}">
          <button class="open" onclick={() => open(s.manifest.id)} aria-label="Open {s.manifest.name}, {s.manifest.kind === 'timer' ? 'choose a length' : minutesLabel(s.manifest.minutes)}">
            <div class="cover"><ContentCover item={s} file={s.manifest.cover} /></div>
            <div class="info">
              <span class="chip">{s.manifest.kind === 'timer' ? 'You choose the length' : minutesLabel(s.manifest.minutes)}</span>
              <h3>{s.manifest.name}</h3>
              <p>{s.manifest.description}</p>
              {#if n > 0}<span class="done">Finished {n === 1 ? 'once' : `${n} times`}</span>{/if}
            </div>
          </button>
          <button class="fav" class:on={fav} aria-pressed={fav} aria-label={fav ? `Remove ${s.manifest.name} from favorites` : `Add ${s.manifest.name} to favorites`} onclick={() => toggleMeditationFavorite(s.manifest.id)}>
            <Icon name="heart" size={18} />
          </button>
        </article>
      {/each}
    </div>
  {/if}

  <p class="note"><Icon name="info" size={16} /> Meditation here is simply optional quiet relaxation. It is not medical care and does not treat or diagnose anything. Everything stays on this computer.</p>
</div>

<style>
  .lastline {
    margin: -8px 0 20px;
    color: var(--ink-soft);
    font-weight: 700;
  }
  /* five cards across, so the whole shelf shows at once; fewer columns only on a narrow window */
  .shelf {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 1180px) {
    .shelf {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  @media (max-width: 940px) {
    .shelf {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 680px) {
    .shelf {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .card {
    position: relative;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    overflow: hidden;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease);
  }
  .card:hover {
    transform: translateY(-5px) rotate(-0.4deg);
    box-shadow: var(--shadow-l);
  }
  .open {
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 100%;
    height: 100%;
  }
  .cover {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-bottom: 5px solid var(--accent);
  }
  .info {
    padding: 10px 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .info h3 {
    font-size: 1.02rem;
    line-height: 1.2;
  }
  .chip {
    align-self: flex-start;
    background: var(--lilac);
    color: var(--c-violet);
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 800;
  }
  .info p {
    color: var(--ink-soft);
    font-size: 0.84rem;
    line-height: 1.4;
  }
  .done {
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .fav {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.85);
    box-shadow: var(--shadow-s);
  }
  .fav:hover,
  .fav.on {
    color: var(--pink-deep);
  }
  .fav.on :global(svg) {
    fill: var(--pink-deep);
  }
  .note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 30px;
    max-width: 760px;
    padding: 12px 16px;
    border-radius: 16px;
    background: rgb(var(--w) / 0.5);
    color: var(--ink-soft);
    font-size: 0.88rem;
    font-weight: 600;
  }
  .note :global(svg) {
    flex: none;
    margin-top: 2px;
  }
</style>
