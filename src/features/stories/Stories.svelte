<script lang="ts">
  import { untrack } from 'svelte';
  import { catalog } from '../../core/content/registry';
  import type { Protagonist } from '../../core/manifests';
  import { storyProgress } from './progress';
  import { buildReadingList, groupReadingList, type ReadingEntry } from './readingList';
  import ReadingCard from './ReadingCard.svelte';
  import { groupSeries, partLabel } from './longread';
  import MyAvatar from '../avatar/MyAvatar.svelte';
  import { hasAvatar, openAvatarEditor } from '../avatar/state';
  import { settings } from '../../core/settings';

  // One screen, two places: "Cozy Stories" (books you read, with no choices) and
  // "Story Adventures" (you choose what happens). They share the same simple list.
  type Tab = 'continue' | 'all' | 'notStarted' | 'finished' | 'favorites';
  let { kind, tab: initial }: { kind: 'story' | 'adventure'; tab?: Tab } = $props();
  const isAdventure = $derived(kind === 'adventure');

  const everything = $derived(buildReadingList($catalog.stories, $catalog.adventures, $storyProgress));
  const mine = $derived(everything.filter((e) => e.kind === kind));
  const groups = $derived(groupReadingList(mine));

  // The shelf opens on everything; "Continue" is the next tab along.
  let tab = $state<Tab>(untrack(() => initial ?? 'all'));
  let who = $state<'all' | Protagonist>('all');
  let genre = $state<string>('all');

  const genres = $derived([...new Set($catalog.adventures.map((a) => a.manifest.genre))].sort());

  const tabs = $derived<{ id: Tab; label: string; count: number }[]>([
    { id: 'all', label: isAdventure ? 'All adventures' : 'All stories', count: mine.length },
    { id: 'continue', label: 'Continue', count: groups.continue.length },
    { id: 'notStarted', label: 'Not started', count: groups.notStarted.length },
    { id: 'finished', label: 'Finished', count: groups.finished.length },
    { id: 'favorites', label: 'Favorites', count: groups.favorites.length }
  ]);

  const base = $derived<ReadingEntry[]>(tab === 'continue' ? groups.continue : tab === 'all' ? mine : tab === 'notStarted' ? groups.notStarted : tab === 'finished' ? groups.finished : groups.favorites);
  const shown = $derived(isAdventure ? base.filter((e) => (who === 'all' || e.adventure?.manifest.protagonist === who) && (genre === 'all' || e.adventure?.manifest.genre === genre)) : base);

  // Parts of one series sit together on the shelf, in order.
  const items = $derived(groupSeries(shown));

  const thing = $derived(isAdventure ? 'adventures' : 'stories');
  const EMPTY = $derived<Record<Tab, string>>({
    continue: `Nothing in progress right now. Pick ${isAdventure ? 'an adventure' : 'a story'} and we will keep your place.`,
    all: `No ${thing} are installed yet. New ones arrive through Updates.`,
    notStarted: 'You have opened everything. Lovely!',
    finished: `Finished ${thing} will gather here.`,
    favorites: `Tap the heart on any ${isAdventure ? 'adventure' : 'story'} to keep it here.`
  });

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
      <p class="eyebrow">{isAdventure ? 'Choose your path' : 'Library'}</p>
      <h1>{isAdventure ? 'Story Adventures' : 'Cozy Stories'}</h1>
      <p class="sub">
        {isAdventure
          ? 'Live a story from the inside. Make a choice at every turn and see how many endings you can find.'
          : 'Gentle illustrated stories to read slowly. Nothing to do but enjoy them.'}
      </p>
    </div>
    <div class="head-right">
      {#if isAdventure}
        <button class="player" onclick={openAvatarEditor} title={hasAvatar($settings) ? 'Change your avatar' : 'Choose your avatar'}>
          <MyAvatar size={44} />
          <span>{hasAvatar($settings) ? 'Playing as you' : 'Choose your avatar'}</span>
        </button>
      {/if}
      <span class="pill">{mine.length} {isAdventure ? 'adventures' : 'stories'}</span>
    </div>
  </header>

  <div class="tabs" role="tablist" aria-label={isAdventure ? 'Adventure sections' : 'Story sections'}>
    {#each tabs as t, i (t.id)}
      <button class="tab" class:on={tab === t.id} role="tab" aria-selected={tab === t.id} tabindex={tab === t.id ? 0 : -1} onclick={() => (tab = t.id)} onkeydown={(e) => onKey(e, i)}>
        {t.label}{#if t.count > 0}<span class="n">{t.count}</span>{/if}
      </button>
    {/each}
  </div>

  {#if isAdventure}
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
      <p class="empty">{isAdventure && base.length > 0 ? 'Nothing matches that filter. Try choosing everyone or all genres.' : EMPTY[tab]}</p>
    {:else}
      <div class="shelf">
        {#each items as it (it.kind === 'single' ? it.entry.kind + it.entry.id : 'series:' + it.series.id)}
          {#if it.kind === 'single'}
            <ReadingCard entry={it.entry} />
          {:else}
            <section class="series" aria-label="{it.series.name}, a series of {it.parts.length}">
              <h2 class="series-name">{it.series.name}<span>{it.parts.length} parts</span></h2>
              <div class="shelf inner">
                {#each it.parts as e (e.kind + e.id)}
                  <ReadingCard entry={e} part={partLabel(e, mine)} />
                {/each}
              </div>
            </section>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .head-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .player {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 4px 16px 4px 5px;
    border-radius: 999px;
    background: var(--panel-strong);
    box-shadow: var(--shadow-s);
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--ink-soft);
  }
  .player:hover {
    color: var(--ink);
    box-shadow: var(--shadow-m);
  }
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
  .series {
    grid-column: 1 / -1;
    padding: 16px 18px 22px;
    border-radius: var(--radius-xl);
    background: rgb(var(--w) / 0.35);
    border: 1px dashed rgb(var(--w) / 0.9);
  }
  .series-name {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin: 0 0 14px;
    font-size: 1.15rem;
  }
  .series-name span {
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .shelf.inner {
    max-width: none;
  }
  .empty {
    color: var(--ink-soft);
    font-weight: 700;
    padding: 28px 8px;
  }
</style>
