<script lang="ts">
  import { navigate } from '../../core/router';
  import { catalog } from '../../core/content/registry';
  import { storyProgress } from './progress';
  import ReadingCover from './ReadingCover.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';

  const stories = $derived($catalog.stories);

  function status(id: string, chapters: number): string | null {
    const p = $storyProgress.stories[id];
    if (!p) return null;
    if (p.chapter > 0) return `Continue · chapter ${Math.min(p.chapter + 1, chapters)} of ${chapters}`;
    return p.finished ? 'Read' : null;
  }
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Library</p>
      <h1>Cozy Stories</h1>
      <p class="sub">Short, gentle stories to read slowly. Pick one, get comfortable, and we'll keep your place.</p>
    </div>
    <span class="pill">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
  </header>

  {#if stories.length === 0}
    <p class="muted">No stories are installed yet. New ones arrive through Updates.</p>
  {:else}
    <div class="shelf">
      {#each stories as s (s.manifest.id)}
        {@const st = status(s.manifest.id, s.manifest.chapters.length)}
        <button
          class="story"
          style="--accent:{s.manifest.accent ?? '#b7a8ec'}"
          onclick={() => {
            sfx.pageTurn();
            navigate({ name: 'story', storyId: s.manifest.id });
          }}
        >
          <div class="cover"><ReadingCover item={s} /></div>
          <div class="info">
            <div class="chips">
              {#if s.manifest.mood}<span class="chip">{s.manifest.mood}</span>{/if}
              {#if s.source === 'installed'}<span class="chip new">Downloaded</span>{/if}
            </div>
            <h3>{s.manifest.name}</h3>
            <p>{s.manifest.description}</p>
            <span class="count">
              <Icon name="bookOpen" size={14} />
              {s.manifest.chapters.length} chapters{s.manifest.minutes ? ` · about ${s.manifest.minutes} min` : ''}
            </span>
            {#if st}<span class="status">{st}</span>{/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .pill {
    background: var(--panel-strong);
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 800;
    box-shadow: var(--shadow-s);
    white-space: nowrap;
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 26px;
    max-width: 1180px;
  }
  .story {
    display: flex;
    flex-direction: column;
    text-align: left;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.85);
    overflow: hidden;
    transition:
      transform 0.25s var(--ease),
      box-shadow 0.25s var(--ease);
  }
  .story:hover {
    transform: translateY(-5px) rotate(-0.4deg);
    box-shadow: var(--shadow-l);
  }
  .cover {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-bottom: 5px solid var(--accent);
  }
  .info {
    padding: 14px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 24px;
  }
  .chip {
    background: var(--lilac);
    color: #5a4a98;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 800;
  }
  .chip.new {
    background: var(--mint);
    color: #2e5a4b;
  }
  .info p {
    color: var(--ink-soft);
    font-size: 0.93rem;
    min-height: 2.6em;
  }
  .count {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--accent);
    filter: brightness(0.82);
  }
  .status {
    align-self: flex-start;
    background: var(--peach);
    color: #8a4f3a;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 800;
  }
</style>
