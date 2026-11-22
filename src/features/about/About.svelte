<script lang="ts">
  import Logo from '../../ui/Logo.svelte';
  import Icon from '../../ui/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import { APP_NAME, APP_VERSION } from '../../core/version';
  import { GITHUB_RELEASES_PAGE } from '../../core/config';
  import { openOfficialLink } from '../updates/updater';
  import { catalog } from '../../core/content/registry';

  const pages = $derived($catalog.books.reduce((n, b) => n + b.pages.length, 0));
  const levels = $derived($catalog.breakerLevels.length + $catalog.splashLevels.length);
</script>

<div class="page">
  <div class="about">
    <div class="logo"><Logo size={120} /></div>
    <h1>{APP_NAME}</h1>
    <p class="ver">Version {APP_VERSION}</p>
    <p class="blurb">A small, gentle place to color, draw and play. No scores to chase, no accounts to make — just soft colors and slow clouds.</p>

    <div class="stats">
      <div><b>{$catalog.books.length}</b><span>books</span></div>
      <div><b>{pages}</b><span>coloring pages</span></div>
      <div><b>{levels}</b><span>game levels</span></div>
      <div><b>{$catalog.palettes.length}</b><span>palettes</span></div>
    </div>

    <ul class="facts">
      <li><Icon name="shield" size={20} /><div><strong>Private by design</strong><span>No telemetry, analytics, accounts or personal data. The only network use is checking GitHub for updates.</span></div></li>
      <li><Icon name="cloud" size={20} /><div><strong>Works offline</strong><span>Painting, the Gallery, mini-games and settings never need the Internet.</span></div></li>
      <li><Icon name="folder" size={20} /><div><strong>Your art is yours</strong><span>Saved on your computer, outside the install folder. Updates never touch it.</span></div></li>
    </ul>

    <div class="btns">
      <Button variant="soft" icon="external" onclick={() => openOfficialLink(GITHUB_RELEASES_PAGE)}>Releases on GitHub</Button>
    </div>
    <p class="fine">Made with soft colors. Fonts: Nunito (SIL Open Font License).</p>
  </div>
</div>

<style>
  .about {
    max-width: 640px;
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 0;
  }
  .logo {
    filter: drop-shadow(0 14px 22px rgba(130, 110, 200, 0.3));
    margin-bottom: 6px;
  }
  .ver {
    color: var(--lavender-deep);
    font-weight: 800;
  }
  .blurb {
    color: var(--ink-soft);
    font-size: 1.05rem;
    max-width: 520px;
    margin: 8px 0 16px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    width: 100%;
  }
  .stats div {
    background: var(--panel);
    border-radius: 20px;
    padding: 14px 6px;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-s);
  }
  .stats b {
    font-size: 1.6rem;
    color: #6a58c4;
  }
  .stats span {
    color: var(--ink-soft);
    font-size: 0.8rem;
    font-weight: 700;
  }
  .facts {
    list-style: none;
    padding: 0;
    margin: 18px 0 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    text-align: left;
  }
  .facts li {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 14px 18px;
    border-radius: 20px;
    background: var(--panel);
    box-shadow: var(--shadow-s);
    color: #6a58c4;
  }
  .facts div {
    display: flex;
    flex-direction: column;
    color: var(--ink);
  }
  .facts span {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .fine {
    color: var(--ink-faint);
    font-size: 0.8rem;
    margin-top: 8px;
  }
</style>
