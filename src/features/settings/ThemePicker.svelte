<script lang="ts">
  import { settings, updateSettings } from '../../core/settings';
  import { THEMES, systemPrefersDark, themeById, type ThemeChoice } from '../../core/themes';
  import { sfx } from '../../core/audio';

  // Radio group: arrow keys move between themes, Space/Enter picks. A click applies at once;
  // the choice is saved automatically (settings are debounced to disk).
  const systemTheme = $derived(themeById(systemPrefersDark() ? 'moonlight' : 'cloud_morning'));

  function pick(id: ThemeChoice) {
    if ($settings.theme === id) return;
    updateSettings({ theme: id });
    sfx.click();
  }

  function onKey(e: KeyboardEvent, i: number, all: ThemeChoice[]) {
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % all.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + all.length) % all.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = all.length - 1;
    if (n < 0) return;
    e.preventDefault();
    pick(all[n]);
    (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role=radio]')[n]?.focus();
  }

  const all: ThemeChoice[] = [...THEMES.map((t) => t.id), 'system'];
</script>

<div class="themes" role="radiogroup" aria-label="Theme">
  {#each THEMES as t, i (t.id)}
    <button
      class="theme"
      class:on={$settings.theme === t.id}
      role="radio"
      aria-checked={$settings.theme === t.id}
      tabindex={$settings.theme === t.id ? 0 : -1}
      onclick={() => pick(t.id)}
      onkeydown={(e) => onKey(e, i, all)}
    >
      <span class="mini" style="background: linear-gradient(150deg, {t.swatch[0]}, {t.vars['--bg-b']} 55%, {t.vars['--bg-c']})">
        <i class="side" style="background: {t.vars['--panel-solid']}"></i>
        <i class="card" style="background: {t.swatch[1]}"><b style="background: {t.swatch[2]}"></b><b class="s" style="background: {t.swatch[3]}"></b></i>
        <i class="card c2" style="background: {t.swatch[1]}"></i>
      </span>
      <strong>{t.name}</strong>
      <span class="blurb">{t.blurb}</span>
    </button>
  {/each}
  <button
    class="theme"
    class:on={$settings.theme === 'system'}
    role="radio"
    aria-checked={$settings.theme === 'system'}
    tabindex={$settings.theme === 'system' ? 0 : -1}
    onclick={() => pick('system')}
    onkeydown={(e) => onKey(e, THEMES.length, all)}
  >
    <span class="mini half" style="background: linear-gradient(100deg, {THEMES[0].swatch[0]} 50%, {themeById('moonlight').swatch[0]} 50%)">
      <i class="side" style="background: {THEMES[0].vars['--panel-solid']}"></i>
      <i class="card" style="background: {themeById('moonlight').swatch[1]}"><b style="background: {themeById('moonlight').swatch[2]}"></b></i>
    </span>
    <strong>Follow System</strong>
    <span class="blurb">Matches Windows ({systemTheme.dark ? 'dark' : 'light'} now).</span>
  </button>
</div>

<style>
  .themes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;
    margin: 10px 0 6px;
  }
  .theme {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 10px 12px;
    border-radius: 20px;
    text-align: left;
    background: rgb(var(--w) / 0.55);
    border: 2px solid transparent;
    box-shadow: var(--shadow-s);
    transition:
      transform 0.2s var(--ease),
      border-color 0.2s,
      background 0.2s;
    min-width: 0;
  }
  .theme:hover {
    transform: translateY(-2px);
    background: rgb(var(--w) / 0.85);
  }
  .theme.on {
    border-color: var(--lavender-deep);
    background: rgb(var(--w) / 0.9);
  }
  .theme strong {
    font-size: 0.95rem;
    color: var(--ink);
    margin-top: 6px;
  }
  .blurb {
    font-size: 0.78rem;
    color: var(--ink-soft);
    line-height: 1.3;
  }
  .mini {
    position: relative;
    height: 64px;
    border-radius: 14px;
    overflow: hidden;
    display: block;
    box-shadow: inset 0 0 0 1px rgba(80, 70, 140, 0.12);
  }
  .mini i {
    position: absolute;
    display: block;
    border-radius: 8px;
  }
  .side {
    left: 6px;
    top: 6px;
    bottom: 6px;
    width: 18px;
  }
  .card {
    left: 30px;
    top: 8px;
    right: 8px;
    height: 24px;
    padding: 5px 6px;
    display: flex;
    gap: 5px;
    align-items: center;
  }
  .card.c2 {
    top: 38px;
    height: 18px;
  }
  .card b {
    display: block;
    width: 26px;
    height: 10px;
    border-radius: 6px;
  }
  .card b.s {
    width: 16px;
  }
</style>
