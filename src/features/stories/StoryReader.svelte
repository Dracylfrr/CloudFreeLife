<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { navigate, onBeforeLeave } from '../../core/router';
  import { findStory } from '../../core/content/registry';
  import { settings, updateSettings, motionReduced } from '../../core/settings';
  import { storyProgress, saveStoryPlace, saveStoryParagraph, setFavorite, isFavorite, flushStoryProgress } from './progress';
  import { ReadAloud, TONES, type Tone } from './readAloud';
  import StoryArt from './StoryArt.svelte';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Select from '../../ui/Select.svelte';
  import Slider from '../../ui/Slider.svelte';
  import Toggle from '../../ui/Toggle.svelte';
  import { sfx, setNarrating } from '../../core/audio';

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
  let listenOpen = $state(false);
  let speaking = $state(-1); // paragraph being spoken, -1 when none
  let pendingPlay = false;
  let restorePara = untrack(() => (saved && !saved.finished ? saved.para : 0));

  const atEnd = $derived(page >= total);
  const chapter = $derived(story && !atEnd ? story.manifest.chapters[page] : null);
  const favorite = $derived(isFavorite($storyProgress, 'story', sid));
  const percent = $derived(total ? Math.round((Math.min(page, total) / total) * 100) : 0);

  // ---- Read Aloud ------------------------------------------------------
  const ra = new ReadAloud({
    onParagraph: (i) => {
      speaking = i;
      saveStoryParagraph(sid, i);
      void tick().then(() => keepInView(i));
    },
    onFinish: () => {
      speaking = -1;
      if (get(settings).ttsAutoNext && page < total - 1) go(page + 1, true);
    }
  });
  const rs = ra.state;
  const playing = $derived($rs.status === 'playing');
  const paused = $derived($rs.status === 'paused');

  // Background music and ambience step back while a story is being narrated.
  $effect(() => {
    setNarrating(playing);
    return () => setNarrating(false);
  });

  $effect(() => {
    ra.setRate($settings.ttsRate);
    ra.setVoice($settings.ttsVoice);
    ra.setTone($settings.ttsTone);
  });

  // A new chapter hands its paragraphs to the narrator (this also stops the old narration).
  $effect(() => {
    const paras = chapter?.text ?? [];
    const start = untrack(() => restorePara);
    ra.setText(paras, start);
    speaking = -1;
    if (pendingPlay && paras.length) {
      pendingPlay = false;
      ra.play(0);
    }
  });

  /** Scrolls a paragraph into view only when it has left the comfortable middle of the page. */
  function keepInView(i: number) {
    const el = textEl?.querySelectorAll<HTMLElement>('p[data-p]')[i];
    if (!el || !scroller) return;
    const box = scroller.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const margin = Math.min(120, box.height * 0.2);
    if (r.top >= box.top + margin && r.bottom <= box.bottom - margin) return;
    el.scrollIntoView({ block: 'center', behavior: motionReduced() ? 'auto' : 'smooth' });
  }

  function listenFrom(i: number) {
    if (!listenOpen) return;
    ra.play(i);
  }

  function changeVoice(uri: string) {
    updateSettings({ ttsVoice: uri });
  }

  // ---- Navigation --------------------------------------------------------
  function go(next: number, keepListening = false) {
    if (!story) return;
    const wasPlaying = keepListening || get(ra.state).status === 'playing';
    page = Math.max(0, Math.min(total, next));
    restorePara = 0;
    pendingPlay = wasPlaying && page < total;
    if (page >= total) saveStoryPlace(sid, 0, true);
    else saveStoryPlace(sid, page, false);
    tocOpen = false;
    scroller?.scrollTo({ top: 0 });
    sfx.pageTurn();
  }

  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape' && tocOpen) {
      tocOpen = false;
      return;
    }
    if (e.shiftKey && listenOpen && e.key === 'ArrowRight') {
      e.preventDefault();
      ra.next();
    } else if (e.shiftKey && listenOpen && e.key === 'ArrowLeft') {
      e.preventDefault();
      ra.prev();
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1);
    else if (e.key === ' ' && listenOpen && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      ra.toggle();
    }
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
      if (get(ra.state).status === 'idle') saveStoryParagraph(sid, idx);
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
    const stop = () => ra.destroy();
    window.addEventListener('pagehide', stop);
    const off = onBeforeLeave(() => {
      ra.destroy();
      return flushStoryProgress();
    });
    return () => {
      window.removeEventListener('pagehide', stop);
      off();
    };
  });
  onDestroy(() => {
    ra.destroy();
    if (scrollTimer) clearTimeout(scrollTimer);
  });

  const speeds = [0.75, 1, 1.25, 1.5];
  const toneOptions = TONES.map((t) => ({ value: t.id, label: t.label }));
  const voiceOptions = $derived([{ value: '', label: 'System default' }, ...$rs.voices.map((v) => ({ value: v.uri, label: v.name }))]);
  const intro = $derived(story && page === 0 && !!story.manifest.illustration && !story.manifest.chapters[0]?.illustration);
