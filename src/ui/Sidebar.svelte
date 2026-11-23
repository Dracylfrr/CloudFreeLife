<script lang="ts">
  import { navigate, route, sectionOf, type NavSection } from '../core/router';
  import { APP_VERSION } from '../core/version';
  import { updateState } from '../features/updates/updater';
  import { settings, updateSettings } from '../core/settings';
  import Icon from './Icon.svelte';
  import Logo from './Logo.svelte';

  const items: { id: NavSection; label: string; icon: string; go: () => void }[] = [
    { id: 'home', label: 'Home', icon: 'home', go: () => navigate({ name: 'home' }) },
    { id: 'books', label: 'Coloring Books', icon: 'book', go: () => navigate({ name: 'books' }) },
    { id: 'draw', label: 'Free Draw', icon: 'brush', go: () => navigate({ name: 'draw' }) },
    { id: 'gallery', label: 'Gallery', icon: 'image', go: () => navigate({ name: 'gallery' }) },
    { id: 'stories', label: 'Stories', icon: 'bookOpen', go: () => navigate({ name: 'stories' }) },
    { id: 'minigames', label: 'Mini-Games', icon: 'gamepad', go: () => navigate({ name: 'minigames' }) },
    { id: 'updates', label: 'Updates', icon: 'cloudDown', go: () => navigate({ name: 'updates' }) },
    { id: 'settings', label: 'Settings', icon: 'sliders', go: () => navigate({ name: 'settings' }) },
    { id: 'about', label: 'About', icon: 'info', go: () => navigate({ name: 'about' }) }
  ];
  const active = $derived(sectionOf($route));
  const hasUpdate = $derived($updateState.available.length > 0);
</script>

<nav class="side" aria-label="Main navigation">
  <button class="brand" onclick={() => navigate({ name: 'home' })} aria-label="Cloud-Freelife home">
    <Logo size={46} />
    <span class="name">Cloud-<br />Freelife</span>
  </button>
  <ul>
    {#each items as it}
      <li>
        <button class="item" class:on={active === it.id} title={it.label} aria-label={it.label} aria-current={active === it.id ? 'page' : undefined} onclick={it.go}>
          <Icon name={it.icon} size={21} />
          <span>{it.label}</span>
          {#if it.id === 'updates' && hasUpdate}<i class="dot" title="Update available"></i>{/if}
        </button>
      </li>
    {/each}
  </ul>
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
    width: 236px;
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
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 10px 10px;
    text-align: left;
    border-radius: 20px;
  }
  .name {
    font-weight: 900;
    font-size: 1.12rem;
    line-height: 1.1;
    letter-spacing: -0.01em;
    background: linear-gradient(120deg, var(--brand-a), var(--brand-b));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
  }
  .item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 12px 16px;
    border-radius: 18px;
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
    background: var(--pink-deep);
    box-shadow: 0 0 0 4px rgba(244, 155, 189, 0.25);
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
    .foot {
      display: none;
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
