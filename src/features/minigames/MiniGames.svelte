<script lang="ts">
  import { navigate } from '../../core/router';
  import { catalog, asset, type LoadedBreakerLevel, type LoadedMemoryLevel, type LoadedSplashLevel } from '../../core/content/registry';
  import Icon from '../../ui/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import { sfx } from '../../core/audio';

  const breaker = $derived($catalog.breakerLevels);
  const splash = $derived($catalog.splashLevels);
  const memory = $derived($catalog.memoryLevels);

  let thumbs = $state<Record<string, string | null>>({});
  $effect(() => {
    const all: (LoadedBreakerLevel | LoadedSplashLevel | LoadedMemoryLevel)[] = [...breaker, ...splash, ...memory];
    let live = true;
    Promise.all(all.map(async (l) => [l.manifest.id, await asset(l.tree, l.dir, l.manifest.thumbnail).url()] as const)).then((e) => {
      if (live) thumbs = Object.fromEntries(e);
    });
    return () => {
      live = false;
    };
  });
</script>

<div class="page">
  <header class="page-head">
    <div>
      <p class="eyebrow">Take a little break</p>
      <h1>Mini-Games</h1>
      <p class="sub">Three calm games. Every level is open from the start — no locks, no pressure.</p>
    </div>
  </header>

  <section class="game">
    <div class="game-head">
      <div class="gico breaker"><Icon name="grid" size={26} /></div>
      <div>
        <h2>Pastel Breaker</h2>
        <p class="muted">Bounce the ball and pop soft pastel blocks into bubbles and stars.</p>
      </div>
      <div class="modes">
        <Button size="sm" variant="mint" onclick={() => navigate({ name: 'breaker', mode: 'relax', levelId: breaker[0]?.manifest.id })}>Relax</Button>
        <Button size="sm" variant="soft" onclick={() => navigate({ name: 'breaker', mode: 'classic', levelId: breaker[0]?.manifest.id })}>Classic</Button>
        <Button size="sm" variant="peach" onclick={() => navigate({ name: 'breaker', mode: 'endless' })}>Endless</Button>
      </div>
    </div>
    <div class="levels">
      {#each breaker as l (l.manifest.id)}
        <button class="lv" onclick={() => { sfx.pop(); navigate({ name: 'breaker', levelId: l.manifest.id, mode: 'relax' }); }}>
          <span class="th">{#if thumbs[l.manifest.id]}<img src={thumbs[l.manifest.id]} alt="" draggable="false" />{/if}</span>
          <strong>{l.manifest.name}</strong>
          <small>{l.manifest.objective}</small>
        </button>
      {/each}
    </div>
  </section>

  <section class="game">
    <div class="game-head">
      <div class="gico splash"><Icon name="paintball" size={26} /></div>
      <div>
        <h2>Splash Wall</h2>
        <p class="muted">Aim, charge and throw cartoon water balloons to splash color across illustrated walls.</p>
      </div>
      <div class="modes">
        <Button size="sm" variant="primary" onclick={() => navigate({ name: 'splash', levelId: splash[0]?.manifest.id })}>Play</Button>
      </div>
    </div>
    <div class="levels">
      {#each splash as l (l.manifest.id)}
        <button class="lv" onclick={() => { sfx.pop(); navigate({ name: 'splash', levelId: l.manifest.id }); }}>
          <span class="th">{#if thumbs[l.manifest.id]}<img src={thumbs[l.manifest.id]} alt="" draggable="false" />{/if}</span>
          <strong>{l.manifest.name}</strong>
          <small>{l.manifest.objective}</small>
        </button>
      {/each}
    </div>
  </section>

  {#if memory.length}
    <section class="game">
      <div class="game-head">
        <div class="gico memory"><Icon name="heart" size={26} /></div>
        <div>
          <h2>Memory Meadow</h2>
          <p class="muted">Flip soft pastel cards and find the pairs. No timer, no lives — and a hint whenever you like.</p>
        </div>
        <div class="modes">
          <Button size="sm" variant="mint" onclick={() => navigate({ name: 'memory', levelId: memory[0]?.manifest.id })}>Play</Button>
        </div>
      </div>
      <div class="levels">
        {#each memory as l (l.manifest.id)}
          <button class="lv" onclick={() => { sfx.pop(); navigate({ name: 'memory', levelId: l.manifest.id }); }}>
            <span class="th">{#if thumbs[l.manifest.id]}<img src={thumbs[l.manifest.id]} alt="" draggable="false" />{/if}</span>
            <strong>{l.manifest.name}</strong>
            <small>{l.manifest.objective}</small>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .page {
    max-width: 1180px;
  }
  .game {
    margin-bottom: 38px;
    padding: 22px 24px 26px;
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-m);
    border: 1px solid rgba(255, 255, 255, 0.85);
  }
  .game-head {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 20px;
  }
  .game-head > div:nth-child(2) {
    flex: 1;
  }
  .gico {
    width: 58px;
    height: 58px;
    border-radius: 20px;
    display: grid;
    place-items: center;
    flex: none;
  }
  .gico.breaker {
    background: linear-gradient(135deg, #cdebf9, #e3d8f8);
    color: #4c3f9c;
  }
  .gico.memory {
    background: linear-gradient(135deg, #d4f1e3, #cdebf9);
    color: #2e5a4b;
  }
  .gico.splash {
    background: linear-gradient(135deg, #ffe0cf, #ffd3e2);
    color: #8a3f5f;
  }
  .modes {
    display: flex;
    gap: 8px;
  }
  .levels {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 16px;
  }
  .lv {
    display: flex;
    flex-direction: column;
    gap: 3px;
    text-align: left;
    padding: 10px 10px 12px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.75);
    box-shadow: var(--shadow-s);
    transition: transform 0.2s var(--ease);
  }
  .lv:hover {
    transform: translateY(-3px);
    background: #fff;
  }
  .th {
    aspect-ratio: 4/3;
    border-radius: 16px;
    overflow: hidden;
    background: #f4f0fb;
    display: block;
    margin-bottom: 6px;
  }
  .th img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .lv strong {
    padding: 0 4px;
  }
  .lv small {
    padding: 0 4px;
    color: var(--ink-soft);
    font-weight: 600;
    line-height: 1.3;
  }
</style>
