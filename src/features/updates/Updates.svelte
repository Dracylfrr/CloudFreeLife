<script lang="ts">
  import { onMount } from 'svelte';
  import { settings } from '../../core/settings';
  import { APP_VERSION } from '../../core/version';
  import { GITHUB_RELEASES_PAGE } from '../../core/config';
  import { loadCatalog } from '../../core/content/registry';
  import { confirmDialog, toast } from '../../core/feedback';
  import { formatBytes, formatDate } from '../../core/util';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import { listInstalledPacks, uninstallPack, type InstalledPackRecord } from './packs';
  import { checkForUpdates, describeUpdate, downloadAppInstaller, installContentUpdate, openOfficialLink, revealPath, updateKey, updateState } from './updater';
  import type { UpdateItem } from './release';

  let installed = $state<InstalledPackRecord[]>([]);
  let downloaded = $state<Record<string, string>>({});
  const checking = $derived($updateState.outcome === 'checking');

  async function refreshInstalled() {
    installed = await listInstalledPacks();
  }
  onMount(refreshInstalled);

  async function install(u: UpdateItem) {
    const r = await installContentUpdate(u);
    toast(r.message, r.ok ? 'success' : 'error', 4200);
    if (r.ok) await refreshInstalled();
  }

  async function getInstaller(u: UpdateItem) {
    const r = await downloadAppInstaller(u);
    if (r.ok && r.path) {
      downloaded = { ...downloaded, [updateKey(u)]: r.path };
      toast(r.message, 'success');
    } else toast(r.message, 'error', 4500);
  }

  async function remove(p: InstalledPackRecord) {
    const ok = await confirmDialog({ title: `Remove ${p.name}?`, message: 'This removes the downloaded content. Artwork you made with it stays in your Gallery.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    await uninstallPack(p.id);
    await loadCatalog();
    await refreshInstalled();
  }
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Update Center</p>
      <h1>Updates</h1>
      <p class="sub">New versions and new content come from the official GitHub Releases page. Everything is verified before it is used.</p>
    </div>
    <Button variant="primary" icon="refresh" disabled={checking} onclick={() => checkForUpdates()}>{checking ? 'Checking…' : 'Check for Updates'}</Button>
  </header>

  <section class="status {$updateState.outcome}">
    <div class="ico"><Icon name={$updateState.outcome === 'available' ? 'sparkle' : $updateState.outcome === 'offline' || $updateState.outcome === 'error' ? 'cloud' : 'check'} size={26} /></div>
    <div>
      <strong>
        {#if $updateState.outcome === 'idle'}Cloud-Freelife v{APP_VERSION}
        {:else if checking}Checking GitHub…
        {:else if $updateState.outcome === 'available'}{$updateState.available.length} {$updateState.available.length === 1 ? 'update is' : 'updates are'} ready
        {:else if $updateState.outcome === 'up_to_date'}You're up to date
        {:else if $updateState.outcome === 'offline'}Couldn't reach GitHub
        {:else}Couldn't check for updates{/if}
      </strong>
      <p class="muted">
        {#if $updateState.message && $updateState.outcome !== 'idle'}{$updateState.message}
        {:else}You're running v{APP_VERSION}. {$settings.lastUpdateCheck ? `Last checked ${formatDate($settings.lastUpdateCheck)}.` : 'Updates are checked once when the app starts.'}{/if}
      </p>
    </div>
  </section>

  {#if $updateState.available.length}
    <h2 class="h">Available</h2>
    <div class="list">
      {#each $updateState.available as u (updateKey(u))}
        {@const busy = $updateState.busy.includes(updateKey(u))}
        <article class="item">
          <div class="badge" class:app={u.kind === 'app'}><Icon name={u.kind === 'app' ? 'cloudDown' : 'book'} size={22} /></div>
          <div class="body">
            <h3>{describeUpdate(u)}</h3>
            {#if u.kind === 'app'}
              <p class="muted">{u.notes ? u.notes.slice(0, 220) : 'A new version of Cloud-Freelife.'}</p>
              {#if u.asset}<p class="fine">Installer {formatBytes(u.asset.size)} · SHA-256 verified before use · you choose when to run it</p>{/if}
              {#if downloaded[updateKey(u)]}<p class="fine ok">Saved to {downloaded[updateKey(u)]}</p>{/if}
            {:else}
              <p class="muted">{u.description || 'New content for Cloud-Freelife.'}</p>
              <p class="fine">v{u.version} · {formatBytes(u.asset.size)} · checksum verified before installing</p>
            {/if}
          </div>
          <div class="btns">
            {#if u.kind === 'app'}
              {#if downloaded[updateKey(u)]}
                <Button size="sm" variant="mint" icon="folder" onclick={() => revealPath(downloaded[updateKey(u)])}>Show installer</Button>
              {:else if u.asset}
                <Button size="sm" variant="primary" icon="download" disabled={busy} onclick={() => getInstaller(u)}>{busy ? 'Downloading…' : 'Download'}</Button>
              {/if}
              <Button size="sm" variant="soft" icon="external" onclick={() => openOfficialLink(u.releaseUrl)}>Release notes</Button>
            {:else}
              <Button size="sm" variant="primary" icon="download" disabled={busy} onclick={() => install(u)}>{busy ? 'Installing…' : 'Install'}</Button>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}

  <h2 class="h">Downloaded content</h2>
  {#if installed.length === 0}
    <p class="muted empty">Nothing downloaded yet. New coloring books, palettes and game levels will appear here and install in one click.</p>
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
    Cloud-Freelife only contacts GitHub when you check for updates or install content. No personal data is ever sent.
    <button class="lnk" onclick={() => openOfficialLink(GITHUB_RELEASES_PAGE)}>Open the releases page</button>
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
    border: 1px solid rgba(255, 255, 255, 0.85);
  }
  .ico {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--mint);
    color: #2e5a4b;
    flex: none;
  }
  .status.available .ico {
    background: var(--pink);
    color: #8a3f5f;
  }
  .status.offline .ico,
  .status.error .ico {
    background: var(--butter);
    color: #7a6420;
  }
  .status.checking .ico {
    background: var(--sky);
    color: #2f5c80;
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
    color: #5d4fb0;
    flex: none;
  }
  .badge.app {
    background: var(--sky);
    color: #2f5c80;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .fine {
    font-size: 0.82rem;
    color: var(--ink-faint);
    font-weight: 600;
    margin-top: 2px;
  }
  .fine.ok {
    color: #3f8a6a;
    user-select: text;
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
  .lnk {
    color: var(--lavender-deep);
    font-weight: 800;
    margin-left: 6px;
  }
</style>
