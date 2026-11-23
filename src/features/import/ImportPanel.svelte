<script lang="ts">
  import { catalog } from '../../core/content/registry';
  import { navigate } from '../../core/router';
  import { confirmDialog, toast } from '../../core/feedback';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { MY_BOOK_ID, cleanName, importLineArt, removeImportedPage } from './importPage';

  let { onclose }: { onclose: () => void } = $props();

  let file = $state<File | null>(null);
  let title = $state('');
  let preview = $state('');
  let busy = $state(false);
  let message = $state('');

  const mine = $derived($catalog.books.find((b) => b.manifest.id === MY_BOOK_ID)?.pages ?? []);

  function pick(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    file = f;
    message = '';
    preview = f ? URL.createObjectURL(f) : '';
    title = f ? cleanName(f.name) : '';
  }

  async function make() {
    if (!file || busy) return;
    busy = true;
    message = '';
    try {
      const r = await importLineArt(file, file.name, title);
      if (!r.ok) message = r.reason;
      else {
        toast('Your page is ready to color ✨', 'success');
        navigate({ name: 'book', bookId: MY_BOOK_ID });
      }
    } catch (e) {
      console.error(e);
      message = 'Something went wrong making that page. Please try another picture.';
    } finally {
      busy = false;
    }
  }

  async function remove(id: string, name: string) {
    const ok = await confirmDialog({ title: 'Remove this page?', message: `"${name}" will be removed from My Pages. Paintings you made on it stay in the Gallery.`, confirmLabel: 'Remove page', danger: true });
    if (ok) await removeImportedPage(id);
  }
</script>

<section class="panel" aria-label="Import line art">
  <header>
    <h2>Import line art</h2>
    <button class="x" aria-label="Close" onclick={onclose}><Icon name="x" size={18} /></button>
  </header>
  <p class="small">Choose a picture with dark outlines on a light background (PNG, JPG, WebP or SVG, up to 8 MB). Every closed shape becomes a spot you can color. It works best with clean drawings; photos and shaded art make poor coloring pages. Your file is never changed and nothing leaves your computer.</p>
  <div class="row">
    <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" onchange={pick} aria-label="Choose a picture" />
  </div>
  {#if file}
    <div class="make">
      {#if preview}<img src={preview} alt="What you chose, as it will look" />{/if}
      <div class="form">
        <label>
          <span>Name</span>
          <input type="text" bind:value={title} maxlength="40" />
        </label>
        <Button variant="primary" icon="brush" disabled={busy} onclick={make}>{busy ? 'Finding the shapes…' : 'Make my page'}</Button>
      </div>
    </div>
  {/if}
  {#if message}<p class="problem" role="alert"><Icon name="info" size={16} /> {message}</p>{/if}

  {#if mine.length}
    <h3>Your pages</h3>
    <ul class="mine">
      {#each mine as p (p.manifest.id)}
        <li>
          <span>{p.manifest.name}</span>
          <button class="rm" onclick={() => remove(p.manifest.id, p.manifest.name)}>Remove</button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .panel {
    margin: 0 0 24px;
    padding: 18px 22px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    max-width: 1180px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  h3 {
    margin: 6px 0 0;
    font-size: 1rem;
  }
  .x {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--ink-soft);
  }
  .x:hover {
    background: rgb(var(--w) / 0.8);
  }
  .make {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .make img {
    width: 220px;
    max-height: 170px;
    object-fit: contain;
    border-radius: 14px;
    background: #fff;
    border: 1px solid var(--line);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 220px;
  }
  .form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 800;
    font-size: 0.82rem;
    color: var(--ink-soft);
  }
  .form input {
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgb(var(--w) / 0.8);
    color: var(--ink);
    font: inherit;
  }
  .problem {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--c-rose-bg);
    color: var(--c-rose);
    font-weight: 700;
    margin: 0;
  }
  .mine {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .mine li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    border-radius: 12px;
    background: rgb(var(--w) / 0.5);
    font-weight: 700;
  }
  .rm {
    color: var(--ink-soft);
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .rm:hover {
    background: rgb(var(--w) / 0.9);
    color: var(--ink);
  }
</style>