</script>

<svelte:window onkeydown={key} />

<div class="page reader" bind:this={scroller} onscroll={onScroll}>
  {#if !story}
    <p>This story isn't available.</p>
    <Button onclick={() => navigate({ name: 'stories' })}>Back to stories</Button>
  {:else}
    <header class="bar">
      <button class="back" onclick={() => navigate({ name: 'stories' })}><Icon name="chevronLeft" size={18} /> Stories</button>
      <div class="tools">
        <button class="tool" class:on={favorite} aria-pressed={favorite} aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'} title={favorite ? 'Favorite' : 'Add to favorites'} onclick={() => setFavorite('story', sid, !favorite)}>
          <Icon name="heart" size={18} />
        </button>
        <button class="tool wide" class:on={listenOpen} aria-pressed={listenOpen} onclick={() => { listenOpen = !listenOpen; if (!listenOpen) ra.stop(); }}>
          <Icon name="headphones" size={18} /> <span>Read Aloud</span>
        </button>
        <button class="tool wide" class:on={tocOpen} aria-expanded={tocOpen} onclick={() => (tocOpen = !tocOpen)}>
          <Icon name="list" size={18} /> <span>Chapters</span>
        </button>
        <div class="size" role="group" aria-label="Text size">
          <button onclick={smaller} aria-label="Smaller text" title="Smaller text" disabled={$settings.storyFontScale <= 0.91}>A<small>−</small></button>
          <button onclick={bigger} aria-label="Larger text" title="Larger text" disabled={$settings.storyFontScale >= 1.69}>A<small>+</small></button>
        </div>
      </div>
    </header>

    {#if tocOpen}
      <nav class="toc" aria-label="Chapters">
        {#each story.manifest.chapters as c, i}
          <button class:cur={i === page} onclick={() => go(i)}>
            <span class="n">{i + 1}</span>
            <span class="t">{c.title}</span>
            {#if saved?.finished || i < page}<Icon name="check" size={15} />{/if}
          </button>
        {/each}
      </nav>
    {/if}

    {#if listenOpen && $rs.supported}
      <!-- The playback controls stay on screen while you read, so Pause is always one click away. -->
      <div class="dock">
        <div class="transport" role="group" aria-label="Read Aloud controls">
          <button class="t" aria-label="Previous paragraph" title="Previous paragraph (Shift+Left)" onclick={() => ra.prev()}><Icon name="skipBack" size={18} /></button>
          {#if playing}
            <button class="t main" aria-label="Pause" title="Pause (Space)" onclick={() => ra.pause()}><Icon name="pause" size={22} /><span>Pause</span></button>
          {:else if paused}
            <button class="t main" aria-label="Resume" title="Resume (Space)" onclick={() => ra.resume()}><Icon name="play" size={22} /><span>Resume</span></button>
          {:else}
            <button class="t main" aria-label="Play" title="Play (Space)" disabled={atEnd} onclick={() => ra.play()}><Icon name="play" size={22} /><span>Play</span></button>
          {/if}
          <button class="t" aria-label="Stop" title="Stop" disabled={!playing && !paused} onclick={() => { ra.stop(); speaking = -1; }}><Icon name="stop" size={18} /></button>
          <button class="t" aria-label="Next paragraph" title="Next paragraph (Shift+Right)" onclick={() => ra.next()}><Icon name="skipForward" size={18} /></button>
          <span class="state" aria-live="polite">{playing ? 'Reading…' : paused ? 'Paused' : 'Ready'}</span>
        </div>
      </div>
    {/if}

    {#if listenOpen}
      <section class="listen" aria-label="Read Aloud">
        {#if !$rs.supported}
          <p class="nospeech"><Icon name="info" size={18} /> Read Aloud isn't available with the current system voice configuration. You can keep reading as normal.</p>
        {:else}
          <div class="opts">
            <Select label="Voice" value={$settings.ttsVoice} options={voiceOptions} onchange={changeVoice} />
            <Select label="Tone" value={$settings.ttsTone} options={toneOptions} onchange={(v) => updateSettings({ ttsTone: v as Tone })} />
            <div class="speed">
              <span class="lab">Speed</span>
              <div class="chips" role="radiogroup" aria-label="Reading speed">
                {#each speeds as sp}
                  <button class="chip" class:on={Math.abs($settings.ttsRate - sp) < 0.01} role="radio" aria-checked={Math.abs($settings.ttsRate - sp) < 0.01} onclick={() => updateSettings({ ttsRate: sp })}>{sp}×</button>
                {/each}
              </div>
            </div>
          </div>
          <Slider label="Fine speed" value={$settings.ttsRate} min={0.75} max={1.5} step={0.05} format={(v) => `${v.toFixed(2)}×`} onchange={(v) => updateSettings({ ttsRate: v })} />
          <div class="toggles">
            <Toggle label="Highlight the paragraph being read" checked={$settings.ttsHighlight} onchange={(v) => updateSettings({ ttsHighlight: v })} />
            <Toggle label="Keep reading into the next chapter" checked={$settings.ttsAutoNext} onchange={(v) => updateSettings({ ttsAutoNext: v })} />
          </div>
          {#if $rs.error}<p class="nospeech"><Icon name="info" size={18} /> {$rs.error}</p>{/if}
        {/if}
      </section>
    {/if}

    <article class="paper" style="--fs:{$settings.storyFontScale}; --accent:{story.manifest.accent ?? '#b7a8ec'}">
      {#if intro && story.manifest.illustration}
        <StoryArt {story} file={story.manifest.illustration} alt={story.manifest.illustrationAlt ?? ''} caption={story.manifest.illustrationCaption ?? ''} wide />
      {/if}
      <h1 class="title">{story.manifest.name}</h1>
      {#key page}
        <div class="turn">
          {#if chapter}
            <p class="eyebrow">Chapter {page + 1} of {total} · {percent}%</p>
            <h2>{chapter.title}</h2>
            {#if chapter.illustration}
              <StoryArt {story} file={chapter.illustration} alt={chapter.illustrationAlt ?? ''} caption={chapter.illustrationCaption ?? ''} />
            {/if}
            <div class="text" bind:this={textEl}>
              {#each chapter.text as para, i}
                {#if listenOpen && $rs.supported}
                  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
                  <p data-p={i} class:speaking={$settings.ttsHighlight && speaking === i} class:seekable={true} onclick={() => listenFrom(i)} title="Read from here">{para}</p>
                {:else}
                  <p data-p={i} class:speaking={$settings.ttsHighlight && speaking === i}>{para}</p>
                {/if}
                {#each (chapter.scenes ?? []).filter((sc) => sc.after === i + 1) as sc (sc.illustration)}
                  <StoryArt {story} file={sc.illustration} alt={sc.illustrationAlt ?? ''} caption={sc.illustrationCaption ?? ''} />
                {/each}
              {/each}
            </div>
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
  .listen {
    width: 100%;
    max-width: 780px;
    margin-bottom: 16px;
    padding: 16px 20px 12px;
    border-radius: var(--radius-l);
    background: var(--panel-strong);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.9);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .dock {
    position: sticky;
    top: 0;
    z-index: 6;
    width: 100%;
    max-width: 780px;
    margin: 0 0 12px;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--panel-strong);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.9);
  }
  .transport {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .t {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink);
    background: rgb(var(--w) / 0.7);
    box-shadow: var(--shadow-s);
  }
  .t:hover:not(:disabled) {
    background: var(--lilac);
  }
  .t:disabled {
    opacity: 0.4;
  }
  .t.main {
    width: auto;
    min-width: 52px;
    height: 44px;
    padding: 0 18px 0 14px;
    border-radius: 999px;
    grid-auto-flow: column;
    gap: 8px;
    font-weight: 800;
    color: var(--g-ink);
    background: linear-gradient(135deg, var(--g1), var(--g2));
  }
  .state {
    margin-left: 8px;
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.9rem;
  }
  .opts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    align-items: end;
  }
  .lab {
    display: block;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin-bottom: 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .speed {
    min-width: 0;
  }
  .chip {
    padding: 8px 11px;
    border-radius: 12px;
    font-weight: 800;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.6);
    border: 2px solid transparent;
  }
  .chip.on {
    color: var(--ink);
    border-color: var(--lavender-deep);
  }
  .toggles {
    display: flex;
    flex-direction: column;
  }
  .nospeech {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgb(var(--w) / 0.6);
    color: var(--ink-soft);
    font-weight: 700;
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
  .text p.seekable {
    cursor: pointer;
  }
  .text p.seekable:hover {
    background: rgb(var(--w) / 0.35);
  }
  .text p.speaking {
    background: color-mix(in srgb, var(--lavender-deep) 16%, transparent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--lavender-deep) 10%, transparent);
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
