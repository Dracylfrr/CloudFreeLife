<script lang="ts">
  import { route } from './core/router';
  import { catalog } from './core/content/registry';
  import AmbientBackground from './ui/AmbientBackground.svelte';
  import Sidebar from './ui/Sidebar.svelte';
  import DialogHost from './ui/DialogHost.svelte';
  import Logo from './ui/Logo.svelte';
  import UpdateNotice from './features/updates/UpdateNotice.svelte';
  import Home from './features/home/Home.svelte';
  import Books from './features/books/Books.svelte';
  import BookView from './features/books/BookView.svelte';
  import FreeDraw from './features/painting/FreeDraw.svelte';
  import Gallery from './features/gallery/Gallery.svelte';
  import MiniGames from './features/minigames/MiniGames.svelte';
  import Stories from './features/stories/Stories.svelte';
  import Updates from './features/updates/Updates.svelte';
  import Settings from './features/settings/Settings.svelte';
  import About from './features/about/About.svelte';
  import Meditation from './features/meditation/Meditation.svelte';
  import Movement from './features/movement/Movement.svelte';

  const immersive = $derived($route.name === 'paint' || $route.name === 'breaker' || $route.name === 'splash' || $route.name === 'memory' || $route.name === 'puzzle' || $route.name === 'bubbles' || $route.name === 'catcher' || $route.name === 'zen' || $route.name === 'flow');
</script>

<AmbientBackground calm={immersive} />

{#if !$catalog.ready}
  <div class="boot"><Logo size={96} /></div>
{:else}
  <div class="shell">
    {#if $route.name !== 'paint'}
      <Sidebar />
    {/if}
    <main class="content">
      {#key $route.name + ($route.name === 'paint' ? $route.artworkId : $route.name === 'book' ? $route.bookId : $route.name === 'story' ? $route.storyId : $route.name === 'adventure' ? $route.adventureId : $route.name === 'meditate' ? $route.sessionId : $route.name === 'moves' ? $route.cardId : '')}
        {#if $route.name === 'home'}
          <Home />
        {:else if $route.name === 'books'}
          <Books />
        {:else if $route.name === 'book'}
          <BookView bookId={$route.bookId} />
        {:else if $route.name === 'draw'}
          <FreeDraw />
        {:else if $route.name === 'paint'}
          {#await import('./features/painting/Painter.svelte') then m}
            <m.default artworkId={$route.artworkId} />
          {/await}
        {:else if $route.name === 'gallery'}
          <Gallery />
        {:else if $route.name === 'stories'}
          <Stories kind="story" tab={$route.tab} />
        {:else if $route.name === 'story'}
          {#await import('./features/stories/StoryReader.svelte') then m}
            <m.default storyId={$route.storyId} />
          {/await}
        {:else if $route.name === 'adventures'}
          <Stories kind="adventure" tab={$route.tab} />
        {:else if $route.name === 'adventure'}
          {#await import('./features/stories/AdventurePlayer.svelte') then m}
            <m.default adventureId={$route.adventureId} />
          {/await}
        {:else if $route.name === 'minigames'}
          <MiniGames game={$route.game} />
        {:else if $route.name === 'breaker'}
          {#await import('./features/minigames/breaker/BreakerScreen.svelte') then m}
            <m.default levelId={$route.levelId} mode={$route.mode ?? 'relax'} />
          {/await}
        {:else if $route.name === 'splash'}
          {#await import('./features/minigames/splash/SplashScreen.svelte') then m}
            <m.default levelId={$route.levelId} />
          {/await}
        {:else if $route.name === 'memory'}
          {#await import('./features/minigames/memory/MemoryScreen.svelte') then m}
            <m.default levelId={$route.levelId} />
          {/await}
        {:else if $route.name === 'puzzle'}
          {#await import('./features/minigames/puzzle/PuzzleScreen.svelte') then m}
            <m.default levelId={$route.levelId} />
          {/await}
        {:else if $route.name === 'bubbles'}
          {#await import('./features/minigames/bubbles/BubbleScreen.svelte') then m}
            <m.default levelId={$route.levelId} mode={$route.mode ?? 'relax'} />
          {/await}
        {:else if $route.name === 'catcher'}
          {#await import('./features/minigames/catcher/CatcherScreen.svelte') then m}
            <m.default levelId={$route.levelId} mode={$route.mode ?? 'relax'} />
          {/await}
        {:else if $route.name === 'zen'}
          {#await import('./features/minigames/zen/ZenScreen.svelte') then m}
            <m.default levelId={$route.levelId} gardenId={$route.gardenId} />
          {/await}
        {:else if $route.name === 'flow'}
          {#await import('./features/minigames/flow/FlowScreen.svelte') then m}
            <m.default levelId={$route.levelId} mode={$route.mode ?? 'puzzle'} />
          {/await}
        {:else if $route.name === 'meditation'}
          <Meditation />
        {:else if $route.name === 'meditate'}
          {#await import('./features/meditation/Session.svelte') then m}
            <m.default sessionId={$route.sessionId} />
          {/await}
        {:else if $route.name === 'movement'}
          <Movement />
        {:else if $route.name === 'moves'}
          {#await import('./features/movement/MoveCard.svelte') then m}
            <m.default cardId={$route.cardId} />
          {/await}
        {:else if $route.name === 'updates'}
          <Updates />
        {:else if $route.name === 'settings'}
          <Settings tab={$route.tab} />
        {:else if $route.name === 'about'}
          <About />
        {/if}
      {/key}
    </main>
  </div>
  <UpdateNotice />
{/if}
<DialogHost />

<style>
  .shell {
    position: relative;
    z-index: 1;
    display: flex;
    height: 100%;
  }
  .content {
    flex: 1;
    min-width: 0;
    height: 100%;
    position: relative;
  }
  .boot {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    z-index: 5;
  }
</style>
