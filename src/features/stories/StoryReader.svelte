<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { navigate, onBeforeLeave } from '../../core/router';
  import { findStory } from '../../core/content/registry';
  import { settings, updateSettings } from '../../core/settings';
  import { storyProgress, saveStoryPlace, saveStoryParagraph, setFavorite, isFavorite, flushStoryProgress, addBookmark, removeBookmark, bookmarksOf, MAX_BOOKMARKS, MAX_NOTE } from './progress';
  import { chapterParts, formatLeft, readingWpm, timeLeft } from './longread';
  import { toast } from '../../core/feedback';
  import StoryArt from './StoryArt.svelte';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx, fadeMusic } from '../../core/audio';

  let { storyId }: { storyId: string } = $props();
  const sid = untrack(() => storyId);
  const story = findStory(sid);
  const total = story?.manifest.chapters.length ?? 0;

  // page 0..total-1 are chapters; page === total is "The End"
  const saved = get(storyProgress).stories[sid];
  const startPage = story ? Math.min(saved?.chapter ?? 0, total - 1) : 0;
  let page = $state(startPage);
  let scroller: HTMLDivElement | undefined = $state();
  let textEl: HTMLDivElement | undefined = $state();
  let tocOpen = $state(false);
  let restorePara = untrack(() => (saved && !saved.finished ? saved.para : 0));
  let curPara = $state(untrack(() => restorePara));
  let markOpen = $state(false);
  let sleepOpen = $state(false);
  let note = $state('');
  let sleepEnds = $state(0); // epoch ms when sleep mode will have faded the music out; 0 = off
  let sleepTimer: ReturnType<typeof setTimeout> | null = null;

  const atEnd = $derived(page >= total);
  const chapter = $derived(story && !atEnd ? story.manifest.chapters[page] : null);
  const favorite = $derived(isFavorite($storyProgress, 'story', sid));
  const percent = $derived(total ? Math.round((Math.min(page, total) / total) * 100) : 0);
  const marks = $derived(bookmarksOf($storyProgress, sid));
  const left = $derived(story && !atEnd ? timeLeft(story.manifest, page, curPara, readingWpm($settings.storyFontScale)) : null);
  const sleeping = $derived(sleepEnds > 0);
  const fontScale = $derived(sleeping ? Math.min(1.9, $settings.storyFontScale + 0.25) : $settings.storyFontScale);

  // ---- Bookmarks -----------------------------------------------------------
  function bookmarkHere() {
    if (!story || atEnd) return;
    if (!addBookmark(sid, page, curPara, note)) toast(`A story can hold ${MAX_BOOKMARKS} bookmarks. Remove one to make room.`, 'info');
    else {
      toast('Bookmark added', 'success');
      note = '';
    }
  }
  function goMark(b: { chapter: number; para: number }) {
    markOpen = false;
    if (b.chapter !== page) go(b.chapter);
    restorePara = b.para;
    curPara = b.para;
    void tick().then(() => textEl?.querySelectorAll<HTMLElement>('p[data-p]')[b.para]?.scrollIntoView({ block: 'start' }));
  }

  // ---- Sleep mode: dimmer, bigger text, no motion; the music fades out at the end ----
  function startSleep(minutes: number) {
    stopSleep(false);
    sleepEnds = Date.now() + minutes * 60_000;
    sleepOpen = false;
    sleepTimer = setTimeout(() => fadeMusic(0, 45), Math.max(0, minutes * 60_000 - 45_000));
  }
  function stopSleep(restore = true) {
    if (sleepTimer) clearTimeout(sleepTimer);
    sleepTimer = null;
    sleepEnds = 0;
    if (restore) fadeMusic(1, 2);
  }

  // ---- Navigation --------------------------------------------------------
  function go(next: number) {
    if (!story) return;
    page = Math.max(0, Math.min(total, next));
    restorePara = 0;
    curPara = 0;
    if (page >= total) saveStoryPlace(sid, 0, true);
    else saveStoryPlace(sid, page, false);
    tocOpen = false;
    markOpen = false;
    scroller?.scrollTo({ top: 0 });
    sfx.pageTurn();
  }

  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape' && (tocOpen || markOpen || sleepOpen)) {
      tocOpen = markOpen = sleepOpen = false;
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1);
  }

  const bigger = () => updateSettings({ storyFontScale: Math.min(1.7, +($settings.storyFontScale + 0.1).toFixed(2)) });
  const smaller = () => updateSettings({ storyFontScale: Math.max(0.9, +($settings.storyFontScale - 0.1).toFixed(2)) });

  // ---- Remember where reading stopped (paragraph near the top of the page) ----
  let scrollTimer: ReturnType<typeof setTimeout> | null = null;
  function onScroll() {
    if (scrollTimer || !textEl || !scroller || atEnd) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = null;
      if (!textEl || !scroller) return;
      const top = scroller.getBoundingClientRect().top + 90;
      const ps = textEl.querySelectorAll<HTMLElement>('p[data-p]');
      let idx = 0;
      ps.forEach((p, i) => {
        if (p.getBoundingClientRect().bottom < top) idx = Math.min(i + 1, ps.length - 1);
      });
      curPara = idx;
      saveStoryParagraph(sid, idx);
    }, 400);
  }

  onMount(() => {
    if (story && !saved) saveStoryPlace(sid, 0, false);
    else if (story && saved && !saved.finished) saveStoryPlace(sid, startPage, false, saved.para);
    // Come back to the paragraph where reading stopped.
    if (restorePara > 0) {
      void tick().then(() => {
        const el = textEl?.querySelectorAll<HTMLElement>('p[data-p]')[restorePara];
        el?.scrollIntoView({ block: 'start' });
      });
    }
    const off = onBeforeLeave(() => flushStoryProgress());
    return () => off();
  });
  onDestroy(() => {
    if (scrollTimer) clearTimeout(scrollTimer);
    if (sleepEnds > 0) stopSleep(true);
    else if (sleepTimer) clearTimeout(sleepTimer);
  });

  const intro = $derived(story && page === 0 && !!story.manifest.illustration && !story.manifest.chapters[0]?.illustration);
