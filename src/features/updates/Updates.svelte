<script lang="ts">
  import { onMount } from 'svelte';
  import { settings, updateSettings } from '../../core/settings';
  import { APP_VERSION } from '../../core/version';
  import { BRAND_NAME } from '../../core/brand';
  import { loadCatalog } from '../../core/content/registry';
  import { confirmDialog, toast } from '../../core/feedback';
  import { formatBytes, formatDate } from '../../core/util';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Toggle from '../../ui/Toggle.svelte';
  import { listInstalledPacks, uninstallPack, type InstalledPackRecord } from './packs';
  import { addLicense, describeLicense, licenseState, loadLicense, removeLicense } from '../premium/license';
  import { canSelfUpdate, checkForUpdates, describeUpdate, installUpdate, revealPath, updateKey, updateState } from './updater';
  import type { UpdateItem } from './release';

  let installed = $state<InstalledPackRecord[]>([]);
  const checking = $derived($updateState.outcome === 'checking');

  async function refreshInstalled() {
    installed = await listInstalledPacks();
  }
  // An installed copy can update itself quietly; one unpacked from the portable zip cannot.
  let selfUpdate = $state(false);
  let licenseInput = $state<HTMLInputElement | undefined>();
  async function chooseLicense(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 64 * 1024) return void toast('That file is not a valid license.', 'error', 4500);
    const r = await addLicense(await file.text());
    if (r.ok) {
      toast('Your license is added. Checking for your content…', 'success', 4500);
      void checkForUpdates();
    } else toast(r.error, 'error', 4500);
  }
  async function lookAgain() {
    const s = await loadLicense();
    toast(s.status === 'ok' ? 'Your license was found. Checking for your content…' : 'No license file was found in your Project D.R.E.A.M folder.', s.status === 'ok' ? 'success' : 'info', 4500);
    if (s.status === 'ok') void checkForUpdates();
  }
  async function forgetLicense() {
    const ok = await confirmDialog({ title: 'Remove your license?', message: 'Content you already installed stays. Premium content you have not installed yet will be locked again until you add the license back.', confirmLabel: 'Remove', danger: true });
    if (!ok) return;
    await removeLicense();
    void checkForUpdates();
  }
  onMount(() => {
    void loadLicense();
    void refreshInstalled();
    void canSelfUpdate().then((v) => (selfUpdate = v));
  });

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

  // The premium section says nothing until there is premium content to talk about: a premium pack on offer
  // (locked, or ready to install with the license), so nobody is asked for a license that has nothing to open.
  const showPremium = $derived($updateState.locked.length > 0 || $updateState.available.some((u) => u.kind === 'content' && u.premium === true));
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
        {#if $updateState.outcome === 'idle'}{BRAND_NAME} v{APP_VERSION}
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

  <div class="startup">
    <Toggle label="Check for updates when the app starts" description="One quick check for a new version and new content. Never repeated in the background." checked={$settings.checkUpdatesOnStartup} onchange={(v) => updateSettings({ checkUpdatesOnStartup: v })} />
  </div>

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
        <h2>{u.headline ?? `A new version of ${BRAND_NAME}`}</h2>

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
            {#if u.asset}Download size {formatBytes(u.asset.size)} · checked with SHA-256 before use · {selfUpdate ? 'updates quietly and reopens {BRAND_NAME}, keeping everything' : 'you choose when to run it'}{:else}No verified installer is attached to this release yet.{/if}
          </p>
          <div class="btns">
            {#if saved}
              <Button size="sm" variant="mint" icon="folder" onclick={() => revealPath(saved)}>Show installer</Button>
            {:else if u.asset}
              <Button variant="primary" icon="download" disabled={busy} onclick={() => install(u)}>{busy ? (selfUpdate ? 'Updating…' : 'Downloading…') : selfUpdate ? 'Update now' : 'Install'}</Button>
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
              <p class="muted">{u.description || 'New content for Project D.R.E.A.M.'}</p>
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

  {#if showPremium}
  <h2 class="h">Premium content</h2>
  <article class="item">
    <div class="badge"><Icon name="shield" size={22} /></div>
    <div class="body">
      {#if $licenseState.status === 'ok'}
        <h3>{$licenseState.found.length > 1 ? 'Your licenses are active' : 'Your license is active'}</h3>
        <p class="muted">{describeLicense($licenseState.info)}. Your premium content shows up above under New content, ready to install.</p>
      {:else if $licenseState.status === 'bad'}
        <h3>Your license could not be used</h3>
        <p class="muted">{$licenseState.message}</p>
      {:else}
        <h3>Add a license</h3>
        <p class="muted">Premium series and adventures open with a license file (.dreamlicense). Put it in the Project D.R.E.A.M folder and the app applies it by itself, then removes the file. Or choose it here. It stays on this computer, and nothing about you is sent anywhere.</p>
      {/if}
    </div>
    <div class="btns">
      <input class="hidden" type="file" accept=".dreamlicense,application/json" bind:this={licenseInput} onchange={chooseLicense} aria-label="Choose a license file" />
      <Button size="sm" variant={$licenseState.status === 'ok' ? 'soft' : 'primary'} icon="folder" onclick={() => licenseInput?.click()}>{$licenseState.status === 'ok' ? 'Add another license' : 'Choose license file'}</Button>
      <Button size="sm" variant="ghost" icon="refresh" onclick={lookAgain}>Look again</Button>
      {#if $licenseState.status === 'ok' || $licenseState.status === 'bad'}<Button size="sm" variant="ghost" icon="trash" onclick={forgetLicense}>Remove</Button>{/if}
    </div>
  </article>
  {#if $updateState.locked.length}
    <div class="list">
      {#each $updateState.locked as p (p.id)}
        <article class="item locked">
          <div class="badge"><Icon name="shield" size={22} /></div>
          <div class="body">
            <h3>{p.name}</h3>
            <p class="muted">{p.description || 'Premium content for Project D.R.E.A.M.'}</p>
            <p class="fine">Locked · needs a license that includes it</p>
          </div>
        </article>
      {/each}
    </div>
  {/if}

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
    Project D.R.E.A.M only goes online when you check for updates or install content, and it never sends personal information. Everything else works offline.
  </p>
</div>

<style>
  .page {
    max-width: 960px;
  }
  .hidden {
    display: none;
  }
  .startup {
    margin-top: 14px;
  }
  .item.locked {
    opacity: 0.85;
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
