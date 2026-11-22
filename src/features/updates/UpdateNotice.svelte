<script lang="ts">
  import { settings } from '../../core/settings';
  import Icon from '../../ui/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import { noticeText } from './release';
  import { hideForNow, startInstall, toastCandidate, updateState } from './updater';

  const candidate = $derived(toastCandidate($updateState, $settings.dismissedUpdates));
  const text = $derived(candidate ? noticeText(candidate) : null);
</script>

{#if candidate && text}
  <aside class="notice" role="status" aria-live="polite">
    <span class="ico"><Icon name="sparkle" size={20} /></span>
    <span class="msg">
      <strong>{text.title}</strong>
      <small>{text.detail}</small>
    </span>
    <span class="btns">
      <Button size="sm" variant="primary" icon="download" onclick={() => startInstall(candidate)}>Install update</Button>
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
    gap: 14px;
    padding: 12px 14px 12px 16px;
    border-radius: 28px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(246, 240, 255, 0.97));
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.9);
    animation: slide 0.5s var(--ease);
    max-width: min(620px, calc(100vw - 44px));
  }
  .ico {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffe6ef, #e6dcfa);
    color: #7a52c8;
    flex: none;
  }
  .msg {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.25;
  }
  .msg strong {
    font-weight: 900;
    white-space: nowrap;
  }
  .msg small {
    color: var(--ink-soft);
    font-weight: 700;
    font-size: 0.8rem;
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
