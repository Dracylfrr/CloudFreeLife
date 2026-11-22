import { MEMORY_ICON_IDS } from '../../../core/manifests';

/** Little pastel pictures for the cards. Each is drawn in a 64 x 64 box. */
const L = '#6e6a8e';

const face = '<circle cx="27" cy="37" r="2.4" fill="#6e6a8e" stroke="none"/><circle cx="37" cy="37" r="2.4" fill="#6e6a8e" stroke="none"/><path d="M29 42q3 3 6 0" fill="none"/>';

export const MEMORY_ICONS: Record<(typeof MEMORY_ICON_IDS)[number], string> = {
  cloud: `<path d="M17 47a11 11 0 0 1 1-22a15 15 0 0 1 28 4a9 9 0 0 1 0 18z" fill="#ffffff"/>${face}`,
  star: '<path d="M32 8l7.5 16 17.5 2-13 12 3.5 17.500L32 46l-15.500 9.500L20 38 7 26l17.500-2z" fill="#fff2bd"/>',
  moon: '<path d="M40 9a23 23 0 1 0 15 36A19 19 0 0 1 40 9z" fill="#fff3c4"/><circle cx="26" cy="36" r="2.200" fill="#6e6a8e" stroke="none"/><path d="M22 43q4 3 8 0" fill="none"/>',
  sun: '<circle cx="32" cy="32" r="12" fill="#ffe9a8"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6" fill="none"/>',
  heart: '<path d="M32 54C13 41 9 28 15 20a10.500 10.500 0 0 1 17 4a10.500 10.500 0 0 1 17-4c6 8 2 21-17 34z" fill="#ffd3e2"/>',
  drop: '<path d="M32 8c12 16 19 25 19 33a19 19 0 0 1-38 0c0-8 7-17 19-33z" fill="#bfe4f7"/><path d="M23 42a9 9 0 0 0 6 8" fill="none" stroke="#fff" stroke-width="3"/>',
  flower: '<g fill="#f6b8cf"><circle cx="32" cy="17" r="9"/><circle cx="46" cy="28" r="9"/><circle cx="41" cy="45" r="9"/><circle cx="23" cy="45" r="9"/><circle cx="18" cy="28" r="9"/></g><circle cx="32" cy="34" r="7" fill="#fff2bd"/>',
  leaf: '<path d="M11 53C11 28 28 11 53 11c0 25-17 42-42 42z" fill="#a9dcb4"/><path d="M14 50L40 24" fill="none"/>',
  balloon: '<ellipse cx="32" cy="26" rx="16" ry="20" fill="#d9cdf6"/><path d="M29 46l3 5 3-5z" fill="#d9cdf6"/><path d="M32 51q7 5 0 12" fill="none"/><path d="M24 18q2-5 7-6" fill="none" stroke="#fff" stroke-width="3"/>',
  shell: '<path d="M10 48a22 22 0 0 1 44 0z" fill="#ffdcc8"/><path d="M32 26v22M21 30l5 18M43 30l-5 18" fill="none"/>',
  rainbow: '<path d="M8 48a24 24 0 0 1 48 0" fill="none" stroke="#f6b8cf" stroke-width="7"/><path d="M15 48a17 17 0 0 1 34 0" fill="none" stroke="#fff2bd" stroke-width="7"/><path d="M22 48a10 10 0 0 1 20 0" fill="none" stroke="#bfe4f7" stroke-width="7"/>',
  mushroom: '<rect x="25" y="32" width="14" height="20" rx="5" fill="#fff8ec"/><path d="M9 36a23 22 0 0 1 46 0z" fill="#ffc3b0"/><circle cx="22" cy="28" r="3" fill="#fff" stroke="none"/><circle cx="36" cy="23" r="3.500" fill="#fff" stroke="none"/><circle cx="45" cy="31" r="2.500" fill="#fff" stroke="none"/>',
  fish: '<path d="M44 32l13-11v22z" fill="#a9dcb4"/><ellipse cx="28" cy="32" rx="19" ry="13" fill="#bdeeea"/><circle cx="20" cy="29" r="2.600" fill="#6e6a8e" stroke="none"/><path d="M17 37q4 3 8 0" fill="none"/>',
  butterfly: '<path d="M32 32C20 10 5 17 11 31 5 46 21 53 32 37z" fill="#e6d8f8"/><path d="M32 32c12-22 27-15 21-1 6 15-10 22-21 6z" fill="#e6d8f8"/><path d="M32 20v28M32 20q-5-6-9-6M32 20q5-6 9-6" fill="none"/>',
  planet: '<circle cx="32" cy="32" r="15" fill="#c6ecda"/><ellipse cx="32" cy="32" rx="27" ry="8" transform="rotate(-20 32 32)" fill="none"/><path d="M20 28q12-5 24 0" fill="none" stroke="#a9dcb4" stroke-width="4"/>'
};

export function iconSvg(id: string): string {
  const body = (MEMORY_ICONS as Record<string, string>)[id] ?? '';
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke="${L}" stroke-width="2.600" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
}
