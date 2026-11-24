<script lang="ts" module>
  let counter = 0;
</script>

<script lang="ts">
  import type { AvatarConfig } from './avatar';
  import { avatarSvg, pictureSvg } from './render';
  import { FRAME_MARGIN } from './frames';

  /**
   * An avatar as a round picture: the drawn look, or a picture the person chose, with an optional
   * frame. Until one has been chosen it is a soft empty circle. `size` is the portrait's size; a
   * frame adds its margin around it.
   */
  let { avatar, size = 46, frame = 'none', pictureUrl = null }: { avatar: AvatarConfig | null; size?: number; frame?: string; pictureUrl?: string | null } = $props();
  const uid = `av${++counter}`;
  const svg = $derived(pictureUrl ? pictureSvg(pictureUrl, uid, frame) : avatar ? avatarSvg(avatar, uid, frame) : '');
  const total = $derived(frame !== 'none' && svg ? size * (1 + (2 * FRAME_MARGIN) / 120) : size);
</script>

{#if svg}
  <span class="av" style="--s:{total}px">{@html svg}</span>
{:else}
  <span class="av blank" style="--s:{size}px" aria-hidden="true">
    <svg viewBox="0 0 120 120"><circle cx="60" cy="50" r="19" fill="currentColor" opacity="0.28" /><path d="M20 112C20 86 38 76 60 76C82 76 100 86 100 112Z" fill="currentColor" opacity="0.28" /></svg>
    <i>+</i>
  </span>
{/if}

<style>
  .av {
    display: inline-block;
    position: relative;
    width: var(--s);
    height: var(--s);
    flex: none;
    border-radius: 50%;
    line-height: 0;
  }
  .av :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }
  .blank {
    border: 2px dashed var(--ink-faint);
    color: var(--ink-soft);
    background: rgb(var(--w) / 0.55);
    overflow: hidden;
  }
  .blank svg {
    position: absolute;
    inset: 0;
  }
  .blank i {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 40%;
    height: 40%;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-style: normal;
    font-weight: 900;
    font-size: calc(var(--s) * 0.3);
    line-height: 1;
    color: var(--nav-ink);
    background: linear-gradient(135deg, var(--nav-a), var(--nav-b));
    box-shadow: var(--shadow-s);
  }
</style>
