import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ACCENT_COLORS, START_STYLE, SCENES, SCENE_LABEL, BODIES, CHINS, EARRINGS, EARS, EYE_SHAPES, GLASSES, HAIR_ACCS, HAIR_STYLES, HATS, LIMITS, MAX_LOOKS, MOUTHS, OUTFITS, PRESETS, STYLES, cleanLookName, mix, presetFor, sanitizeAvatar, sanitizeLooks,
  styleDefaults, type AvatarConfig
} from '../src/features/avatar/avatar';
import { headPath } from '../src/features/avatar/draw';
import { lock } from '../src/features/avatar/scenes';
import { FRAMES, FRAME_GROUPS, FRAME_MARGIN, cleanFrame, frameSvg, isFrame } from '../src/features/avatar/frames';
import { avatarSvg, pictureSvg } from '../src/features/avatar/render';
import { DEFAULT_CROP, MAX_PICTURE_BYTES, ZOOM_MAX, ZOOM_MIN, checkPictureFile, clampOffset, coverScale } from '../src/features/avatar/picture';
import { hasAvatar } from '../src/features/avatar/state';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';

const seeded = (seed = 7) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const pick = <T>(list: readonly T[], r: () => number): T => list[Math.floor(r() * list.length)];
const clean = (svg: string) => {
  expect(svg.startsWith('<svg')).toBe(true);
  expect(svg.endsWith('</svg>')).toBe(true);
  expect(svg).not.toContain('undefined');
  expect(svg).not.toContain('NaN');
  expect(svg).not.toContain('Infinity');
  // every tag is closed the way an XML parser needs
  expect((svg.match(/<(?!\/|!)[^>]*[^/]>/g) ?? []).filter((t) => /^<(path|circle|ellipse|rect|stop|image)\b/.test(t))).toEqual([]);
};

describe('Storybook is the only avatar style', () => {
  it('is the one style, and the one new avatars start in', () => {
    expect([...STYLES]).toEqual(['flat']);
    expect(START_STYLE).toBe('flat');
    expect(presetFor('girl').style).toBe('flat');
    expect(presetFor('boy').style).toBe('flat');
    expect(PRESETS.girl.style).toBe('flat');
    const src = readFileSync('src/features/avatar/AvatarEditor.svelte', 'utf8');
    expect(src).not.toContain("id: 'style'");
    expect(src).not.toContain('Art style');
  });
  it('avatars made in any older style open as Storybook, keeping their colors, hair, clothes and accessories', () => {
    for (const style of ['chibi', 'anime', 'real', 'cel', 'illus', 'paint', 'oil', undefined]) {
      const a = sanitizeAvatar({
        base: 'boy', style, skin: '#c68a5f', hair: '#123456', hairStyle: 'bob', eyes: '#3f8f6a', outfit: 'hoodie', outfitColor: '#7fb4e0', background: '#d9eefb',
        headW: 85, headH: 110, chin: 'pointed', eyeShape: 'fierce', eyeSize: 62, eyeGap: 110, mouth: 'open', ears: 'small', neckLen: 12, neckWidth: 10,
        hat: 'cap', glasses: 'sun', earrings: 'hoops', hairAcc: 'bow', scene: 'castle'
      })!;
      expect(a.style, String(style)).toBe('flat');
      expect(a.skin).toBe('#c68a5f');
      expect(a.hair).toBe('#123456');
      expect(a.hairStyle).toBe('bob');
      expect(a.eyes).toBe('#3f8f6a');
      expect(a.outfit).toBe('hoodie');
      expect(a.hat).toBe('cap');
      expect(a.glasses).toBe('sun');
      expect(a.earrings).toBe('hoops');
      expect(a.hairAcc).toBe('bow');
      expect(a.scene).toBe('castle');
      // the head, eyes, mouth and neck go back to Storybook's usual shape
      const d = styleDefaults();
      expect([a.headW, a.headH, a.chin, a.eyeShape, a.eyeSize, a.eyeGap, a.mouth, a.ears, a.neckLen, a.neckWidth]).toEqual([d.headW, d.headH, d.chin, d.eyeShape, d.eyeSize, d.eyeGap, d.mouth, d.ears, d.neckLen, d.neckWidth]);
    }
  });
  it('a Storybook avatar keeps the head and face shape it was given', () => {
    const a = sanitizeAvatar({ base: 'girl', style: 'flat', headW: 90, headH: 110, chin: 'pointed', eyeShape: 'cat', eyeSize: 70, neckLen: 9 })!;
    expect([a.headW, a.headH, a.chin, a.eyeShape, a.eyeSize, a.neckLen]).toEqual([90, 110, 'pointed', 'cat', 70, 9]);
  });
  it('an avatar from 1.7.0 opens as the Storybook starting look', () => {
    const old = { base: 'girl', skin: '#fbd3b8', hair: '#8a5a3c', hairStyle: 'long', eyes: '#3d6fb5', outfit: 'dress', outfitColor: '#ffd3e2', background: '#e6dcfa' };
    expect(sanitizeAvatar(old)).toEqual(PRESETS.girl);
  });
});

