<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { navigate, onBeforeLeave } from '../../core/router';
  import { findAdventure } from '../../core/content/registry';
  import { settings, updateSettings } from '../../core/settings';
  import { storyProgress, saveAdventurePath, recordEnding, flushStoryProgress } from './progress';
  import { back, canGoBack, choose, currentId, currentNode, isEnding, listEndings, restoreRun, startRun, type AdventureRun } from './engine';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';
  import MyAvatar from '../avatar/MyAvatar.svelte';
  import ListenBar from '../voices/ListenBar.svelte';
  import { listenState } from '../voices/player';
  import { hasAvatar, openAvatarEditor } from '../avatar/state';

  let { adventureId }: { adventureId: string } = $props();
  const aid = untrack(() => adventureId);
  const adv = findAdventure(aid)?.manifest;

  const saved = get(storyProgress).adventures[aid];
  const restored = adv ? restoreRun(adv, saved?.path) : { path: [] };
  // A finished run starts over; an unfinished one continues where it stopped.
  const first: AdventureRun = adv ? (isEnding(adv, restored) ? startRun(adv) : restored) : { path: [] };
  let run = $state<AdventureRun>(first);
  let showResume = $state(first.path.length > 1);
  let scroller: HTMLDivElement | undefined = $state();

  const node = $derived(adv ? currentNode(adv, run) : undefined);
  const ending = $derived(node?.ending);
  const endings = $derived(adv ? listEndings(adv) : []);
  const found = $derived($storyProgress.adventures[aid]?.endings ?? []);
  const step = $derived(run.path.length);
  // when listening, the choices are read after the passage
  const choiceLines = $derived((node?.choices ?? []).map((c, i) => `Choice ${i + 1}. ${c.text}.`));

  async function commit(next: AdventureRun) {
    run = next;
    showResume = false;
    if (!adv) return;
    saveAdventurePath(aid, next.path);
    if (isEnding(adv, next)) {
      recordEnding(aid, currentId(next));
      sfx.chime();
    } else sfx.pageTurn();
    await tick();
    scroller?.scrollTo({ top: 0 });
  }

  const pick = (i: number) => adv && commit(choose(adv, run, i));
  const undo = () => canGoBack(run) && commit(back(run));
  const again = () => adv && commit(startRun(adv));

  function key(e: KeyboardEvent) {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key >= '1' && e.key <= '4') pick(Number(e.key) - 1);
    else if (e.key === 'Backspace' || e.key === 'ArrowLeft') undo();
  }

  const bigger = () => updateSettings({ storyFontScale: Math.min(1.7, +($settings.storyFontScale + 0.1).toFixed(2)) });
  const smaller = () => updateSettings({ storyFontScale: Math.max(0.9, +($settings.storyFontScale - 0.1).toFixed(2)) });

  onMount(() => {
    if (adv && !saved) saveAdventurePath(aid, run.path);
    return onBeforeLeave(flushStoryProgress);
  });
</script>

<svelte:window onkeydown={key} />

