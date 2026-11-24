<script lang="ts">
  import { confirmRequest, toasts } from '../core/feedback';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  let inputValue = $state('');
  let inputEl: HTMLInputElement | undefined = $state();
  let lastReq: unknown = null;

  $effect(() => {
    const r = $confirmRequest;
    if (r && r !== lastReq) {
      lastReq = r;
      inputValue = r.input?.value ?? '';
      queueMicrotask(() => inputEl?.select());
    }
  });

  function close(ok: boolean) {
    const r = $confirmRequest;
    if (!r) return;
    confirmRequest.set(null);
    r.resolve({ ok, value: inputValue.trim() });
  }

  function key(e: KeyboardEvent) {
    if (!$confirmRequest) return;
    if (e.key === 'Escape') close(false);
    if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) close(true);
  }
</script>

<svelte:window onkeydown={key} />

{#if $confirmRequest}
  {@const r = $confirmRequest}
  <div class="scrim" role="presentation" onpointerdown={(e) => e.target === e.currentTarget && close(false)}>
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
      <div class="badge" class:danger={r.danger}><Icon name={r.danger ? 'trash' : r.input ? 'edit' : 'sparkle'} size={26} /></div>
      <h2 id="dlg-title">{r.title}</h2>
      <p class="muted">{r.message}</p>
      {#if r.input}
        <input class="field" bind:this={inputEl} bind:value={inputValue} placeholder={r.input.placeholder ?? ''} maxlength={r.input.maxLength ?? 60} />
      {/if}
      <div class="actions">
        <Button variant="ghost" onclick={() => close(false)}>{r.cancelLabel ?? 'Cancel'}</Button>
        <Button variant={r.danger ? 'danger' : 'primary'} onclick={() => close(true)}>{r.confirmLabel ?? 'OK'}</Button>
      </div>
    </div>
  </div>
{/if}

<div class="toasts" aria-live="polite">
  {#each $toasts as t (t.id)}
    <div class="toast {t.kind}">
      <span>{t.text}</span>
      {#if t.action}
        <button class="act" onclick={t.action.run}>{t.action.label}</button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(90, 80, 140, 0.28);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    animation: fade 0.2s ease-out;
  }
  .dialog {
    width: min(440px, calc(100vw - 48px));
    background: var(--panel-solid);
    border-radius: var(--radius-xl);
    padding: 30px 30px 24px;
    box-shadow: var(--shadow-l);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: pop 0.28s var(--ease);
  }
  .badge {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--lavender);
    color: var(--c-violet);
    margin-bottom: 4px;
  }
  .badge.danger {
    background: var(--c-rose-bg);
    color: var(--c-rose);
  }
  .actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
  }
  .field {
    width: 100%;
    margin-top: 6px;
    padding: 12px 16px;
    border-radius: 14px;
    border: 2px solid var(--line);
    background: var(--surface);
    user-select: text;
    font-weight: 600;
  }
  .field:focus {
    outline: none;
    border-color: var(--lavender-deep);
  }
  .toasts {
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 120;
    pointer-events: none;
  }
  .toast {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--panel-solid);
    padding: 11px 20px;
    border-radius: 999px;
    box-shadow: var(--shadow-m);
    font-weight: 700;
    animation: rise 0.3s var(--ease);
    border: 1px solid var(--line);
  }
  .toast .act {
    pointer-events: auto;
    padding: 4px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.86rem;
    white-space: nowrap;
    color: var(--nav-ink);
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    text-decoration: underline;
    text-underline-offset: 3px;
    box-shadow: var(--shadow-s);
  }
  .toast .act:hover {
    filter: brightness(0.97);
  }
  .toast.success {
    background: var(--c-green-bg);
    color: var(--c-green2);
  }
  .toast.error {
    background: var(--c-rose-bg);
    color: var(--c-rose);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.96);
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
</style>
