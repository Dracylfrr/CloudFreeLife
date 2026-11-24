<script lang="ts">
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import type { RefMode, RefSettings } from '../gallery/referenceStore';

  interface Props {
    has: boolean;
    settings: RefSettings;
    message: string;
    onChoose: (file: File) => void;
    onChange: (s: RefSettings) => void;
    onRemove: () => void;
    onClose: () => void;
  }
  let { has, settings, message, onChoose, onChange, onRemove, onClose }: Props = $props();

  function pick(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (f) onChoose(f);
    (e.currentTarget as HTMLInputElement).value = '';
  }
  const mode = (m: RefMode) => onChange({ ...settings, mode: m });
</script>

<section class="ref" aria-label="Reference picture">
  <header>
    <h3>Reference picture</h3>
    <button class="x" aria-label="Close" onclick={onClose}><Icon name="x" size={16} /></button>
  </header>
  <p class="small">Keep a picture in view to paint from. It is only for you to look at: it never becomes part of your painting or its exports, and it stays on this computer.</p>
  <input type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" aria-label="Choose a reference picture" onchange={pick} />
  {#if message}<p class="problem" role="alert"><Icon name="info" size={15} /> {message}</p>{/if}
  {#if has}
    <div class="modes" role="radiogroup" aria-label="Where to show it">
      <button class:on={settings.mode === 'beside'} role="radio" aria-checked={settings.mode === 'beside'} onclick={() => mode('beside')}>Beside</button>
      <button class:on={settings.mode === 'trace'} role="radio" aria-checked={settings.mode === 'trace'} onclick={() => mode('trace')}>Faint over the canvas</button>
    </div>
    {#if settings.mode === 'trace'}
      <label class="op">
        <span>Strength <b>{Math.round(settings.opacity * 100)}%</b></span>
        <input type="range" min="10" max="90" step="5" value={Math.round(settings.opacity * 100)} aria-label="Reference strength" oninput={(e) => onChange({ ...settings, opacity: Number(e.currentTarget.value) / 100 })} />
      </label>
    {/if}
    <div class="acts">
      <Button variant="soft" size="sm" onclick={() => onChange({ ...settings, shown: !settings.shown })}>{settings.shown ? 'Hide it' : 'Show it'}</Button>
      <Button variant="ghost" size="sm" icon="trash" onclick={onRemove}>Remove</Button>
    </div>
  {/if}
</section>

<style>
  .ref {
    position: absolute;
    top: 64px;
    right: 14px;
    z-index: 20;
    width: 300px;
    padding: 14px 16px;
    border-radius: var(--radius-l);
    background: var(--panel-strong);
    box-shadow: var(--shadow-l);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h3 {
    margin: 0;
    font-size: 1rem;
  }
  .x {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
  }
  .x:hover {
    background: rgb(var(--w) / 0.8);
  }
  .problem {
    display: flex;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--c-rose-bg);
    color: var(--c-rose);
    font-weight: 700;
    font-size: 0.84rem;
    margin: 0;
  }
  .modes {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .modes button {
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.84rem;
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.6);
    border: 2px solid transparent;
  }
  .modes button.on {
    color: var(--ink);
    border-color: var(--lavender-deep);
  }
  .op {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .op input {
    accent-color: var(--lavender-deep);
  }
  .acts {
    display: flex;
    gap: 8px;
  }
</style>
