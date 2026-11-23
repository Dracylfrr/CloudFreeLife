<script lang="ts">
  import { untrack } from 'svelte';
  import { catalog } from '../../core/content/registry';
  import type { Protagonist } from '../../core/manifests';
  import { storyProgress } from './progress';
  import { buildReadingList, groupReadingList, type ReadingEntry } from './readingList';
  import ReadingCard from './ReadingCard.svelte';

  type Tab = 'continue' | 'stories' | 'adventures' | 'notStarted' | 'finished' | 'favorites';
  let { tab: initial }: { tab?: Tab } = $props();

  const all = $derived(buildReadingList($catalog.stories, $catalog.adventures, $storyProgress));
  const groups = $derived(groupReadingList(all));

  // Open on "Continue" when something is in progress, otherwise on the stories themselves.
  let tab = $state<Tab>(untrack(() => initial ?? (groupReadingList(buildReadingList($catalog.stories, $catalog.adventures, $storyProgress)).continue.length ? 'continue' : 'stories')));
  let who = $state<'all' | Protagonist>('all');
  let genre = $state<string>('all');

  const stories = $derived(all.filter((e) => e.kind === 'story'));
  const adventures = $derived(all.filter((e) => e.kind === 'adventure'));
  const genres = $derived([...new Set($catalog.adventures.map((a) => a.manifest.genre))].sort());
  const shownAdventures = $derived(adventures.filter((e) => (who === 'all' || e.adventure?.manifest.protagonist === who) && (genre === 'all' || e.adventure?.manifest.genre === genre)));

  const tabs = $derived<{ id: Tab; label: string; count: number }[]>([
    { id: 'continue', label: 'Continue', count: groups.continue.length },
    { id: 'stories', label: 'Cozy Stories', count: stories.length },
    { id: 'adventures', label: 'Story Adventures', count: adventures.length },
    { id: 'notStarted', label: 'Not started', count: groups.notStarted.length },
    { id: 'finished', label: 'Finished', count: groups.finished.length },
    { id: 'favorites', label: 'Favorites', count: groups.favorites.length }
  ]);

  const shown = $derived<ReadingEntry[]>(
    tab === 'continue' ? groups.continue : tab === 'stories' ? stories : tab === 'adventures' ? shownAdventures : tab === 'notStarted' ? groups.notStarted : tab === 'finished' ? groups.finished : groups.favorites
  );

  const EMPTY: Record<Tab, string> = {
    continue: 'Nothing in progress right now. Pick a story and we will keep your place.',
    stories: 'No stories are installed yet. New ones arrive through Updates.',
    adventures: 'No adventures are installed yet. New ones arrive through Updates.',
    notStarted: 'You have opened everything. Lovely!',
    finished: 'Finished stories and adventures will gather here.',
    favorites: 'Tap the heart on any story to keep it here.'
  };

  const SUB: Record<Tab, string> = {
    continue: 'Pick up right where you left off.',
    stories: 'Short and long stories to read slowly, or listen to with Read Aloud.',
    adventures: 'Live a story from the inside. Make a choice at every turn and see how many endings you can find.',
    notStarted: 'Fresh stories, waiting for you.',
    finished: 'Stories you have read to the end, and adventures with endings found.',
    favorites: 'Your hearted stories and adventures.'
  };

  function onKey(e: KeyboardEvent, i: number) {
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    if (n < 0) return;
    e.preventDefault();
    tab = tabs[n].id;
    (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role=tab]')[n]?.focus();
  }
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Library</p>
      <h1>Stories</h1>
      <p class="sub">{SUB[tab]}</p>
    </div>
    <span class="pill">{stories.length} stories · {adventures.length} adventures</span>
  </header>

  <div class="tabs" role="tablist" aria-label="Story sections">
    {#each tabs as t, i (t.id)}
      <button class="tab" class:on={tab === t.id} role="tab" aria-selected={tab === t.id} tabindex={tab === t.id ? 0 : -1} onclick={() => (tab = t.id)} onkeydown={(e) => onKey(e, i)}>
        {t.label}{#if t.count > 0}<span class="n">{t.count}</span>{/if}
      </button>
    {/each}
  </div>

  {#if tab === 'adventures'}
    <div class="filters" aria-label="Filter adventures">
      <div class="seg" role="group" aria-label="Play as">
        <button class:on={who === 'all'} onclick={() => (who = 'all')}>Everyone</button>
        <button class:on={who === 'guy'} onclick={() => (who = 'guy')}>Play as a guy</button>
        <button class:on={who === 'girl'} onclick={() => (who = 'girl')}>Play as a girl</button>
      </div>
      {#if genres.length > 1}
        <div class="genres" role="group" aria-label="Genre">
          <button class:on={genre === 'all'} onclick={() => (genre = 'all')}>All genres</button>
          {#each genres as g}<button class:on={genre === g} onclick={() => (genre = g)}>{g}</button>{/each}
        </div>
      {/if}
    </div>
  {/if}

  <div role="tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label}>
    {#if shown.length === 0}
      <p class="empty">{tab === 'adventures' && adventures.length > 0 ? 'Nothing matches that filter. Try choosing everyone or all genres.' : EMPTY[tab]}</p>
    {:else}
      <div class="shelf">
        {#each shown as e (e.kind + e.id)}
          <ReadingCard entry={e} />
        {/each}
      </div>
    {/if}
  </div>
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
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 22px;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.92rem;
    color: var(--ink-soft);
    background: var(--panel);
    box-shadow: var(--shadow-s);
    transition:
      background 0.2s,
      color 0.2s;
  }
  .tab:hover {
    color: var(--ink);
  }
  .tab.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .n {
    min-width: 20px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 0.75rem;
    line-height: 20px;
    text-align: center;
    background: rgb(var(--w) / 0.7);
    color: var(--ink-soft);
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 22px;
    margin-bottom: 24px;
  }
  .seg,
  .genres {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .seg {
    background: var(--panel);
    padding: 5px;
    border-radius: 999px;
    box-shadow: var(--shadow-s);
  }
  .seg button,
  .genres button {
    padding: 7px 16px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.9rem;
    color: var(--ink-soft);
    transition:
      background 0.2s,
      color 0.2s;
  }
  .genres button {
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .seg button:hover,
  .genres button:hover {
    color: var(--ink);
  }
  .seg button.on,
  .genres button.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 26px;
    max-width: 1180px;
  }
  .empty {
    color: var(--ink-soft);
    font-weight: 700;
    padding: 28px 8px;
  }
</style>
