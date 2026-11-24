/**
 * Puts a portrait (drawn, or a picture the person chose) inside its round clip, and a frame around it.
 * The result is one SVG string, sized so the picture stays the same when a frame is added.
 */
import type { AvatarConfig } from './avatar';
import { portraitInner } from './draw';
import { FRAME_MARGIN, cleanFrame, frameSvg } from './frames';

const LINE = '#5b5678';

function wrap(uid: string, defs: string, inside: string, frame: string, label: string, edge = true): string {
  const f = cleanFrame(frame);
  const fr = f === 'none' ? { defs: '', body: '' } : frameSvg(f, uid);
  const m = f === 'none' ? 0 : FRAME_MARGIN;
  const box = `${-m} ${-m} ${120 + 2 * m} ${120 + 2 * m}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" role="img" aria-label="${label}">` +
    `<defs><clipPath id="clip-${uid}"><circle cx="60" cy="60" r="59"/></clipPath>${defs}${fr.defs}</defs>` +
    `<g clip-path="url(#clip-${uid})">${inside}</g>` +
    // a thin edge on the portrait itself (frames bring their own)
    (f === 'none' && edge ? `<circle cx="60" cy="60" r="58.8" fill="none" stroke="${LINE}" stroke-width="2.4" opacity="0.45"/>` : '') +
    fr.body +
    `</svg>`
  );
}

/** The drawn avatar, optionally with a frame. */
export function avatarSvg(a: AvatarConfig, uid = 'a', frame = 'none'): string {
  const p = portraitInner(a, uid);
  // the flat storybook style has no outlines at all, so no edge line either
  return wrap(uid, p.defs, p.body, frame, 'Your avatar', a.style !== 'flat');
}

/** A picture the person chose (an image address), optionally with a frame. */
export function pictureSvg(url: string, uid = 'p', frame = 'none'): string {
  const safe = url.replace(/"/g, '%22');
  return wrap(uid, '', `<rect width="120" height="120" fill="#e6e2f0"/><image href="${safe}" x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid slice"/>`, frame, 'Your picture');
}

/** What an empty frame preview looks like (a plain circle): used by the frame picker. */
export function framePreviewSvg(frame: string, uid = 'f'): string {
  return wrap(uid, '', `<rect width="120" height="120" fill="#f1eefb"/><circle cx="60" cy="48" r="20" fill="#cfc7ee"/><path d="M18 120C18 88 36 78 60 78C84 78 102 88 102 120Z" fill="#cfc7ee"/>`, frame, 'Frame preview');
}
