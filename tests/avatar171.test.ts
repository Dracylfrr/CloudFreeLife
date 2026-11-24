import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ACCENT_COLORS, BODIES, CHINS, EARRINGS, EARS, EYE_SHAPES, GLASSES, HAIR_ACCS, HAIR_STYLES, HATS, LIMITS, MAX_LOOKS, MOUTHS, OUTFITS, PRESETS, STYLES, cleanLookName, mix, presetFor, sanitizeAvatar, sanitizeLooks,
  styleDefaults, type AvatarConfig
} from '../src/features/avatar/avatar';
import { headPath } from '../src/features/avatar/draw';
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

describe('Avatars from 1.7.0', () => {
  it('still open, and look the same as the chibi starting style', () => {
    const old = { base: 'girl', skin: '#fbd3b8', hair: '#8a5a3c', hairStyle: 'long', eyes: '#3d6fb5', outfit: 'dress', outfitColor: '#ffd3e2', background: '#e6dcfa' };
    const a = sanitizeAvatar(old)!;
    expect(a).toEqual(PRESETS.girl);
    expect(a.style).toBe('chibi');
    expect(a.hat).toBe('none');
    expect(a.headW).toBe(100);
  });
});

describe('Avatar data', () => {
  it('has four art styles with their own starting shapes', () => {
    expect([...STYLES]).toEqual(['chibi', 'anime', 'real', 'flat']);
    expect(styleDefaults('chibi').headW).toBe(100);
    expect(styleDefaults('real').eyeSize).toBeLessThan(styleDefaults('anime').eyeSize);
    expect(styleDefaults('anime').neckLen).toBeGreaterThan(styleDefaults('chibi').neckLen);
    expect(presetFor('boy', 'real').style).toBe('real');
    expect(presetFor('boy', 'real').hairStyle).toBe(PRESETS.boy.hairStyle);
  });
  it('offers rounded ears and many more choices', () => {
    expect(EARS[0]).toBe('round');
    expect(PRESETS.girl.ears).toBe('round');
    expect(PRESETS.boy.ears).toBe('round');
    for (const list of [HATS, GLASSES, EARRINGS, HAIR_ACCS, EYE_SHAPES, CHINS, BODIES, MOUTHS, EARS]) expect(list.length).toBeGreaterThanOrEqual(3);
    expect(EARRINGS).toEqual(expect.arrayContaining(['studs', 'hoops']));
    expect(GLASSES).toContain('sun');
    expect(HATS).toContain('cap');
    expect(ACCENT_COLORS.length).toBeGreaterThanOrEqual(10);
  });
  it('keeps sliders inside their limits and ignores junk', () => {
    const a = sanitizeAvatar({ base: 'boy', headW: 500, headH: -3, eyeSize: 'big', eyeGap: 1e9, neckLen: Infinity, neckWidth: NaN, hat: 'crown', glasses: 3, earrings: 'rings', hairAcc: null, style: 'oil' })!;
    expect(a.headW).toBe(LIMITS.headW.max);
    expect(a.headH).toBe(LIMITS.headH.min);
    expect(a.eyeSize).toBe(styleDefaults('chibi').eyeSize);
    expect(a.eyeGap).toBe(LIMITS.eyeGap.max);
    expect(a.neckLen).toBe(styleDefaults('chibi').neckLen);
    expect(a.neckWidth).toBe(styleDefaults('chibi').neckWidth);
    expect(a.hat).toBe('none');
    expect(a.glasses).toBe('none');
    expect(a.earrings).toBe('none');
    expect(a.hairAcc).toBe('none');
    expect(a.style).toBe('chibi');
  });
  it('blends colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#102030', '#102030', 0.9)).toBe('#102030');
  });
});

describe('Drawing', () => {
  it('draws every style with every kind of accessory and shape', () => {
    const r = seeded(11);
    for (let i = 0; i < 500; i++) {
      const base = pick(['girl', 'boy'] as const, r);
      const style = pick(STYLES, r);
      const a: AvatarConfig = {
        ...presetFor(base, style),
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
  it('the four styles look different from each other', () => {
    const svgs = STYLES.map((s) => avatarSvg(presetFor('girl', s), 'x'));
    expect(new Set(svgs).size).toBe(4);
  });
  it('the storybook style has no outlines and the realistic style has thin ones', () => {
    const flat = avatarSvg(presetFor('girl', 'flat'), 'x');
    expect(flat).not.toContain('#5b5678');
    expect(flat).not.toMatch(/stroke-width="2\.4"/);
    const chibi = avatarSvg(presetFor('girl', 'chibi'), 'x');
    expect(chibi).toContain('stroke-width="2.4"');
    const real = avatarSvg(presetFor('girl', 'real'), 'x');
    expect(real).toContain('stroke-width="1.1"');
    expect(real).toContain('radialGradient');
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
    const a = avatarSvg({ ...base, headW: 90, headH: 110 }, 'x');
    expect(a).toContain('scale(0.9 1.1)');
    const b = avatarSvg({ ...base, neckLen: 10, body: 'broad' }, 'x');
    expect(b).toContain('translate(60 10) scale(1.2 1)');
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
    const withHat = avatarSvg({ ...base, hat: 'cap' }, 'x');
    const without = avatarSvg(base, 'x');
    expect(without).toContain('r="12"');
    expect(withHat).not.toContain('r="12"');
  });
});

describe('Frames', () => {
  it('has plain, ornate and soft frames', () => {
    expect(FRAMES.length).toBeGreaterThanOrEqual(12);
    for (const g of FRAME_GROUPS) expect(FRAMES.some((f) => f.group === g)).toBe(true);
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
    for (const t of ["'style'", "'face'", "'hair'", "'body'", "'clothes'", "'extras'", "'frame'", "'picture'", "'looks'"]) expect(src).toContain(t);
    expect(src).toContain('type="file"');
    expect(src).toContain('PictureCropper');
  });
});