</script>

<svelte:window onkeydown={key} />

<div class="page reader" class:sleep={sleeping} bind:this={scroller} onscroll={onScroll}>
  {#if !story}
    <p>This story isn't available.</p>
    <Button onclick={() => navigate({ name: 'stories' })}>Back to stories</Button>
  {:else}
    <header class="bar">
      <button class="back" onclick={() => navigate({ name: 'stories' })}><Icon name="chevronLeft" size={18} /> Cozy Stories</button>
      <div class="tools">
        <button class="tool" class:on={favorite} aria-pressed={favorite} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} title={favorite ? 'Favorite' : 'Add to favorites'} onclick={() => setFavorite('story', sid, !favorite)}>
          <Icon name="heart" size={18} />
        </button>
        <button class="tool wide" class:on={markOpen} aria-expanded={markOpen} onclick={() => { markOpen = !markOpen; tocOpen = sleepOpen = false; }}>
          <Icon name="bookmark" size={18} /> <span>Bookmarks{marks.length ? ` (${marks.length})` : ''}</span>
        </button>
        <button class="tool wide" class:on={tocOpen} aria-expanded={tocOpen} onclick={() => { tocOpen = !tocOpen; markOpen = sleepOpen = false; }}>
          <Icon name="list" size={18} /> <span>Chapters</span>
        </button>
        <button class="tool wide" class:on={sleeping || sleepOpen} aria-expanded={sleepOpen} aria-pressed={sleeping} onclick={() => { if (sleeping) stopSleep(); else { sleepOpen = !sleepOpen; tocOpen = markOpen = false; } }}>
          <Icon name="moon" size={18} /> <span>{sleeping ? 'Sleep mode on' : 'Sleep mode'}</span>
        </button>
        <div class="size" role="group" aria-label="Text size">
          <button onclick={smaller} aria-label="Smaller text" title="Smaller text" disabled={$settings.storyFontScale <= 0.91}>A<small>−</small></button>
          <button onclick={bigger} aria-label="Larger text" title="Larger text" disabled={$settings.storyFontScale >= 1.69}>A<small>+</small></button>
        </div>
      </div>
    </header>

    {#if tocOpen}
      <nav class="toc" aria-label="Chapters">
        {#each chapterParts(story.manifest.chapters) as grp}
          {#if grp.part}<p class="part">{grp.part}</p>{/if}
          {#each grp.indexes as i}
            <button class:cur={i === page} onclick={() => go(i)}>
              <span class="n">{i + 1}</span>
              <span class="t">{story.manifest.chapters[i].title}</span>
              {#if saved?.finished || i < page}<Icon name="check" size={15} />{/if}
            </button>
          {/each}
        {/each}
      </nav>
    {/if}

    {#if markOpen}
      <section class="panel" aria-label="Bookmarks">
        {#if !atEnd}
          <div class="add">
            <input type="text" bind:value={note} maxlength={MAX_NOTE} placeholder="A short note (optional)" aria-label="Bookmark note" onkeydown={(e) => { if (e.key === 'Enter') bookmarkHere(); }} />
            <Button variant="soft" icon="bookmark" onclick={bookmarkHere}>Bookmark this spot</Button>
          </div>
        {/if}
        {#if marks.length === 0}
          <p class="muted small">No bookmarks yet. Scroll to a place you would like to keep and press the button. Your reading place is always saved for you anyway.</p>
        {:else}
          <ul class="marks">
            {#each marks as b (b.chapter + ':' + b.para)}
              <li>
                <button class="go" onclick={() => goMark(b)}>
                  <strong>Chapter {b.chapter + 1}: {story.manifest.chapters[b.chapter]?.title ?? ''}</strong>
                  <span>{b.note || 'Paragraph ' + (b.para + 1)}</span>
                </button>
                <button class="rm" aria-label="Remove this bookmark" title="Remove" onclick={() => removeBookmark(sid, b.chapter, b.para)}><Icon name="x" size={16} /></button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}

    {#if sleepOpen}
      <section class="panel" aria-label="Sleep mode">
        <p class="small">A quieter way to read in bed: the page dims, the text gets a little larger, nothing moves, and the music fades away at the end of the time you choose.</p>
        <div class="durations" role="group" aria-label="Fade the music out after">
          {#each [15, 30, 60] as m}
            <Button variant="soft" onclick={() => startSleep(m)}>{m} minutes</Button>
          {/each}
        </div>
      </section>
    {/if}


    <article class="paper" style="--fs:{fontScale}; --accent:{story.manifest.accent ?? '#b7a8ec'}">
      {#if intro && story.manifest.illustration}
        <StoryArt {story} file={story.manifest.illustration} alt={story.manifest.illustrationAlt ?? ''} caption={story.manifest.illustrationCaption ?? ''} wide />
      {/if}
      <h1 class="title">{story.manifest.name}</h1>
      {#key page}
        <div class="turn">
          {#if chapter}
            <p class="eyebrow">Chapter {page + 1} of {total} · {percent}%</p>
            {#if left}<p class="left" aria-live="off">{formatLeft(left.chapter)} left in this chapter{total > 1 ? ` · ${formatLeft(left.story).toLowerCase()} in the story` : ''}</p>{/if}
            <h2>{chapter.title}</h2>
            {#if chapter.illustration}
              <StoryArt {story} file={chapter.illustration} alt={chapter.illustrationAlt ?? ''} caption={chapter.illustrationCaption ?? ''} />
            {/if}
            <div class="text" bind:this={textEl}>
              {#each chapter.text as para, i}
                <p data-p={i}>{para}</p>
                {#each (chapter.scenes ?? []).filter((sc) => sc.after === i + 1) as sc (sc.illustration)}
                  <StoryArt {story} file={sc.illustration} alt={sc.illustrationAlt ?? ''} caption={sc.illustrationCaption ?? ''} />
                {/each}
              {/each}
            </div>
            {#if chapter.rest}<p class="rest"><Icon name="moon" size={16} /> A good place to rest. Your place is saved.</p>{/if}
          {:else}
            <div class="end">
              <p class="eyebrow">The End</p>
              <h2>Sweet dreams.</h2>
              <p class="blurb">Thank you for reading {story.manifest.name}.</p>
              <div class="end-actions">
                <Button variant="soft" icon="refresh" onclick={() => go(0)}>Read it again</Button>
                <Button variant="primary" icon="bookOpen" onclick={() => navigate({ name: 'stories' })}>More stories</Button>
              </div>
            </div>
          {/if}
        </div>
      {/key}
    </article>

    <nav class="pager" aria-label="Chapters">
      <Button variant="ghost" icon="chevronLeft" disabled={page === 0} onclick={() => go(page - 1)}>Previous</Button>
      <div class="dots" aria-hidden="true">
        {#if total <= 14}
          {#each story.manifest.chapters as _, i}<i class:on={i === page} class:past={i < page}></i>{/each}
          <i class="last" class:on={atEnd}></i>
        {:else}
          <span class="bar-track"><span class="bar-fill" style="width:{percent}%"></span></span>
        {/if}
      </div>
      {#if !atEnd}
        <Button variant="primary" onclick={() => go(page + 1)}>{page === total - 1 ? 'Finish' : 'Next'}</Button>
      {:else}
        <span class="spacer"></span>
      {/if}
    </nav>
  {/if}
</div>

<style>
  .reader {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .bar {
    width: 100%;
    max-width: 780px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 14px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .tool {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: 999px;
    font-weight: 800;
    color: var(--ink-soft);
    background: var(--panel-strong);
    box-shadow: var(--shadow-s);
  }
  .tool:hover {
    color: var(--ink);
  }
  .tool.on {
    color: var(--c-violet);
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
  }
  .tool :global(svg) {
    flex: none;
  }
  .tool[aria-label*='favorites'].on :global(svg),
  .tool[aria-label*='Remove'].on :global(svg) {
    fill: var(--pink-deep);
    color: var(--pink-deep);
  }
  .size {
    display: inline-flex;
    background: var(--panel-strong);
    border-radius: 999px;
    box-shadow: var(--shadow-s);
    overflow: hidden;
  }
  .size button {
    padding: 6px 16px;
    font-weight: 900;
    font-family: Georgia, 'Times New Roman', serif;
    color: var(--ink);
  }
  .size button:disabled {
    opacity: 0.35;
  }
  .size button:not(:disabled):hover {
    background: var(--lilac);
  }
  .toc {
    width: 100%;
    max-width: 780px;
    margin-bottom: 14px;
    padding: 8px;
    max-height: 280px;
    overflow-y: auto;
    border-radius: var(--radius-l);
    background: var(--panel-strong);
    box-shadow: var(--shadow-m);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .toc button {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 9px 14px;
    border-radius: 14px;
    font-weight: 700;
    color: var(--ink);
  }
  .toc button:hover {
    background: rgb(var(--w) / 0.7);
  }
  .toc button.cur {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .toc .part {
    margin: 8px 14px 2px;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .panel {
    width: 100%;
    max-width: 780px;
    margin-bottom: 14px;
    padding: 14px 16px;
    border-radius: var(--radius-l);
    background: var(--panel-strong);
    box-shadow: var(--shadow-m);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .add {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .add input {
    flex: 1;
    min-width: 180px;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgb(var(--w) / 0.8);
    color: var(--ink);
    font: inherit;
  }
  .marks {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 260px;
    overflow-y: auto;
  }
  .marks li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .marks .go {
    flex: 1;
    min-width: 0;
    text-align: left;
    padding: 8px 14px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    color: var(--ink);
  }
  .marks .go:hover {
    background: rgb(var(--w) / 0.7);
  }
  .marks .go span {
    color: var(--ink-soft);
    font-size: 0.88rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .marks .rm {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
  }
  .marks .rm:hover {
    background: rgb(var(--w) / 0.8);
    color: var(--ink);
  }
  .durations {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .left {
    margin: -4px 0 10px;
    color: var(--ink-soft);
    font-size: 0.88rem;
    font-weight: 700;
  }
  .rest {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 22px 0 4px;
    padding: 10px 16px;
    border-radius: 999px;
    background: rgb(var(--w) / 0.55);
    color: var(--ink-soft);
    font-weight: 700;
  }
  /* Sleep mode: dimmer page, no page-turn motion. */
  .reader.sleep {
    filter: brightness(0.74) saturate(0.85);
  }
  .reader.sleep .turn {
    animation: none;
  }
  .toc .n {
    width: 26px;
    flex: none;
    color: var(--ink-soft);
    font-weight: 800;
    text-align: right;
  }
  .toc .t {
    flex: 1;
    min-width: 0;
  }
  .paper {
    width: 100%;
    max-width: 780px;
    background: var(--panel-strong);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.9);
    border-top: 6px solid var(--accent);
    padding: clamp(22px, 5vw, 52px) clamp(20px, 6vw, 64px) clamp(26px, 5vw, 56px);
  }
  .title {
    font-size: 1.15rem;
    color: var(--ink-soft);
    font-weight: 800;
    margin-bottom: 18px;
  }
  .paper h2 {
    font-size: 1.9rem;
    margin: 4px 0 20px;
  }
  .turn {
    animation: turn 0.45s var(--ease);
  }
  @keyframes turn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .text p {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: calc(1.1rem * var(--fs));
    line-height: 1.85;
    color: var(--ink);
    margin: 0 0 1.05em;
    padding: 2px 10px;
    margin-left: -10px;
    margin-right: -10px;
    border-radius: 14px;
    text-wrap: pretty;
    overflow-wrap: anywhere;
    transition:
      background 0.5s var(--ease),
      box-shadow 0.5s var(--ease);
  }
  .text p:first-of-type::first-letter {
    font-size: 1.9em;
    font-weight: 700;
    color: var(--accent);
    filter: brightness(0.8);
    float: left;
    line-height: 0.95;
    padding: 4px 8px 0 0;
  }
  .end {
    text-align: center;
    padding: 30px 0 14px;
  }
  .blurb {
    color: var(--ink-soft);
    font-size: 1.05rem;
    margin-bottom: 24px;
  }
  .end-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .pager {
    width: 100%;
    max-width: 780px;
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .spacer {
    width: 1px;
  }
  .dots {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .dots i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(140, 130, 190, 0.28);
    transition: all 0.25s var(--ease);
  }
  .dots i.past {
    background: rgba(140, 130, 190, 0.6);
  }
  .dots i.on {
    width: 26px;
    border-radius: 999px;
    background: var(--lavender-deep);
  }
  .bar-track {
    display: block;
    width: 160px;
    height: 8px;
    border-radius: 999px;
    background: rgba(140, 130, 190, 0.28);
    overflow: hidden;
  }
  .bar-fill {
    display: block;
    height: 100%;
    background: var(--lavender-deep);
    border-radius: 999px;
    transition: width 0.4s var(--ease);
  }
  @media (max-width: 900px) {
    .paper h2 {
      font-size: 1.5rem;
    }
    .tool.wide span {
      display: none;
    }
  }
</style>
