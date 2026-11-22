<script lang="ts">
  import { navigate } from '../../core/router';
  import { settings } from '../../core/settings';
  import Icon from '../../ui/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import { describeUpdate, hideForNow, toastCandidate, updateState } from './updater';

  const candidate = $derived(toastCandidate($updateState, $settings.dismissedUpdates));
</script>

{#if candidate}
  <aside class="notice" role="status" aria-live="polite">
    <span class="ico"><Icon name={candidate.kind === 'app' ? 'cloudDown' : 'sparkle'} size={20} /></span>
    <span class="msg">{describeUpdate(candidate)}</span>
    <span class="btns">
      <Button size="sm" variant="primary" onclick={() => { hideForNow(candidate); navigate({ name: 'updates' }); }}>View</Button>
      <Button size="sm" variant="ghost" onclick={() => hideForNow(candidate)}>Later</Button>
    </span>
  </aside>
{/if}

<style>
  .notice {
    position: fixed;
    top: 18px;
    right: 22px;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px 10px 16px;
    border-radius: 999px;
    background: var(--panel-strong);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.9);
    animation: slide 0.5s var(--ease);
    max-width: min(560px, calc(100vw - 280px));
  }
  .ico {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #cfeaf9, #e6dcfa);
    color: #4c3f9c;
    flex: none;
  }
  .msg {
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .btns {
    display: flex;
    gap: 2px;
    flex: none;
  }
  @keyframes slide {
    from {
      opacity: 0;
      transform: translateY(-14px) scale(0.97);
    }
  }
</style>
