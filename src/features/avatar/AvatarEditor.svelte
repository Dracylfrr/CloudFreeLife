<script lang="ts">
  import { tick } from 'svelte';
  import { settings, updateSettings } from '../../core/settings';
  import { sfx } from '../../core/audio';
  import Button from '../../ui/Button.svelte';
  import Avatar from './Avatar.svelte';
  import { avatarEditorOpen, closeAvatarEditor } from './state';
  import { BACKGROUNDS, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, HAIR_STYLE_LABEL, OUTFITS, OUTFIT_COLORS, OUTFIT_LABEL, PRESETS, SKIN_TONES, type AvatarBase, type AvatarConfig, type Swatch } from './avatar';

  let dialog = $state<HTMLDivElement | undefined>();
  let opener: HTMLElement | null = null;
  const avatar = $derived($settings.avatar);

  // Focus moves into the editor when it opens and goes back to what opened it when it closes.
  $effect(() => {
    if ($avatarEditorOpen) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      void tick().then(() => dialog?.focus());
    }
  });

  function close() {
    closeAvatarEditor();
    opener?.focus();
    opener = null;
  }
  function choose(base: AvatarBase) {
    updateSettings({ avatar: { ...PRESETS[base] } });
    sfx.pop(1.2);
  }
  function change(patch: Partial<AvatarConfig>) {
    if (!avatar) return;
    updateSettings({ avatar: { ...avatar, ...patch } });
    sfx.click();
  }
  function remove() {
    updateSettings({ avatar: null });
  }
  function key(e: KeyboardEvent) {
    if ($avatarEditorOpen && e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }
</script>

<svelte:window onkeydown={key} />

{#snippet swatches(label: string, list: Swatch[], current: string, field: 'skin' | 'hair' | 'eyes' | 'outfitColor' | 'background')}
  <div class="row">
    <h3>{label}</h3>
    <div class="sw" role="radiogroup" aria-label={label}>
      {#each list as s (s.color)}
        <button class="dot" class:on={current === s.color} style="--c:{s.color}" role="radio" aria-checked={current === s.color} aria-label={s.name} title={s.name} onclick={() => change({ [field]: s.color })}></button>
      {/each}
    </div>
  </div>
{/snippet}

{#if $avatarEditorOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" onclick={(e) => e.target === e.currentTarget && close()}>
    <div class="panel" role="dialog" aria-modal="true" aria-labelledby="avatar-title" tabindex="-1" bind:this={dialog}>
      <header>
        <h2 id="avatar-title">{avatar ? 'Your avatar' : 'Choose your avatar'}</h2>
        <button class="x" aria-label="Close" onclick={close}>×</button>
      </header>

      {#if !avatar}
        <p class="lead">Pick a starting look. You can change everything about it afterwards: hair, eyes, skin, clothes and more.</p>
        <div class="starters">
          {#each ['girl', 'boy'] as const as b}
            <button class="starter" onclick={() => choose(b)}>
              <Avatar avatar={PRESETS[b]} size={124} />
              <strong>{b === 'girl' ? 'Girl' : 'Boy'}</strong>
            </button>
          {/each}
        </div>
      {:else}
        <div class="body">
          <div class="view">
            <Avatar {avatar} size={176} />
            <div class="starts" role="group" aria-label="Start again from">
              <button onclick={() => choose('girl')}>Girl look</button>
              <button onclick={() => choose('boy')}>Boy look</button>
            </div>
          </div>
          <div class="opts">
            <div class="row">
              <h3>Hair style</h3>
              <div class="chips" role="radiogroup" aria-label="Hair style">
                {#each HAIR_STYLES as h}
                  <button class="chip" class:on={avatar.hairStyle === h} role="radio" aria-checked={avatar.hairStyle === h} onclick={() => change({ hairStyle: h })}>{HAIR_STYLE_LABEL[h]}</button>
                {/each}
              </div>
            </div>
            {@render swatches('Hair color', HAIR_COLORS, avatar.hair, 'hair')}
            {@render swatches('Eye color', EYE_COLORS, avatar.eyes, 'eyes')}
            {@render swatches('Skin', SKIN_TONES, avatar.skin, 'skin')}
            <div class="row">
              <h3>Clothes</h3>
              <div class="chips" role="radiogroup" aria-label="Clothes">
                {#each OUTFITS as o}
                  <button class="chip" class:on={avatar.outfit === o} role="radio" aria-checked={avatar.outfit === o} onclick={() => change({ outfit: o })}>{OUTFIT_LABEL[o]}</button>
                {/each}
              </div>
            </div>
            {@render swatches('Clothes color', OUTFIT_COLORS, avatar.outfitColor, 'outfitColor')}
            {@render swatches('Background', BACKGROUNDS, avatar.background, 'background')}
          </div>
        </div>
      {/if}

      <footer>
        {#if avatar}<Button variant="ghost" size="sm" onclick={remove}>Remove avatar</Button>{/if}
        <span class="spacer"></span>
        <Button variant="primary" onclick={close}>{avatar ? 'Done' : 'Not now'}</Button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(70, 64, 120, 0.34);
    backdrop-filter: blur(4px);
    animation: fade 0.2s ease-out;
  }
  .panel {
    width: min(760px, 100%);
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    padding: 20px 24px 18px;
    border-radius: var(--radius-xl);
    background: var(--panel-solid);
    color: var(--ink);
    box-shadow: var(--shadow-l);
    border: 1px solid rgb(var(--w) / 0.85);
    outline: none;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  header h2 {
    font-size: 1.35rem;
  }
  .x {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--ink-soft);
  }
  .x:hover {
    background: var(--lilac);
  }
  .lead {
    color: var(--ink-soft);
    margin-bottom: 14px;
  }
  .starters {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    padding: 6px 0 12px;
  }
  .starter {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 18px 26px 14px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    transition:
      transform 0.2s var(--ease),
      box-shadow 0.2s var(--ease);
  }
  .starter:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-l);
  }
  .starter strong {
    font-size: 1.05rem;
  }
  .body {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 22px;
    align-items: start;
  }
  .view {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .starts {
    display: flex;
    gap: 6px;
  }
  .starts button {
    padding: 5px 11px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.78rem;
    color: var(--ink-soft);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .starts button:hover {
    color: var(--ink);
  }
  .opts {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .row h3 {
    font-size: 0.82rem;
    color: var(--ink-soft);
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }
  .sw,
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .dot {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--c);
    border: 3px solid rgb(var(--w) / 0.95);
    box-shadow:
      0 0 0 1.5px var(--line),
      var(--shadow-s);
    transition: transform 0.15s var(--ease);
  }
  .dot:hover {
    transform: scale(1.1);
  }
  .dot.on {
    box-shadow:
      0 0 0 3px var(--lavender-deep),
      var(--shadow-s);
  }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.84rem;
    color: var(--ink-soft);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .chip:hover {
    color: var(--ink);
  }
  .chip.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }
  .spacer {
    flex: 1;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @media (max-width: 640px) {
    .body {
      grid-template-columns: 1fr;
    }
    .view {
      position: static;
    }
  }
</style>
