<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import { BLEND_MODES, MAX_LAYERS, MAX_LAYER_NAME, blendOf, type BlendId, type LayerMeta } from './layers';

  interface Props {
    /** Bottom to top, as the engine keeps them. */
    layers: LayerMeta[];
    activeId: string;
    /** Changes whenever pixels change, so the little previews are redrawn. */
    rev: number;
    thumb: (id: string, canvas: HTMLCanvasElement) => void;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onMerge: (id: string) => void;
    onMove: (id: string, by: -1 | 1) => void;
    onSet: (id: string, p: Partial<Pick<LayerMeta, 'name' | 'visible' | 'locked' | 'opacity' | 'blend'>>, record: boolean) => void;
    /** After a slider drag ends: records it as one undo step. */
    onSettled: (id: string, before: Partial<LayerMeta>) => void;
  }
  let { layers, activeId, rev, thumb, onSelect, onAdd, onDuplicate, onDelete, onMerge, onMove, onSet, onSettled }: Props = $props();

  const top = $derived([...layers].reverse());
  const active = $derived(layers.find((l) => l.id === activeId) ?? layers[layers.length - 1]);
  const activeIndex = $derived(layers.findIndex((l) => l.id === active?.id));
  let renaming = $state<string | null>(null);
  let draft = $state('');
  let opacityBefore = 1;

  /** Draws a layer's little preview whenever `rev` changes. */
  function preview(node: HTMLCanvasElement, args: { id: string; rev: number }) {
    thumb(args.id, node);
    return {
      update(a: { id: string; rev: number }) {
        thumb(a.id, node);
      }
    };
  }

  function startRename(l: LayerMeta) {
    renaming = l.id;
    draft = l.name;
  }
  function finishRename(save: boolean) {
    if (renaming && save) onSet(renaming, { name: draft }, true);
    renaming = null;
  }
  function keyRow(e: KeyboardEvent, l: LayerMeta) {
    if (e.key === 'F2') startRename(l);
    else if ((e.key === 'Delete' || e.key === 'Backspace') && renaming === null) {
      // Delete or Backspace on a layer deletes that layer (there is always at least one left).
      e.preventDefault();
      e.stopPropagation();
      if (layers.length > 1) onDelete(l.id);
    }
  }
</script>

