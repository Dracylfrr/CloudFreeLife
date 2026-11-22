<script lang="ts">
  import { findBook, findPage, catalog } from '../../core/content/registry';
  import { confirmDialog, promptDialog, toast } from '../../core/feedback';
  import { navigate } from '../../core/router';
  import { formatDate } from '../../core/util';
  import { CANVAS_H, CANVAS_W } from '../../core/config';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import ArtThumb from './ArtThumb.svelte';
  import { artworks, artworksLoaded, clearArtworkPaint, deleteArtwork, duplicateArtwork, renameArtwork, type ArtworkMeta } from './artwork';
  import { exportArtworkPng } from './exportArtwork';
  import { savePngFile } from '../painting/export';
  import { openArtwork } from '../books/open';

  let version = $state(0);
  let busyId = $state<string | null>(null);

  function bookName(a: ArtworkMeta) {
    void $catalog;
    return findBook(a.bookId)?.manifest.name ?? (a.bookId === 'free_canvas' ? 'Free Canvas' : a.bookId);
  }
  function pageName(a: ArtworkMeta) {
    if (!a.pageId) return 'Free drawing';
    void $catalog;
    return findPage(a.bookId, a.pageId)?.manifest.name ?? a.pageId;
  }

  async function rename(a: ArtworkMeta) {
    const name = await promptDialog({ title: 'Rename artwork', message: 'Give this picture a name you like.', confirmLabel: 'Rename', input: { value: a.title, maxLength: 60 } });
    if (name) await renameArtwork(a.id, name);
  }
  async function duplicate(a: ArtworkMeta) {
    busyId = a.id;
    const c = await duplicateArtwork(a.id);
    busyId = null;
    toast(c ? 'Duplicated ✨' : "Couldn't duplicate that artwork.", c ? 'success' : 'error');
  }
  async function exportPng(a: ArtworkMeta) {
    busyId = a.id;
    try {
      const bytes = await exportArtworkPng(a.id);
      if (bytes) await savePngFile(bytes, a.title);
      else toast("Couldn't render that artwork.", 'error');
    } finally {
      busyId = null;
    }
  }
  async function clear(a: ArtworkMeta) {
    const ok = await confirmDialog({
      title: 'Clear this artwork?',
      message: `All the color on “${a.title}” will be removed. The page itself stays.`,
      confirmLabel: 'Clear',
      danger: true
    });
    if (!ok) return;
    await clearArtworkPaint(a.id);
    version++;
    toast('Cleared', 'info', 1800);
  }
  async function remove(a: ArtworkMeta) {
    const ok = await confirmDialog({
      title: 'Delete this artwork?',
      message: `“${a.title}” will be deleted from this computer. This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true
    });
    if (ok) {
      await deleteArtwork(a.id);
      toast('Deleted', 'info', 1800);
    }
  }
  void CANVAS_W;
  void CANVAS_H;
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Your art</p>
      <h1>Gallery</h1>
      <p class="sub">Everything you've painted, saved automatically on this computer.</p>
    </div>
    <span class="count">{$artworks.length} {$artworks.length === 1 ? 'work' : 'works'}</span>
  </header>

  {#if $artworksLoaded && $artworks.length === 0}
    <div class="empty">
      <div class="cloud">☁</div>
      <h2>Nothing here yet</h2>
      <p class="muted">Paint a page or start a free drawing and it will appear here.</p>
      <div class="eb">
        <Button variant="primary" icon="book" onclick={() => navigate({ name: 'books' })}>Coloring Books</Button>
        <Button variant="soft" icon="brush" onclick={() => navigate({ name: 'draw' })}>Free Draw</Button>
      </div>
    </div>
  {:else}
    <div class="grid cards">
      {#each $artworks as a (a.id)}
        <article class="card" class:busy={busyId === a.id}>
          <button class="open" onclick={() => openArtwork(a.id)} aria-label="Open {a.title}">
            <ArtThumb art={a} {version} />
          </button>
          <div class="info">
            <h3 title={a.title}>{a.title}</h3>
            <p class="meta"><Icon name="book" size={13} /> {bookName(a)} · {pageName(a)}</p>
            <p class="meta"><Icon name="refresh" size={13} /> {formatDate(a.updatedAt)}</p>
          </div>
          <div class="acts">
            <Button size="sm" variant="primary" icon="brush" onclick={() => openArtwork(a.id)}>Open</Button>
            <Button size="sm" variant="ghost" icon="copy" title="Duplicate" onclick={() => duplicate(a)} />
            <Button size="sm" variant="ghost" icon="edit" title="Rename" onclick={() => rename(a)} />
            <Button size="sm" variant="ghost" icon="download" title="Export PNG" onclick={() => exportPng(a)} />
            <Button size="sm" variant="ghost" icon="ban" title="Clear colors" onclick={() => clear(a)} />
            <Button size="sm" variant="ghost" icon="trash" title="Delete" onclick={() => remove(a)} />
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .count {
    background: var(--panel-strong);
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 800;
    box-shadow: var(--shadow-s);
  }
  .cards {
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    max-width: 1280px;
  }
  .card {
    background: var(--panel);
    border-radius: var(--radius-xl);
    padding: 12px;
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.85);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform 0.25s var(--ease);
  }
  .card:hover {
    transform: translateY(-3px);
  }
  .card.busy {
    opacity: 0.6;
    pointer-events: none;
  }
  .open {
    display: block;
    border-radius: 20px;
    overflow: hidden;
  }
  .info {
    padding: 2px 8px 0;
  }
  .info h3 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-soft);
    font-size: 0.82rem;
    font-weight: 600;
    margin-top: 3px;
  }
  .acts {
    display: flex;
    gap: 2px;
    align-items: center;
    padding: 0 4px 4px;
  }
  .acts :global(.btn.primary) {
    margin-right: auto;
  }
  .empty {
    text-align: center;
    padding: 70px 20px;
  }
  .cloud {
    font-size: 4rem;
    opacity: 0.8;
  }
  .eb {
    margin-top: 22px;
    display: flex;
    gap: 12px;
    justify-content: center;
  }
</style>
