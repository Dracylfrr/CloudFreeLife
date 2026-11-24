import { writable } from 'svelte/store';
import type { Settings } from '../../core/settings';

/** Whether the avatar editor is open. Anything can open it (the sidebar, an adventure). */
export const avatarEditorOpen = writable(false);
export const openAvatarEditor = () => avatarEditorOpen.set(true);
export const closeAvatarEditor = () => avatarEditorOpen.set(false);

/** True once the person has a drawn avatar or a picture to show. */
export const hasAvatar = (s: Pick<Settings, 'avatar' | 'avatarMode' | 'avatarPicture'>): boolean => !!s.avatar || (s.avatarMode === 'picture' && s.avatarPicture > 0);
