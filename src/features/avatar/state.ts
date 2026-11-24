import { writable } from 'svelte/store';

/** Whether the avatar editor is open. Anything can open it (the sidebar, an adventure). */
export const avatarEditorOpen = writable(false);
export const openAvatarEditor = () => avatarEditorOpen.set(true);
export const closeAvatarEditor = () => avatarEditorOpen.set(false);