describe('Avatar data', () => {
  it('has no pointed ears at all', () => {
    expect([...EARS]).toEqual(['round', 'small']);
    expect(PRESETS.girl.ears).toBe('round');
    expect(sanitizeAvatar({ base: 'girl', style: 'flat', ears: 'pointed' })!.ears).toBe('round');
    for (const ears of EARS) expect(avatarSvg({ ...presetFor('girl'), ears }, 'x')).not.toMatch(/M32 63C25 62/);
    expect(readFileSync('src/features/avatar/AvatarEditor.svelte', 'utf8')).not.toMatch(/pointed ears/i);
  });
  it('offers plenty of choices', () => {
    for (const list of [HATS, GLASSES, EARRINGS, HAIR_ACCS, EYE_SHAPES, CHINS, BODIES, MOUTHS]) expect(list.length).toBeGreaterThanOrEqual(3);
    expect(EARRINGS).toEqual(expect.arrayContaining(['studs', 'hoops']));
    expect(GLASSES).toContain('sun');
    expect(HATS).toContain('cap');
    expect(ACCENT_COLORS.length).toBeGreaterThanOrEqual(10);
  });
  it('has a crown, a tiara and a flower crown that show on the forehead', () => {
    for (const hat of ['crown', 'tiara', 'flowers'] as const) {
      expect(HATS).toContain(hat);
      expect(avatarSvg({ ...presetFor('girl'), hat, hatColor: '#e8c04a' }, 'x')).toContain('#e8c04a');
    }
    expect(sanitizeAvatar({ ...presetFor('girl'), hat: 'crown' })!.hat).toBe('crown');
  });
  it('keeps sliders inside their limits and ignores junk', () => {
    const a = sanitizeAvatar({ base: 'boy', style: 'flat', headW: 500, headH: -3, eyeSize: 'big', eyeGap: 1e9, neckLen: Infinity, neckWidth: NaN, hat: 'sombrero', glasses: 3, earrings: 'rings', hairAcc: null })!;
    expect(a.headW).toBe(LIMITS.headW.max);
    expect(a.headH).toBe(LIMITS.headH.min);
    expect(a.eyeSize).toBe(styleDefaults().eyeSize);
    expect(a.eyeGap).toBe(LIMITS.eyeGap.max);
    expect(a.neckLen).toBe(styleDefaults().neckLen);
    expect(a.neckWidth).toBe(styleDefaults().neckWidth);
    expect(a.hat).toBe('none');
    expect(a.glasses).toBe('none');
    expect(a.earrings).toBe('none');
    expect(a.hairAcc).toBe('none');
  });
  it('blends colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#102030', '#102030', 0.9)).toBe('#102030');
  });
});

