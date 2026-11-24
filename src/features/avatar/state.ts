import { writable } from 'svelte/store';
import type { Settings } from '../../core/settings';

/** Whether the avatar editor is open. Anything can open it (the sidebar, an adventure). */
export const avatarEditorOpen = writable(false);
/** Which tab the editor should open on (set just before opening it; the editor clears it). */
export const avatarEditorTab = writable<string | null>(null);
/** Used as a click handler too, so anything that is not a tab name (an event) is ignored. */
export const openAvatarEditor = (tab?: unknown) => {
  avatarEditorTab.set(typeof tab === 'string' ? tab : null);
  avatarEditorOpen.set(true);
};
export const closeAvatarEditor = () => avatarEditorOpen.set(false);

/** True once the person has a drawn avatar or a picture to show. */
export const hasAvatar = (s: Pick<Settings, 'avatar' | 'avatarMode' | 'avatarPicture'>): boolean => !!s.avatar || (s.avatarMode === 'picture' && s.avatarPicture > 0);