<div class="page player" bind:this={scroller}>
  {#if !adv}
    <p>This adventure isn't available.</p>
    <Button onclick={() => navigate({ name: 'adventures' })}>Back to adventures</Button>
  {:else}
    <header class="bar">
      <button class="back" onclick={() => navigate({ name: 'adventures' })}><Icon name="chevronLeft" size={18} /> Story Adventures</button>
      <div class="tools">
        <div class="size" role="group" aria-label="Text size">
          <button onclick={smaller} aria-label="Smaller text" title="Smaller text" disabled={$settings.storyFontScale <= 0.91}>A<small>−</small></button>
          <button onclick={bigger} aria-label="Larger text" title="Larger text" disabled={$settings.storyFontScale >= 1.69}>A<small>+</small></button>
        </div>
      </div>
    </header>

    <article class="paper" style="--fs:{$settings.storyFontScale}; --accent:{adv.accent ?? '#b7a8ec'}">
      <div class="meta">
        {#if adv.protagonist === 'hero'}
          <button class="you" onclick={openAvatarEditor} title={hasAvatar($settings) ? 'This is you. Click to change your avatar.' : 'Choose your avatar'} aria-label={hasAvatar($settings) ? 'Change your avatar' : 'Choose your avatar'}>
            <MyAvatar size={48} />
          </button>
        {/if}
        <h1 class="title">{adv.name}</h1>
        <span class="who">{adv.protagonist === 'hero' ? 'You are the hero' : `${adv.hero ? `${adv.hero} · ` : ''}${adv.protagonist === 'girl' ? "Girl's perspective" : "Guy's perspective"}`}</span>
      </div>
      {#if showResume}
        <p class="resume">Welcome back. We saved your place.</p>
      {/if}

      {#if node}
        <ListenBar storyId={aid} title={adv.name} cast={adv.cast} paragraphs={node.text} extras={choiceLines} unit={currentId(run)} />
        {#key currentId(run)}
          <div class="text" class:end={!!ending}>
            {#if ending}
              <p class="eyebrow">The End · {found.length} of {endings.length} endings found</p>
              <h2 class="ending-title mood-{ending.mood}">{ending.title}</h2>
            {/if}
            {#each node.text as para, i}
              <p data-listen-para={i} class:reading={$listenState.status !== 'idle' && $listenState.para === i}>{para}</p>
            {/each}
          </div>
        {/key}

        {#if node.choices}
          <div class="choices" role="group" aria-label="What do you do?">
            {#each node.choices as c, i}
              <button class="choice" class:reading={$listenState.status !== 'idle' && $listenState.para === node.text.length + i} data-listen-para={node.text.length + i} onclick={() => pick(i)}>
                <span class="num">{i + 1}</span>
                <span class="label">{c.text}</span>
              </button>
            {/each}
          </div>
        {:else if ending}
          <section class="done" aria-label="The end">
            <p class="tally">You have found <b>{found.length}</b> of <b>{endings.length}</b> endings.</p>
            <ul class="endings">
              {#each endings as en}
                <li class:got={found.includes(en.id)} class:here={en.id === currentId(run)}>
                  <Icon name={found.includes(en.id) ? 'check' : 'sparkle'} size={14} />
                  <span>{found.includes(en.id) ? en.title : 'A hidden ending'}</span>
                </li>
              {/each}
            </ul>
            <div class="end-actions">
              <Button variant="ghost" icon="undo" disabled={!canGoBack(run)} onclick={undo}>Change my last choice</Button>
              <Button variant="soft" icon="refresh" onclick={again}>Start over</Button>
              <Button variant="primary" icon="compass" onclick={() => navigate({ name: 'adventures' })}>More adventures</Button>
            </div>
          </section>
        {/if}
      {/if}
    </article>

    {#if !ending}
      <nav class="foot" aria-label="Story controls">
        <Button variant="ghost" size="sm" icon="undo" disabled={!canGoBack(run)} onclick={undo}>Step back</Button>
        <span class="steps">Passage {step}</span>
        <Button variant="ghost" size="sm" icon="refresh" disabled={!canGoBack(run)} onclick={again}>Start over</Button>
      </nav>
    {/if}
  {/if}
</div>

<style>
  .player {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .bar,
  .paper,
  .foot {
    width: 100%;
    max-width: 780px;
  }
  .bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 800;
    color: var(--lavender-deep);
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
  .paper {
    background: var(--panel-strong);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.9);
    border-top: 6px solid var(--accent);
    padding: clamp(22px, 5vw, 48px) clamp(20px, 6vw, 60px) clamp(24px, 5vw, 44px);
  }
  .you {
    border-radius: 50%;
    align-self: center;
    transition: transform 0.2s var(--ease);
  }
  .you:hover {
    transform: scale(1.07) rotate(-3deg);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px 16px;
    margin-bottom: 18px;
  }
  .title {
    font-size: 1.15rem;
    color: var(--ink-soft);
    font-weight: 800;
  }
  .who {
    font-size: 0.78rem;
    font-weight: 800;
    padding: 3px 12px;
    border-radius: 999px;
    background: var(--lilac);
    color: var(--c-violet);
  }
  .resume {
    color: var(--ink-soft);
    font-style: italic;
    margin-bottom: 14px;
  }
  .text p.reading {
    background: rgb(var(--w) / 0.55);
    border-radius: 14px;
    box-shadow: inset 4px 0 0 var(--accent);
  }
  .text p {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: calc(1.1rem * var(--fs));
    line-height: 1.85;
    color: var(--ink);
    margin: 0 0 1.05em;
    text-wrap: pretty;
    overflow-wrap: anywhere;
  }
  .text {
    animation: rise 0.45s var(--ease) both;
  }
  :global([data-motion='reduced']) .text {
    animation: none;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .ending-title {
    font-size: 2rem;
    margin: 2px 0 16px;
    padding: 6px 0;
    background: linear-gradient(110deg, var(--hero-a), var(--hero-b) 60%, var(--hero-c));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .mood-happy {
    background-image: linear-gradient(110deg, #e0a23d, #f08a7a);
  }
  .mood-sweet {
    background-image: linear-gradient(110deg, #e0708f, #c07ad8);
  }
  .mood-funny {
    background-image: linear-gradient(110deg, #3fae8a, #6fb4e6);
  }
  .mood-dreamy {
    background-image: linear-gradient(110deg, #7a7bd8, #b78bdc);
  }
  .mood-cozy {
    background-image: linear-gradient(110deg, #e0956a, #d9779a);
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 22px;
  }
  .choice {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    text-align: left;
    padding: 14px 18px;
    border-radius: 22px;
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    border: 1.5px solid rgba(150, 140, 200, 0.28);
    box-shadow: var(--shadow-s);
    font-weight: 700;
    font-size: calc(1rem * var(--fs));
    color: var(--ink);
    transition:
      transform 0.2s var(--ease),
      box-shadow 0.2s var(--ease),
      border-color 0.2s;
  }
  .choice:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-m);
    border-color: var(--lavender-deep);
  }
  .choice.reading {
    border-color: var(--lavender-deep);
    box-shadow:
      inset 5px 0 0 var(--accent),
      var(--shadow-m);
  }
  .choice:active {
    transform: scale(0.99);
  }
  .num {
    flex: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--surface);
    color: var(--lavender-deep);
    font-weight: 900;
    box-shadow: var(--shadow-s);
  }
  .label {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .done {
    margin-top: 12px;
    padding-top: 18px;
    border-top: 2px dashed rgba(140, 130, 190, 0.25);
  }
  .tally {
    color: var(--ink-soft);
    margin-bottom: 10px;
  }
  .endings {
    list-style: none;
    margin: 0 0 20px;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .endings li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 800;
    background: rgba(140, 130, 190, 0.12);
    color: var(--ink-faint);
  }
  .endings li.got {
    background: var(--mint);
    color: var(--c-green);
  }
  .endings li.here {
    outline: 2.5px solid var(--lavender-deep);
  }
  .end-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .foot {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .steps {
    color: var(--ink-faint);
    font-weight: 800;
    font-size: 0.85rem;
  }
  @media (max-width: 900px) {
    .ending-title {
      font-size: 1.6rem;
    }
  }
</style>
