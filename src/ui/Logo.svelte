<script lang="ts">
  import { settings } from '../core/settings';
  import { iconSvg, nextIconUid } from '../core/appIcon';

  // The Cloud-Freelife mark: a soft cloud with a paintbrush and a pastel paint mark.
  // It follows the App icon choice in Settings unless a specific `variant` is given (the picker does).
  let { size = 48, variant }: { size?: number; variant?: string } = $props();
  const uid = nextIconUid();
  const svg = $derived(iconSvg(variant ?? $settings.appIcon, size, uid));
</script>

<span class="logo" style="width:{size}px;height:{size}px">{@html svg}</span>

<style>
  .logo {
    display: inline-flex;
    flex: none;
    line-height: 0;
  }
</style>
