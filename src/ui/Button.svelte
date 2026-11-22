<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { sfx } from '../core/audio';

  interface Props {
    variant?: 'primary' | 'soft' | 'ghost' | 'danger' | 'mint' | 'peach';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    disabled?: boolean;
    title?: string;
    type?: 'button' | 'submit';
    active?: boolean;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }
  let { variant = 'soft', size = 'md', icon, disabled = false, title, type = 'button', active = false, onclick, children }: Props = $props();

  function handle(e: MouseEvent) {
    sfx.click();
    onclick?.(e);
  }
</script>

<button class="btn {variant} {size}" class:active {type} {disabled} {title} aria-label={title} onclick={handle}>
  {#if icon}<Icon name={icon} size={size === 'lg' ? 22 : size === 'sm' ? 16 : 19} />{/if}
  {#if children}<span>{@render children()}</span>{/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 999px;
    font-weight: 800;
    letter-spacing: 0.005em;
    transition:
      transform 0.18s var(--ease),
      box-shadow 0.18s var(--ease),
      background 0.18s,
      opacity 0.18s;
    white-space: nowrap;
    user-select: none;
  }
  .btn:not(:disabled):hover {
    transform: translateY(-1px);
  }
  .btn:not(:disabled):active {
    transform: translateY(1px) scale(0.985);
  }
  .btn:disabled {
    opacity: 0.45;
  }
  .sm {
    padding: 7px 14px;
    font-size: 0.85rem;
  }
  .md {
    padding: 10px 20px;
    font-size: 0.95rem;
  }
  .lg {
    padding: 15px 28px;
    font-size: 1.05rem;
  }
  .primary {
    background: linear-gradient(135deg, #9fd3f2, #b7a8ec);
    color: #35316a;
    box-shadow: 0 6px 16px rgba(150, 130, 220, 0.34);
  }
  .primary:not(:disabled):hover {
    box-shadow: 0 9px 22px rgba(150, 130, 220, 0.42);
  }
  .soft {
    background: var(--panel-strong);
    color: var(--ink);
    box-shadow: var(--shadow-s);
    border: 1px solid var(--line);
  }
  .soft:not(:disabled):hover {
    background: #fff;
  }
  .soft.active {
    background: var(--lavender);
    border-color: var(--lavender-deep);
  }
  .ghost {
    color: var(--ink-soft);
    background: transparent;
  }
  .ghost:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.6);
    color: var(--ink);
  }
  .danger {
    background: #ffe3e8;
    color: #9a4560;
    border: 1px solid #f8c5d0;
  }
  .mint {
    background: linear-gradient(135deg, #c6ecda, #bdeeea);
    color: #2e5a4b;
    box-shadow: 0 6px 16px rgba(110, 200, 170, 0.3);
  }
  .peach {
    background: linear-gradient(135deg, #ffdcc8, #ffd3e2);
    color: #7a4a3e;
    box-shadow: 0 6px 16px rgba(255, 170, 140, 0.3);
  }
</style>
