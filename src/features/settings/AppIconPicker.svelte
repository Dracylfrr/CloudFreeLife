<script lang="ts">
  import { settings, updateSettings } from '../../core/settings';
  import { APP_ICONS, type AppIconId } from '../../core/appIcon';
  import { sfx } from '../../core/audio';
  import Logo from '../../ui/Logo.svelte';

  // Radio group, same keyboard behaviour as the theme picker: arrows move, Space/Enter picks.
  function pick(id: AppIconId) {
    if ($settings.appIcon === id) return;
    updateSettings({ appIcon: id });
    sfx.click();
  }
  function onKey(e: KeyboardEvent, i: number) {
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % APP_ICONS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + APP_ICONS.length) % APP_ICONS.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = APP_ICONS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    pick(APP_ICONS[n].id);
    (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role=radio]')[n]?.focus();
  }
</script>

<div class="icons" role="radiogroup" aria-label="App icon">
  {#each APP_ICONS as ic, i (ic.id)}
    <button
      class="icon"
      class:on={$settings.appIcon === ic.id}
      role="radio"
      aria-checked={$settings.appIcon === ic.id}
      tabindex={$settings.appIcon === ic.id ? 0 : -1}
      onclick={() => pick(ic.id)}
      onkeydown={(e) => onKey(e, i)}
    >
      <Logo size={56} variant={ic.id} />
      <strong>{ic.name}</strong>
    </button>
  {/each}
</div>

<style>
  .icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
    gap: 12px;
    margin: 10px 0 6px;
  }
  .icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 8px;
    border-radius: 20px;
    background: rgb(var(--w) / 0.55);
    border: 2px solid transparent;
    box-shadow: var(--shadow-s);
    transition:
      transform 0.2s var(--ease),
      border-color 0.2s,
      background 0.2s;
  }
  .icon:hover {
    transform: translateY(-2px);
    background: rgb(var(--w) / 0.85);
  }
  .icon.on {
    border-color: var(--lavender-deep);
    background: rgb(var(--w) / 0.9);
  }
  .icon strong {
    font-size: 0.85rem;
    color: var(--ink);
    text-align: center;
  }
</style>
