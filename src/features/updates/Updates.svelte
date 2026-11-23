<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '../../core/settings';
  import { APP_VERSION } from '../../core/version';
  import { loadCatalog } from '../../core/content/registry';
  import { confirmDialog, toast } from '../../core/feedback';
  import { formatBytes, formatDate } from '../../core/util';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { listInstalledPacks, uninstallPack, type InstalledPackRecord } from './packs';
  import { checkForUpdates, describeUpdate, installUpdate, revealPath, updateKey, updateState } from './updater';
  import type { UpdateItem } from './release';

  let installed = $state<InstalledPackRecord[]>([]);
  const checking = $derived($updateState.outcome === 'checking');

  async function refreshInstalled() {
    installed = await listInstalledPacks();
  }
  onMount(refreshInstalled);

  async function install(u: UpdateItem) {
    const r = await installUpdate(u);
    toast(r.message, r.ok ? 'success' : 'error', 4500);
    if (r.ok && u.kind === 'content') await refreshInstalled();
  }

  async function remove(p: InstalledPackRecord) {
    const ok = await confirmDialog({ title: `Remove ${p.name}?`, message: 'This removes the downloaded content. Artwork you made with it stays in your Gallery.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    await uninstallPack(p.id);
    await loadCatalog();
    await refreshInstalled();
  }

  const appUpdates = $derived($updateState.available.filter((u) => u.kind === 'app'));
  const contentUpdates = $derived($updateState.available.filter((u) => u.kind === 'content'));
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Update Center</p>
      <h1>Updates</h1>
      <p class="sub">New versions and new content arrive here. Everything is checked before it is used, and nothing changes until you say so.</p>
    </div>
    <Button variant="primary" icon="refresh" disabled={checking} onclick={() => checkForUpdates()}>{checking ? 'Checking…' : 'Check for Updates'}</Button>
  </header>

  <section class="status {$updateState.outcome}">
    <div class="ico"><Icon name={$updateState.outcome === 'available' ? 'sparkle' : $updateState.outcome === 'offline' || $updateState.outcome === 'error' ? 'cloud' : 'check'} size={26} /></div>
    <div>
      <strong>
        {#if $updateState.outcome === 'idle'}Cloud-Freelife v{APP_VERSION}
        {:else if checking}Checking for updates…
        {:else if $updateState.outcome === 'available'}{$updateState.available.length} {$updateState.available.length === 1 ? 'update is' : 'updates are'} ready
        {:else if $updateState.outcome === 'up_to_date'}You're up to date
        {:else if $updateState.outcome === 'offline'}Couldn't reach the update service
        {:else}Couldn't check for updates{/if}
      </strong>
      <p class="muted">
        {#if $updateState.outcome === 'available'}Installed: v{APP_VERSION}. Choose what to install below.
        {:else if $updateState.message && $updateState.outcome !== 'idle'}{$updateState.message}
        {:else}You're running v{APP_VERSION}. {$settings.lastUpdateCheck ? `Last checked ${formatDate($settings.lastUpdateCheck)}.` : 'Updates are checked once when the app starts.'}{/if}
      </p>
    </div>
  </section>

  {#each appUpdates as u (updateKey(u))}
    {#if u.kind === 'app'}
      {@const busy = $updateState.busy.includes(updateKey(u))}
      {@const saved = $updateState.installers[updateKey(u)]}
      <article class="release">
        <div class="versions" aria-label="Version change">
          <span class="v">v{APP_VERSION}<small>Installed</small></span>
          <Icon name="chevronRight" size={20} />
          <span class="v new">v{u.version}<small>Available</small></span>
        </div>
        <h2>{u.headline ?? 'A new version of Cloud-Freelife'}</h2>

        {#if u.notes}
          <h3 class="mini">What's new</h3>
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <div class="notes" tabindex="0" role="region" aria-label="Release notes">{u.notes}</div>
        {/if}

        {#if u.includes.length}
          <h3 class="mini">Content included</h3>
          <ul class="chips">
            {#each u.includes as name}<li>{name}</li>{/each}
          </ul>
        {/if}

        <div class="foot-row">
          <p class="fine">
            {#if u.asset}Download size {formatBytes(u.asset.size)} · checked with SHA-256 before use · you choose when to run it{:else}No verified installer is attached to this release yet.{/if}
          </p>
          <div class="btns">
            {#if saved}
              <Button size="sm" variant="mint" icon="folder" onclick={() => revealPath(saved)}>Show installer</Button>
            {:else if u.asset}
              <Button variant="primary" icon="download" disabled={busy} onclick={() => install(u)}>{busy ? 'Downloading…' : 'Install'}</Button>
            {/if}
          </div>
        </div>
        {#if saved}<p class="fine ok">Saved to {saved}. Open it to finish updating.</p>{/if}
      </article>
    {/if}
  {/each}

  {#if contentUpdates.length}
    <h2 class="h">New content</h2>
    <div class="list">
      {#each contentUpdates as u (updateKey(u))}
        {#if u.kind === 'content'}
          {@const busy = $updateState.busy.includes(updateKey(u))}
          <article class="item">
            <div class="badge"><Icon name="book" size={22} /></div>
            <div class="body">
              <h3>{describeUpdate(u)}</h3>
              <p class="muted">{u.description || 'New content for Cloud-Freelife.'}</p>
              <p class="fine">v{u.version} · {formatBytes(u.asset.size)} · checksum verified before installing</p>
            </div>
            <div class="btns">
              <Button size="sm" variant="primary" icon="download" disabled={busy} onclick={() => install(u)}>{busy ? 'Installing…' : 'Install'}</Button>
            </div>
          </article>
        {/if}
      {/each}
    </div>
  {/if}

  <h2 class="h">Downloaded content</h2>
  {#if installed.length === 0}
    <p class="muted empty">Nothing downloaded yet. New coloring books, palettes, stories and game levels will appear here and install in one click.</p>
  {:else}
    <div class="list">
      {#each installed as p (p.id)}
        <article class="item">
          <div class="badge"><Icon name="check" size={22} /></div>
          <div class="body">
            <h3>{p.name}</h3>
            <p class="fine">v{p.version} · installed {formatDate(p.installedAt)}</p>
          </div>
          <div class="btns"><Button size="sm" variant="ghost" icon="trash" onclick={() => remove(p)}>Remove</Button></div>
        </article>
      {/each}
    </div>
  {/if}

  <p class="foot muted">
    Cloud-Freelife only goes online when you check for updates or install content, and it never sends personal information. Everything else works offline.
  </p>
</div>

<style>
  .page {
    max-width: 960px;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 20px 24px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
  }
  .ico {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--mint);
    color: var(--c-green);
    flex: none;
  }
  .status.available .ico {
    background: var(--pink);
    color: var(--c-rose);
  }
  .status.offline .ico,
  .status.error .ico {
    background: var(--butter);
    color: var(--c-gold);
  }
  .status.checking .ico {
    background: var(--sky);
    color: var(--c-blue);
  }
  .release {
    margin-top: 22px;
    padding: 24px 28px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgb(var(--w) / 0.85);
  }
  .versions {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
    color: var(--ink-soft);
  }
  .v {
    display: flex;
    flex-direction: column;
    font-size: 1.35rem;
    font-weight: 900;
    color: var(--ink);
    line-height: 1.1;
  }
  .v small {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-soft);
  }
  .v.new {
    color: var(--c-violet);
  }
  .release h2 {
    margin-bottom: 4px;
  }
  .mini {
    margin: 16px 0 6px;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
  }
  .notes {
    white-space: pre-wrap;
    max-height: 220px;
    overflow-y: auto;
    padding: 14px 18px;
    border-radius: 18px;
    background: rgb(var(--w) / 0.55);
    color: var(--ink);
    font-size: 0.93rem;
    line-height: 1.55;
    user-select: text;
  }
  .chips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chips li {
    padding: 5px 13px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 800;
    background: var(--lilac);
    color: var(--c-violet);
  }
  .foot-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
  .foot-row .fine {
    margin: 0;
    flex: 1;
    min-width: 220px;
  }
  .h {
    margin: 34px 0 14px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 16px 20px;
    border-radius: var(--radius-l);
    background: var(--panel);
    box-shadow: var(--shadow-s);
  }
  .badge {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: var(--lilac);
    color: var(--c-violet);
    flex: none;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .fine {
    font-size: 0.82rem;
    color: var(--ink-soft);
    font-weight: 600;
    margin-top: 2px;
  }
  .fine.ok {
    color: var(--c-green2);
    user-select: text;
    margin-top: 10px;
  }
  .btns {
    display: flex;
    gap: 6px;
    flex: none;
  }
  .empty {
    padding: 8px 4px;
  }
  .foot {
    margin-top: 36px;
    font-size: 0.88rem;
  }
  @media (max-width: 700px) {
    .item {
      flex-wrap: wrap;
    }
    .release {
      padding: 20px 18px;
    }
  }
</style>
