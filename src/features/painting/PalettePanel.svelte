<script lang="ts">
  import { catalog } from '../../core/content/registry';
  import { settings, updateSettings } from '../../core/settings';
  import Slider from '../../ui/Slider.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { sfx } from '../../core/audio';
  import { PAINTBALL_SIZES, type PaintballSize } from '../../core/splat';
  import type { ToolId } from './tools';

  interface Props {
    color: string;
    size: number;
    tool: ToolId;
    sizeEnabled: boolean;
    paintballSize: PaintballSize;
    onColor: (hex: string) => void;
    onSize: (n: number) => void;
    onPaintball: (s: PaintballSize) => void;
  }
  let { color, size, tool, sizeEnabled, paintballSize, onColor, onSize, onPaintball }: Props = $props();

  const palettes = $derived($catalog.palettes);
  const current = $derived(palettes.find((p) => p.manifest.id === $settings.paletteId) ?? palettes[0]);
  const named = $derived(current?.manifest.colors.find((c) => c.hex.toLowerCase() === color.toLowerCase()));

  let recent = $state<string[]>([]);
  function pick(hex: string) {
    sfx.pop(1.2);
    onColor(hex);
    recent = [hex, ...recent.filter((c) => c !== hex)].slice(0, 8);
  }
  let menuOpen = $state(false);
  const SIZE_LABEL: Record<PaintballSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };
</script>

<aside class="panel" aria-label="Colors">
  <div class="pal-head">
    <button class="pal-btn" onclick={() => (menuOpen = !menuOpen)} aria-expanded={menuOpen}>
      <span class="chips">
        {#each (current?.manifest.colors ?? []).slice(0, 4) as c}<i style="background:{c.hex}"></i>{/each}
      </span>
      <span class="pal-name">{current?.manifest.name ?? 'Palette'}</span>
      <Icon name="chevronRight" size={16} class={menuOpen ? 'open' : ''} />
    </button>
    {#if menuOpen}
      <div class="menu" role="listbox">
        {#each palettes as p (p.manifest.id)}
          <button
            role="option"
            aria-selected={p.manifest.id === current?.manifest.id}
            class:sel={p.manifest.id === current?.manifest.id}
            onclick={() => {
              updateSettings({ paletteId: p.manifest.id });
              menuOpen = false;
            }}
          >
            <span class="chips">{#each p.manifest.colors.slice(0, 5) as c}<i style="background:{c.hex}"></i>{/each}</span>
            <span>{p.manifest.name}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="swatches" role="group" aria-label="Palette colors">
    {#each current?.manifest.colors ?? [] as c (c.id)}
      <button class="sw" class:on={c.hex.toLowerCase() === color.toLowerCase()} style="--c:{c.hex}" title={c.name} aria-label={c.name} onclick={() => pick(c.hex)}></button>
    {/each}
  </div>

  <div class="now">
    <span class="dot" style="background:{color}"></span>
    <div>
      <strong>{named?.name ?? 'Custom color'}</strong>
      <small>{color.toUpperCase()}</small>
    </div>
  </div>

  <div class="adv">
    <label class="advbtn" title="Open the advanced color picker">
      <Icon name="sparkle" size={16} /> Custom color
      <input type="color" value={color} oninput={(e) => onColor(e.currentTarget.value)} onchange={(e) => pick(e.currentTarget.value)} />
    </label>
  </div>

  {#if recent.length}
    <div class="recent">
      <small>Recent</small>
      <div class="rrow">
        {#each recent as c}
          <button class="sw sm" style="--c:{c}" aria-label="Recent color {c}" onclick={() => onColor(c)}></button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="size">
    {#if tool === 'paintball'}
      <small>Paintball size</small>
      <div class="seg">
        {#each Object.keys(PAINTBALL_SIZES) as s}
          <button class:on={paintballSize === s} onclick={() => onPaintball(s as PaintballSize)}>
            <i style="width:{6 + PAINTBALL_SIZES[s as PaintballSize] / 6}px; height:{6 + PAINTBALL_SIZES[s as PaintballSize] / 6}px; background:{color}"></i>
            {SIZE_LABEL[s as PaintballSize]}
          </button>
        {/each}
      </div>
    {:else if sizeEnabled}
      <Slider label="Size" value={size} min={2} max={90} step={1} format={(v) => `${Math.round(v)} px`} onchange={onSize} />
      <div class="preview"><i style="width:{Math.min(size, 70)}px; height:{Math.min(size, 70)}px; background:{color}"></i></div>
    {/if}
  </div>
</aside>

<style>
  .panel {
    width: 268px;
    flex: none;
    margin: 0 14px 14px 0;
    padding: 16px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
  }
  .pal-head {
    position: relative;
  }
  .pal-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 16px;
    background: #fff;
    border: 1px solid var(--line);
    font-weight: 800;
    text-align: left;
  }
  .pal-name {
    flex: 1;
  }
  .chips {
    display: inline-flex;
  }
  .chips i {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    margin-left: -4px;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(80, 70, 140, 0.2);
  }
  .chips i:first-child {
    margin-left: 0;
  }
  .menu {
    position: absolute;
    z-index: 20;
    left: 0;
    right: 0;
    top: calc(100% + 6px);
    background: var(--panel-solid);
    border-radius: 18px;
    box-shadow: var(--shadow-l);
    padding: 6px;
    max-height: 340px;
    overflow-y: auto;
    border: 1px solid var(--line);
  }
  .menu button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 12px;
    font-weight: 700;
    text-align: left;
  }
  .menu button:hover {
    background: var(--lilac);
  }
  .menu button.sel {
    background: var(--lavender);
  }
  .swatches {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 2px;
  }
  .sw {
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--c);
    border: 3px solid #fff;
    box-shadow:
      0 2px 6px rgba(80, 70, 140, 0.22),
      inset 0 -3px 5px rgba(0, 0, 0, 0.05);
    transition: transform 0.15s var(--ease);
  }
  .sw:hover {
    transform: scale(1.12);
  }
  .sw.on {
    box-shadow:
      0 0 0 3px var(--lavender-deep),
      0 3px 8px rgba(80, 70, 140, 0.3);
    transform: scale(1.08);
  }
  .sw.sm {
    width: 24px;
    border-width: 2px;
  }
  .now {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: rgb(var(--w) / 0.7);
    border-radius: 16px;
  }
  .dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(80, 70, 140, 0.25);
    flex: none;
  }
  .now small {
    display: block;
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.75rem;
  }
  .advbtn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    background: #fff;
    border: 1px dashed var(--lavender-deep);
    font-weight: 800;
    font-size: 0.88rem;
    cursor: pointer;
    color: var(--c-violet);
  }
  .advbtn input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .recent small,
  .size small {
    color: var(--ink-soft);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.7rem;
  }
  .rrow {
    display: flex;
    gap: 6px;
    margin-top: 6px;
    flex-wrap: wrap;
  }
  .seg {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }
  .seg button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding: 10px 4px 8px;
    border-radius: 16px;
    background: #fff;
    border: 2px solid transparent;
    font-weight: 800;
    font-size: 0.8rem;
    min-height: 74px;
  }
  .seg button.on {
    border-color: var(--lavender-deep);
    background: var(--lilac);
  }
  .seg i,
  .preview i {
    border-radius: 50%;
    display: block;
    box-shadow: 0 2px 6px rgba(80, 70, 140, 0.2);
  }
  .preview {
    height: 76px;
    display: grid;
    place-items: center;
    background: #fff;
    border-radius: 16px;
    margin-top: 4px;
  }
</style>
