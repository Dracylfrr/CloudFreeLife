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
  import { addToAlbum, albums, albumsOf, createAlbum, deleteAlbum, kindOf, matchesQuery, removeFromAlbum, renameAlbum, MAX_ALBUMS, MAX_ALBUM_NAME } from './albums';

  let version = $state(0);
  let busyId = $state<string | null>(null);

  // search and filters
  let query = $state('');
  let filter = $state<string>('all'); // all | coloring | free | splash | album:<id>
  let menuFor = $state<string | null>(null); // the painting whose "Albums" menu is open

  const kinds = $derived([
    { id: 'all', label: 'All', count: $artworks.length },
    { id: 'coloring', label: 'Coloring pages', count: $artworks.filter((a) => kindOf(a) === 'coloring').length },
    { id: 'free', label: 'Free Draw', count: $artworks.filter((a) => kindOf(a) === 'free').length },
    { id: 'splash', label: 'Splash Wall', count: $artworks.filter((a) => kindOf(a) === 'splash').length }
  ]);
  const shown = $derived(
    $artworks.filter((a) => {
      if (filter.startsWith('album:')) {
        if (!$albums.albums.find((x) => x.id === filter.slice(6))?.art.includes(a.id)) return false;
      } else if (filter !== 'all' && kindOf(a) !== filter) return false;
      return matchesQuery(`${a.title} ${bookName(a)} ${pageName(a)}`, query);
    })
  );
  const currentAlbum = $derived(filter.startsWith('album:') ? $albums.albums.find((a) => a.id === filter.slice(6)) : undefined);
  // an album that was deleted must not leave the view stuck on it
  $effect(() => {
    if (filter.startsWith('album:') && !currentAlbum) filter = 'all';
  });

  async function newAlbum(forArt?: string) {
    if ($albums.albums.length >= MAX_ALBUMS) {
      toast(`You can have ${MAX_ALBUMS} albums. Remove one to make room.`, 'info');
      return;
    }
    const name = await promptDialog({ title: 'New album', message: 'What should it be called?', confirmLabel: 'Create', input: { value: '', maxLength: MAX_ALBUM_NAME } });
    if (!name) return;
    const id = createAlbum(name);
    if (id && forArt) addToAlbum(id, forArt);
  }
  async function renameCurrent() {
    if (!currentAlbum) return;
    const name = await promptDialog({ title: 'Rename album', message: 'Give this album a name you like.', confirmLabel: 'Rename', input: { value: currentAlbum.name, maxLength: MAX_ALBUM_NAME } });
    if (name) renameAlbum(currentAlbum.id, name);
  }
  async function deleteCurrent() {
    if (!currentAlbum) return;
    const ok = await confirmDialog({ title: 'Delete this album?', message: `The album “${currentAlbum.name}” will be removed. The paintings in it stay in your Gallery.`, confirmLabel: 'Delete album', danger: true });
    if (ok) deleteAlbum(currentAlbum.id);
  }
  function toggleIn(albumId: string, artId: string, on: boolean) {
    if (on) addToAlbum(albumId, artId);
    else removeFromAlbum(albumId, artId);
  }

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

  {#if $artworks.length > 0}
    <div class="finder">
      <label class="search">
        <Icon name="grid" size={16} />
        <span class="sr-only">Search your paintings</span>
        <input type="search" placeholder="Search by name" bind:value={query} />
      </label>
      <div class="chips" role="group" aria-label="Show">
        {#each kinds as k}
          <button class:on={filter === k.id} aria-pressed={filter === k.id} onclick={() => (filter = k.id)}>{k.label}<span>{k.count}</span></button>
        {/each}
        {#each $albums.albums as al (al.id)}
          <button class:on={filter === 'album:' + al.id} aria-pressed={filter === 'album:' + al.id} onclick={() => (filter = 'album:' + al.id)}><Icon name="folder" size={13} /> {al.name}<span>{al.art.length}</span></button>
        {/each}
        <button class="add" onclick={() => newAlbum()}><Icon name="plus" size={13} /> New album</button>
      </div>
      {#if currentAlbum}
        <div class="album-tools">
          <strong>{currentAlbum.name}</strong>
          <Button size="sm" variant="ghost" icon="edit" onclick={renameCurrent}>Rename album</Button>
          <Button size="sm" variant="ghost" icon="trash" onclick={deleteCurrent}>Delete album</Button>
        </div>
      {/if}
    </div>
  {/if}

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
  {:else if shown.length === 0}
    <p class="nothing">{query ? 'Nothing matches that search.' : filter.startsWith('album:') ? 'This album is empty. Use the folder button on a painting to add it.' : 'Nothing here yet.'}</p>
  {:else}
    <div class="grid cards">
      {#each shown as a (a.id)}
        <article class="card" class:busy={busyId === a.id}>
          <button class="open" onclick={() => openArtwork(a.id)} aria-label="Open {a.title}">
            <ArtThumb art={a} {version} />
          </button>
          <div class="info">
            <h3 title={a.title}>{a.title}</h3>
            <p class="meta"><Icon name="book" size={13} /> {bookName(a)} · {pageName(a)}</p>
            <p class="meta"><Icon name="refresh" size={13} /> {formatDate(a.updatedAt)}</p>
            {#if albumsOf($albums, a.id).length}<p class="meta"><Icon name="folder" size={13} /> {albumsOf($albums, a.id).map((x) => x.name).join(', ')}</p>{/if}
          </div>
          <div class="acts">
            <Button size="sm" variant="primary" icon="brush" onclick={() => openArtwork(a.id)}>Open</Button>
            <div class="albummenu">
              <Button size="sm" variant="ghost" icon="folder" title="Albums" onclick={() => (menuFor = menuFor === a.id ? null : a.id)} />
              {#if menuFor === a.id}
                <div class="menu" role="group" aria-label="Albums for {a.title}">
                  {#each $albums.albums as al (al.id)}
                    <label><input type="checkbox" checked={al.art.includes(a.id)} onchange={(e) => toggleIn(al.id, a.id, e.currentTarget.checked)} /> {al.name}</label>
                  {/each}
                  {#if $albums.albums.length === 0}<p class="small muted">No albums yet.</p>{/if}
                  <button class="newin" onclick={() => { menuFor = null; void newAlbum(a.id); }}><Icon name="plus" size={13} /> New album…</button>
                </div>
              {/if}
            </div>
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
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 290px), 1fr));
    max-width: 1280px;
  }
  .card {
    background: var(--panel);
    border-radius: var(--radius-xl);
    padding: 12px;
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
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
    flex-wrap: wrap;
    gap: 4px 2px;
    align-items: center;
    padding: 0 4px 4px;
    min-width: 0;
  }
  .acts :global(.btn.ghost.sm) {
    padding: 7px 9px;
  }
  .acts :global(.btn.primary) {
    margin-right: auto;
  }
  .finder {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    max-width: 1280px;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--panel-strong);
    box-shadow: var(--shadow-s);
    max-width: 420px;
    color: var(--ink-soft);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    outline: none;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chips button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.86rem;
    color: var(--ink-soft);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .chips button span {
    font-size: 0.75rem;
    padding: 0 6px;
    border-radius: 999px;
    background: rgb(var(--w) / 0.7);
  }
  .chips button.on {
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    color: var(--nav-ink);
  }
  .chips button.add {
    border: 2px dashed var(--line);
    background: transparent;
    box-shadow: none;
  }
  .album-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .nothing {
    color: var(--ink-soft);
    font-weight: 700;
    padding: 24px 8px;
  }
  .albummenu {
    position: relative;
  }
  .menu {
    position: absolute;
    bottom: 100%;
    left: 0;
    z-index: 8;
    min-width: 180px;
    max-height: 220px;
    overflow-y: auto;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--panel-strong);
    box-shadow: var(--shadow-l);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .menu label {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 700;
    font-size: 0.88rem;
    color: var(--ink);
  }
  .newin {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 0 0;
    font-weight: 800;
    font-size: 0.86rem;
    color: var(--lavender-deep);
    text-align: left;
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