describe('Drawing', () => {
  it('draws every combination of shape, accessory, outfit, scene and frame', () => {
    const r = seeded(11);
    for (let i = 0; i < 500; i++) {
      const a: AvatarConfig = {
        ...presetFor(pick(['girl', 'boy'] as const, r)),
        hairStyle: pick(HAIR_STYLES, r),
        outfit: pick(OUTFITS, r),
        chin: pick(CHINS, r),
        eyeShape: pick(EYE_SHAPES, r),
        mouth: pick(MOUTHS, r),
        ears: pick(EARS, r),
        body: pick(BODIES, r),
        hat: pick(HATS, r),
        glasses: pick(GLASSES, r),
        earrings: pick(EARRINGS, r),
        hairAcc: pick(HAIR_ACCS, r),
        scene: pick(SCENES, r),
        headW: LIMITS.headW.min + Math.floor(r() * 41),
        headH: LIMITS.headH.min + Math.floor(r() * 41),
        eyeSize: LIMITS.eyeSize.min + Math.floor(r() * 76),
        eyeGap: LIMITS.eyeGap.min + Math.floor(r() * 34),
        neckLen: Math.floor(r() * 15),
        neckWidth: LIMITS.neckWidth.min + r() * 5
      };
      clean(avatarSvg(a, 'u' + i, pick(['none', ...FRAMES.map((f) => f.id)], r)));
    }
  });
  it('has no outlines, noise or rough edges: flat, clean shapes', () => {
    for (const hairStyle of HAIR_STYLES) {
      const svg = avatarSvg({ ...presetFor('girl'), hairStyle }, 'x');
      expect(svg).not.toContain('feTurbulence');
      expect(svg).not.toContain('feDisplacementMap');
      expect(svg).not.toContain('filter id');
      expect(svg).not.toContain('#5b5678');
    }
  });
  it('shows the chosen eye color', () => {
    expect(avatarSvg({ ...presetFor('girl'), eyes: '#3d6fb5' }, 'x')).not.toBe(avatarSvg({ ...presetFor('girl'), eyes: '#d9973a' }, 'x'));
  });
  it('a tapered lock (used by the backgrounds) has a root and a tip', () => {
    const d = lock(10, 10, 30, 40, 6, 2);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain('30 40');
    expect(lock(5, 5, 5, 5, 4)).not.toContain('NaN');
  });
  it('shows chosen accessories in the drawing', () => {
    const base = presetFor('girl');
    expect(avatarSvg(base, 'x')).not.toContain('#e8c04a');
    expect(avatarSvg({ ...base, earrings: 'hoops', earringColor: '#e8c04a' }, 'x')).toContain('#e8c04a');
    expect(avatarSvg({ ...base, hat: 'cap', hatColor: '#d7684f' }, 'x')).toContain('#d7684f');
    expect(avatarSvg({ ...base, glasses: 'sun', glassesColor: '#123456' }, 'x')).toContain('#123456');
    expect(avatarSvg({ ...base, hairAcc: 'bow', hairAccColor: '#654321' }, 'x')).toContain('#654321');
  });
  it('stretches the head and moves the body for neck length and body type', () => {
    const base = presetFor('girl');
    expect(avatarSvg({ ...base, headW: 90, headH: 110 }, 'x')).toContain('scale(0.9 1.1)');
    expect(avatarSvg({ ...base, neckLen: 10, body: 'broad' }, 'x')).toContain('translate(60 10) scale(1.2 1)');
  });
  it('makes closed head outlines for every chin', () => {
    for (const chin of CHINS) {
      const d = headPath(chin);
      expect(d.startsWith('M')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
      expect(d).not.toContain('NaN');
    }
    expect(headPath('pointed')).not.toBe(headPath('round'));
  });
  it('hides a bun or tall spikes under a hat', () => {
    const base = { ...presetFor('girl'), hairStyle: 'bun' as const };
    expect(avatarSvg(base, 'x')).toContain('r="12"');
    expect(avatarSvg({ ...base, hat: 'cap' }, 'x')).not.toContain('r="12"');
  });
});

describe('Frames', () => {
  it('has plain, soft and earned frames, and the ornate ones are gone', () => {
    expect(FRAMES.length).toBeGreaterThanOrEqual(18);
    for (const g of FRAME_GROUPS) expect(FRAMES.some((f) => f.group === g)).toBe(true);
    expect(FRAMES.some((f) => f.id.startsWith('ornate'))).toBe(false);
    expect(FRAMES.filter((f) => f.group === 'Soft themes').length).toBeGreaterThanOrEqual(3);
    expect(FRAMES.filter((f) => f.unlock).length).toBe(FRAMES.filter((f) => f.group === 'Earned').length);
    expect(new Set(FRAMES.map((f) => f.id)).size).toBe(FRAMES.length);
    for (const id of ['silver', 'gold', 'sky', 'rainbow']) expect(FRAMES.some((f) => f.id === id)).toBe(true);
  });
  it('knows which ids are frames', () => {
    expect(isFrame('none')).toBe(true);
    expect(isFrame('gold')).toBe(true);
    expect(isFrame('nope')).toBe(false);
    expect(isFrame(5)).toBe(false);
    expect(cleanFrame('nope')).toBe('none');
    expect(cleanFrame('rainbow')).toBe('rainbow');
    // an ornate frame chosen in 1.7.1 becomes the gold ring
    expect(cleanFrame('ornate-star')).toBe('gold');
    expect(isFrame('ornate-star')).toBe(false);
  });
  it('draws each frame around the portrait, with room made for it', () => {
    const base = presetFor('girl');
    expect(avatarSvg(base, 'x', 'none')).toContain('viewBox="0 0 120 120"');
    for (const f of FRAMES) {
      const f1 = frameSvg(f.id, 'x');
      expect(f1.body.length, f.id).toBeGreaterThan(50);
      const svg = avatarSvg(base, 'x', f.id);
      clean(svg);
      expect(svg).toContain(`viewBox="${-FRAME_MARGIN} ${-FRAME_MARGIN} ${120 + 2 * FRAME_MARGIN} ${120 + 2 * FRAME_MARGIN}"`);
    }
    expect(frameSvg('none', 'x')).toEqual({ defs: '', body: '' });
    expect(avatarSvg(base, 'x', 'bogus')).toContain('viewBox="0 0 120 120"');
  });
  it('keeps gradient ids apart between pictures on one page', () => {
    const a = avatarSvg(presetFor('girl'), 'one', 'gold');
    const b = avatarSvg(presetFor('girl'), 'two', 'gold');
    expect(a).toContain('fr-one');
    expect(b).not.toContain('fr-one');
  });
});

describe('Pictures from the computer', () => {
  it('scales a picture to cover the circle, then by the zoom', () => {
    expect(coverScale(600, 400, 280, 1)).toBeCloseTo(0.7);
    expect(coverScale(400, 600, 280, 2)).toBeCloseTo(1.4);
    expect(coverScale(400, 600, 280, 99)).toBeCloseTo((280 / 400) * ZOOM_MAX);
    expect(coverScale(400, 600, 280, -3)).toBeCloseTo((280 / 400) * ZOOM_MIN);
    expect(coverScale(0, 0, 280, 1)).toBe(1);
  });
  it('keeps the picture from being dragged away', () => {
    expect(clampOffset(40, 280)).toBe(40);
    expect(clampOffset(9999, 280)).toBe(140);
    expect(clampOffset(-9999, 280)).toBe(-140);
    expect(clampOffset(NaN, 280)).toBe(0);
    expect(DEFAULT_CROP).toEqual({ zoom: 1, rotation: 0, x: 0, y: 0 });
  });
  it('accepts normal pictures and refuses everything else with a plain message', () => {
    expect(checkPictureFile({ type: 'image/png', size: 5000 })).toBeNull();
    expect(checkPictureFile({ type: 'image/jpeg', size: 5000 })).toBeNull();
    expect(checkPictureFile({ type: 'image/svg+xml', size: 5000 })).toMatch(/PNG, JPG/);
    expect(checkPictureFile({ type: 'application/pdf', size: 5000 })).toMatch(/choose/i);
    expect(checkPictureFile({ type: 'image/png', size: MAX_PICTURE_BYTES + 1 })).toMatch(/12 MB/);
    expect(checkPictureFile({ type: 'image/png', size: 0 })).toMatch(/empty/);
  });
  it('shows the picture inside the round clip, with a frame if wanted', () => {
    const svg = pictureSvg('blob:http://x/abc', 'p', 'silver');
    expect(svg).toContain('<image href="blob:http://x/abc"');
    expect(svg).toContain('clip-path="url(#clip-p)"');
    expect(svg).toContain('fr-p');
    expect(pictureSvg('a"b', 'p')).not.toContain('a"b');
  });
});

describe('Saved looks', () => {
  const ok = (id: string) => isFrame(id);
  it('keeps good looks and drops bad ones', () => {
    const good = { id: 'abc123', name: '  Cap   girl ', avatar: PRESETS.girl, frame: 'gold' };
    const out = sanitizeLooks([good, null, 5, { id: 'abc123', name: 'twin', avatar: PRESETS.boy }, { id: '!!', name: 'bad id', avatar: PRESETS.boy }, { id: 'noavatar', name: 'x' }, { id: 'frame', name: 'f', avatar: PRESETS.boy, frame: 'zzz' }], ok);
    expect(out.map((l) => l.id)).toEqual(['abc123', 'frame']);
    expect(out[0].name).toBe('Cap girl');
    expect(out[0].frame).toBe('gold');
    expect(out[1].frame).toBe('none');
  });
  it('keeps at most twelve', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: 'look' + i, name: 'L' + i, avatar: PRESETS.boy, frame: 'none' }));
    expect(sanitizeLooks(many, ok)).toHaveLength(MAX_LOOKS);
    expect(sanitizeLooks('nope', ok)).toEqual([]);
  });
  it('names a look', () => {
    expect(cleanLookName('   ')).toBe('My look');
    expect(cleanLookName('x'.repeat(80)).length).toBe(24);
    expect(cleanLookName(5)).toBe('My look');
  });
});