<section class="layers" aria-label="Layers">
  <header>
    <h3>Layers</h3>
    <Button variant="soft" size="sm" icon="plus" disabled={layers.length >= MAX_LAYERS} title={layers.length >= MAX_LAYERS ? `A painting can have ${MAX_LAYERS} layers` : 'Add a layer above this one'} onclick={onAdd}>Add</Button>
  </header>

  <ul role="listbox" aria-label="Layers, top first">
    {#each top as l (l.id)}
      <li class:on={l.id === activeId} class:off={!l.visible}>
        <button class="eye" aria-pressed={l.visible} aria-label={l.visible ? `Hide ${l.name}` : `Show ${l.name}`} title={l.visible ? 'Hide' : 'Show'} onclick={() => onSet(l.id, { visible: !l.visible }, true)}>
          <Icon name={l.visible ? 'sparkle' : 'ban'} size={16} />
        </button>
        <button class="row" role="option" aria-selected={l.id === activeId} onclick={() => onSelect(l.id)} onkeydown={(e) => keyRow(e, l)} ondblclick={() => startRename(l)}>
          <canvas width="40" height="30" use:preview={{ id: l.id, rev }} aria-hidden="true"></canvas>
          {#if renaming === l.id}
            <!-- svelte-ignore a11y_autofocus -->
            <input class="name-edit" bind:value={draft} maxlength={MAX_LAYER_NAME} autofocus aria-label="Layer name" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') finishRename(true); else if (e.key === 'Escape') finishRename(false); }} onblur={() => finishRename(true)} />
          {:else}
            <span class="name">{l.name}</span>
          {/if}
        </button>
        <button class="lock" class:on={l.locked} aria-pressed={l.locked} aria-label={l.locked ? `Unlock ${l.name}` : `Lock ${l.name}`} title={l.locked ? 'Locked: click to unlock' : 'Lock so it cannot be painted on'} onclick={() => onSet(l.id, { locked: !l.locked }, true)}>
          <Icon name="shield" size={15} />
        </button>
      </li>
    {/each}
  </ul>

  {#if active}
    <div class="controls">
      <label class="op">
        <span>Opacity <b>{Math.round(active.opacity * 100)}%</b></span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(active.opacity * 100)}
          aria-label="Layer opacity"
          onpointerdown={() => (opacityBefore = active.opacity)}
          onkeydown={() => (opacityBefore = active.opacity)}
          oninput={(e) => onSet(active.id, { opacity: Number(e.currentTarget.value) / 100 }, false)}
          onchange={() => onSettled(active.id, { opacity: opacityBefore })}
        />
      </label>
      <label class="bl">
        <span>Blend</span>
        <select value={active.blend} aria-label="Blend mode" onchange={(e) => onSet(active.id, { blend: e.currentTarget.value as BlendId }, true)}>
          {#each BLEND_MODES as b}<option value={b.id}>{b.label}</option>{/each}
        </select>
      </label>
      <p class="hint">{blendOf(active.blend).hint}</p>
      <div class="acts">
        <Button variant="ghost" size="sm" icon="chevronRight" title="Move up" disabled={activeIndex >= layers.length - 1} onclick={() => onMove(active.id, 1)}>Up</Button>
        <Button variant="ghost" size="sm" icon="chevronLeft" title="Move down" disabled={activeIndex <= 0} onclick={() => onMove(active.id, -1)}>Down</Button>
        <Button variant="ghost" size="sm" icon="copy" title="Make a copy of this layer" disabled={layers.length >= MAX_LAYERS} onclick={() => onDuplicate(active.id)}>Copy</Button>
        <Button variant="ghost" size="sm" icon="grid" title="Paint this layer onto the one below it" disabled={activeIndex <= 0} onclick={() => onMerge(active.id)}>Merge down</Button>
        <Button variant="ghost" size="sm" icon="trash" title="Delete this layer" disabled={layers.length <= 1} onclick={() => onDelete(active.id)}>Delete</Button>
      </div>
    </div>
  {/if}
</section>

<style>
  .layers {
    width: 268px;
    flex: none;
    margin: 0 14px 10px 0;
    padding: 12px 14px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 56%;
    overflow-y: auto;
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
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    /* ten layers can be a long list: it scrolls instead of pushing the colors away */
    flex: none;
    max-height: 236px;
    overflow-y: auto;
    scrollbar-width: thin;
  }
  li {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 14px;
    padding: 2px;
    border: 2px solid transparent;
  }
  li.on {
    border-color: var(--lavender-deep);
    background: rgb(var(--w) / 0.55);
  }
  li.off .name {
    opacity: 0.5;
  }
  .eye,
  .lock {
    width: 30px;
    height: 30px;
    flex: none;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
  }
  .eye:hover,
  .lock:hover {
    background: rgb(var(--w) / 0.8);
    color: var(--ink);
  }
  .lock.on {
    color: var(--c-violet);
    background: rgb(var(--w) / 0.8);
  }
  .row {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: left;
    padding: 2px 4px;
    border-radius: 10px;
  }
  .row canvas {
    width: 40px;
    height: 30px;
    flex: none;
    border-radius: 6px;
    background:
      repeating-conic-gradient(rgba(150, 145, 190, 0.22) 0 25%, transparent 0 50%) 0 0 / 10px 10px,
      rgb(var(--w) / 0.6);
    border: 1px solid var(--line);
  }
  .name {
    font-weight: 800;
    font-size: 0.88rem;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name-edit {
    width: 100%;
    min-width: 0;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: #fff;
    color: #3a3560;
    font: inherit;
    font-weight: 800;
    font-size: 0.88rem;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .op,
  .bl {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.78rem;
    font-weight: 800;
    color: var(--ink-soft);
  }
  .op b {
    color: var(--ink);
  }
  .op input {
    width: 100%;
    accent-color: var(--lavender-deep);
  }
  .bl select {
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: #fff;
    color: #3a3560;
    font: inherit;
    font-weight: 700;
  }
  .hint {
    margin: 0;
    font-size: 0.76rem;
    color: var(--ink-soft);
    line-height: 1.3;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
</style>
