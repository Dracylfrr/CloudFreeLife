<script lang="ts">
  import { navigate, route, sectionOf, type NavSection } from '../core/router';
  import { APP_VERSION } from '../core/version';
  import { updateState } from '../features/updates/updater';
  import { settings, updateSettings } from '../core/settings';
  import Icon from './Icon.svelte';
  import MyAvatar from '../features/avatar/MyAvatar.svelte';
  import { hasAvatar, openAvatarEditor } from '../features/avatar/state';
  import { BRAND_FULL, BRAND_NAME, BRAND_SUBTITLE } from '../core/brand';

  type Item = { id: NavSection; label: string; icon: string; go: () => void };
  const home: Item = { id: 'home', label: 'Home', icon: 'home', go: () => navigate({ name: 'home' }) };
  const explore: Item[] = [
    { id: 'books', label: 'Coloring Books', icon: 'book', go: () => navigate({ name: 'books' }) },
    { id: 'draw', label: 'Free Draw', icon: 'brush', go: () => navigate({ name: 'draw' }) },
    { id: 'stories', label: 'Cozy Stories', icon: 'bookOpen', go: () => navigate({ name: 'stories' }) },
    { id: 'adventures', label: 'Story Adventures', icon: 'compass', go: () => navigate({ name: 'adventures' }) },
    { id: 'minigames', label: 'Games', icon: 'gamepad', go: () => navigate({ name: 'minigames' }) },
    { id: 'meditation', label: 'Meditation', icon: 'leaf', go: () => navigate({ name: 'meditation' }) },
    { id: 'movement', label: 'Exercise', icon: 'stretch', go: () => navigate({ name: 'movement' }) },
    { id: 'gallery', label: 'Gallery', icon: 'image', go: () => navigate({ name: 'gallery' }) }
  ];
  const controls: Item[] = [
    { id: 'updates', label: 'Updates', icon: 'cloudDown', go: () => navigate({ name: 'updates' }) },
    { id: 'settings', label: 'Settings', icon: 'sliders', go: () => navigate({ name: 'settings' }) },
    { id: 'about', label: 'About', icon: 'info', go: () => navigate({ name: 'about' }) }
  ];
  const groups = [
    { id: 'explore', label: 'Explore', items: explore },
    { id: 'controls', label: 'App controls', items: controls }
  ];
  const active = $derived(sectionOf($route));
  const hasUpdate = $derived($updateState.available.length > 0);

  // Each group can be folded away; the choice is remembered on this computer. The group that
  // holds the page you are on always stays open.
  const KEY = 'cloud-freelife-nav-folded';
  function loadFolded(): string[] {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
  let folded = $state<string[]>(loadFolded());
  const isFolded = (g: { id: string; items: Item[] }) => folded.includes(g.id) && !g.items.some((i) => i.id === active);
  function toggle(id: string) {
    folded = folded.includes(id) ? folded.filter((x) => x !== id) : [...folded, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(folded));
    } catch {
      /* remembering the fold is optional */
    }
  }
</script>