describe('Avatar settings', () => {
  it('start empty and repair what is saved', () => {
    expect(DEFAULT_SETTINGS.avatarMode).toBe('drawn');
    expect(DEFAULT_SETTINGS.avatarFrame).toBe('none');
    expect(DEFAULT_SETTINGS.avatarPicture).toBe(0);
    expect(DEFAULT_SETTINGS.avatarLooks).toEqual([]);
    const s = sanitizeSettings({ avatar: PRESETS.boy, avatarMode: 'picture', avatarFrame: 'rainbow', avatarPicture: 1700000000000, avatarLooks: [{ id: 'abc', name: 'A', avatar: PRESETS.girl, frame: 'gold' }] });
    expect(s.avatarMode).toBe('picture');
    expect(s.avatarFrame).toBe('rainbow');
    expect(s.avatarPicture).toBe(1700000000000);
    expect(s.avatarLooks).toHaveLength(1);
    const bad = sanitizeSettings({ avatarMode: 'video', avatarFrame: 'gold-plated', avatarPicture: -5, avatarLooks: 'x' });
    expect(bad.avatarMode).toBe('drawn');
    expect(bad.avatarFrame).toBe('none');
    expect(bad.avatarPicture).toBe(0);
    expect(bad.avatarLooks).toEqual([]);
  });
  it('knows when there is something to show', () => {
    expect(hasAvatar({ avatar: null, avatarMode: 'drawn', avatarPicture: 0 })).toBe(false);
    expect(hasAvatar({ avatar: PRESETS.girl, avatarMode: 'drawn', avatarPicture: 0 })).toBe(true);
    expect(hasAvatar({ avatar: null, avatarMode: 'picture', avatarPicture: 5 })).toBe(true);
    expect(hasAvatar({ avatar: null, avatarMode: 'picture', avatarPicture: 0 })).toBe(false);
  });
});

