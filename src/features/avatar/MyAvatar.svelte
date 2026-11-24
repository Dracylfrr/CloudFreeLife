<script lang="ts">
  import { settings } from '../../core/settings';
  import Avatar from './Avatar.svelte';
  import { loadPicture, pictureUrl } from './picture';

  /** The person's own avatar, as they chose it: the drawn look or their picture, with their frame. */
  let { size = 46 }: { size?: number } = $props();

  // read the saved picture whenever a new one has been made
  $effect(() => {
    void $settings.avatarPicture;
    void loadPicture();
  });
  const url = $derived($settings.avatarMode === 'picture' ? $pictureUrl : null);
</script>

<Avatar avatar={$settings.avatar} {size} frame={$settings.avatarFrame} pictureUrl={url} />
