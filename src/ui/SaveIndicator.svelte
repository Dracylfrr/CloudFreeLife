<script lang="ts">
  import { saveStatus } from '../core/feedback';
  import Icon from './Icon.svelte';
</script>

{#if $saveStatus !== 'idle'}
  <span class="ind {$saveStatus}" role="status" aria-live="polite">
    {#if $saveStatus === 'saving'}
      <i class="spin"></i> Saving…
    {:else if $saveStatus === 'saved'}
      <Icon name="check" size={15} stroke={2.6} /> Saved
    {:else}
      Couldn't save — retrying
    {/if}
  </span>
{/if}

<style>
  .ind {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--ink-soft);
    padding: 5px 12px;
    border-radius: 999px;
    background: rgb(var(--w) / 0.7);
    transition: opacity 0.3s;
  }
  .saved {
    color: var(--c-green2);
  }
  .error {
    color: var(--c-rose);
    background: var(--c-rose-bg);
  }
  .spin {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #c9bdf0;
    border-top-color: #8a79d6;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