describe('The sidebar and About', () => {
  it('the sidebar no longer shows the five words, About still does', () => {
    const side = readFileSync('src/ui/Sidebar.svelte', 'utf8');
    expect(side).not.toContain('DREAM_WORDS');
    expect(side).not.toContain('class="words"');
    const about = readFileSync('src/features/about/About.svelte', 'utf8');
    expect(about).toContain('DREAM_WORDS');
  });
  it('the editor has tabs for every part of the avatar', () => {
    const src = readFileSync('src/features/avatar/AvatarEditor.svelte', 'utf8');
    for (const t of ["'face'", "'hair'", "'body'", "'clothes'", "'extras'", "'frame'", "'picture'", "'looks'"]) expect(src).toContain(t);
    expect(src).toContain('type="file"');
    expect(src).toContain('PictureCropper');
  });
});

describe('Cinematic backgrounds, the jacket and the fierce eyes', () => {
  const girl = () => presetFor('girl');
  it('new avatars start with a plain background', () => {
    expect(girl().scene).toBe('color');
    expect(presetFor('boy').scene).toBe('color');
  });
  it('draws the same picture every time for the same avatar', () => {
    expect(avatarSvg(girl(), 'x')).toBe(avatarSvg(girl(), 'x'));
    expect(avatarSvg({ ...girl(), hair: '#223344' }, 'x')).not.toBe(avatarSvg(girl(), 'x'));
  });
  it('draws every scene with its own colors', () => {
    expect([...SCENES]).toEqual(['color', 'storm', 'crimson', 'castle', 'ember', 'void']);
    const seen = new Set<string>();
    for (const scene of SCENES) {
      const svg = avatarSvg({ ...girl(), scene }, 'x');
      clean(svg);
      seen.add(svg);
      expect(SCENE_LABEL[scene].length).toBeGreaterThan(3);
    }
    expect(seen.size).toBe(SCENES.length);
    expect(avatarSvg({ ...girl(), scene: 'castle' }, 'x')).toContain('#ffdca0'); // lit windows
    expect(avatarSvg({ ...girl(), scene: 'color' }, 'x')).toContain('url(#bg-x)');
  });
  it('has a fierce eye shape and a jacket with plates', () => {
    expect(EYE_SHAPES).toContain('fierce');
    expect(OUTFITS).toContain('jacket');
    expect(avatarSvg({ ...presetFor('boy'), outfit: 'jacket' }, 'x')).toContain('#b4bac3');
    const saved = sanitizeAvatar({ base: 'boy', style: 'flat', outfit: 'jacket', scene: 'castle', eyeShape: 'fierce' })!;
    expect([saved.outfit, saved.scene, saved.eyeShape]).toEqual(['jacket', 'castle', 'fierce']);
    expect(sanitizeAvatar({ base: 'boy', scene: 'volcano' })!.scene).toBe('color');
  });
  it('the editor offers the scenes', () => {
    const src = readFileSync('src/features/avatar/AvatarEditor.svelte', 'utf8');
    expect(src).toContain('Background scene');
    expect(src).toContain('SCENE_LABEL');
  });
});