<nav class="side" aria-label="Main navigation">
  <div class="brand">
    <button class="me" onclick={openAvatarEditor} aria-label={hasAvatar($settings) ? 'Change your avatar' : 'Choose your avatar'} title={hasAvatar($settings) ? 'Change your avatar' : 'Choose your avatar'}>
      <MyAvatar size={50} />
    </button>
    <button class="title" onclick={() => navigate({ name: 'home' })} aria-label="{BRAND_FULL}, home">
      <span class="name">{BRAND_NAME}</span>
      <span class="sub">{BRAND_SUBTITLE}</span>
    </button>
  </div>
  <div class="list">
    <ul class="top">
      <li>
        <button class="item" class:on={active === home.id} title={home.label} aria-label={home.label} aria-current={active === home.id ? 'page' : undefined} onclick={home.go}>
          <Icon name={home.icon} size={21} />
          <span>{home.label}</span>
        </button>
      </li>
    </ul>
    {#each groups as g (g.id)}
      {@const shut = isFolded(g)}
      <section class="group" class:shut aria-label={g.label}>
        <button class="head" aria-expanded={!shut} aria-controls="nav-{g.id}" onclick={() => toggle(g.id)}>
          <span>{g.label}</span>
          {#if g.id === 'controls' && hasUpdate && shut}<i class="dot small" title="Update available"></i>{/if}
          <Icon name="chevronRight" size={15} />
        </button>
        <ul id="nav-{g.id}" hidden={shut}>
          {#each g.items as it}
            <li>
              <button class="item" class:on={active === it.id} title={it.label} aria-label={it.label} aria-current={active === it.id ? 'page' : undefined} onclick={it.go}>
                <Icon name={it.icon} size={21} />
                <span>{it.label}</span>
                {#if it.id === 'updates' && hasUpdate}<i class="dot" title="Update available"></i>{/if}
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
  <button
    class="quick"
    aria-pressed={$settings.musicOn}
    aria-label={$settings.musicOn ? 'Turn background music off' : 'Turn background music on'}
    title={$settings.musicOn ? 'Background music is on' : 'Background music is off'}
    onclick={() => updateSettings({ musicOn: !$settings.musicOn })}
  >
    <Icon name={$settings.musicOn && !$settings.muted ? 'volume' : 'mute'} size={19} />
    <span>{$settings.musicOn ? 'Music on' : 'Music off'}</span>
  </button>
  <div class="foot">v{APP_VERSION}</div>
</nav>

<style>
  .side {
    width: 252px;
    flex: none;
    margin: 18px 0 18px 18px;
    padding: 20px 14px 16px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.8);
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 2;
  }
  .brand {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 10px;
    row-gap: 8px;
    padding: 2px 6px 10px;
    text-align: left;
    border-bottom: 1px solid var(--line);
  }
  .me {
    border-radius: 50%;
    transition: transform 0.2s var(--ease);
  }
  .me:hover {
    transform: scale(1.06) rotate(-3deg);
  }
  .title {
    display: flex;
    flex-direction: column;
    gap: 1px;
    text-align: left;
    border-radius: 12px;
    min-width: 0;
  }
  .name {
    font-weight: 900;
    font-size: 1.02rem;
    line-height: 1.1;
    letter-spacing: -0.01em;
    white-space: nowrap;
    background: linear-gradient(120deg, var(--brand-a), var(--brand-b));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .sub {
    font-weight: 800;
    font-size: 0.8rem;
    color: var(--ink-soft);
    letter-spacing: 0.02em;
  }
  .list {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  ul[hidden] {
    display: none;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 4px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 4px 16px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    text-align: left;
    border-radius: 12px;
  }
  .head span {
    flex: 1;
  }
  .head:hover {
    color: var(--ink-soft);
  }
  .head :global(svg) {
    transition: transform 0.2s var(--ease);
    transform: rotate(90deg);
  }
  .group.shut .head :global(svg) {
    transform: none;
  }
  .dot.small {
    margin-left: 0;
    width: 8px;
    height: 8px;
    box-shadow: 0 0 0 3px rgba(92, 199, 154, 0.28);
  }
  .item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 9px 16px;
    border-radius: 16px;
    font-weight: 700;
    color: var(--ink-soft);
    transition:
      background 0.2s,
      color 0.2s,
      transform 0.2s var(--ease);
    text-align: left;
    position: relative;
  }
  .item:hover {
    background: rgb(var(--w) / 0.8);
    color: var(--ink);
    transform: translateX(2px);
  }
  .item.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
    box-shadow: var(--shadow-s);
  }
  .dot {
    margin-left: auto;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #5cc79a;
    box-shadow: 0 0 0 4px rgba(92, 199, 154, 0.28);
  }
  .quick {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 16px;
    border-radius: 16px;
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.45);
  }
  .quick:hover {
    color: var(--ink);
    background: rgb(var(--w) / 0.8);
  }
  .quick[aria-pressed='true'] {
    color: var(--c-violet);
  }
  .foot {
    text-align: center;
    color: var(--ink-faint);
    font-size: 0.78rem;
    font-weight: 700;
  }
  /* Narrow window or large interface scale: icons only, so content keeps its room. */
  @media (max-width: 900px) {
    .side {
      width: 74px;
      padding: 16px 8px 12px;
      margin: 12px 0 12px 12px;
    }
    .brand {
      justify-content: center;
      padding: 2px 0 8px;
    }
    .name,
    .item span,
    .quick span,
    .foot,
    .head {
      display: none;
    }
    /* Icons only: groups are separated by a thin line and can't be folded. */
    ul[hidden] {
      display: flex;
    }
    .group {
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px solid rgb(var(--w) / 0.6);
    }
    .quick {
      justify-content: center;
      padding: 10px 0;
    }
    .item {
      justify-content: center;
      padding: 12px 0;
    }
    .dot {
      position: absolute;
      top: 8px;
      right: 10px;
      margin: 0;
    }
  }
</style>
