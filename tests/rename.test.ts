import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { APP_ASSET_RE } from '../src/features/updates/release';
import { INSTALLER_NAME } from '../src/features/updates/updater';
import { BRAND_NAME } from '../src/core/brand';

const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const hooks = readFileSync('src-tauri/windows/hooks.nsh', 'utf8');
const pack = readFileSync('scripts/package-windows.mjs', 'utf8');

describe('The program is called Project D.R.E.A.M on the computer', () => {
  it('names the installer, program file, folder, publisher and Installed-apps entry after the app', () => {
    expect(conf.productName).toBe(BRAND_NAME);
    expect(conf.mainBinaryName).toBe(BRAND_NAME);
    expect(conf.bundle.publisher).toBe(BRAND_NAME);
    expect(JSON.stringify(conf.bundle)).not.toMatch(/cloud-?freelife/i);
    expect(readFileSync('src-tauri/Cargo.toml', 'utf8')).not.toMatch(/^(description|authors) = .*cloud-?freelife/im);
  });
  it('keeps the identity Windows ties shortcuts and the window to', () => {
    expect(conf.identifier).toBe('app.cloudfreelife.desktop');
  });
});

describe('Older versions can still update to it', () => {
  it('publishes the installer under the file name every older version looks for', () => {
    expect(pack).toContain('Cloud-Freelife_${v}_x64-setup.exe');
    const name = 'Cloud-Freelife_2.2.0_x64-setup.exe';
    expect(APP_ASSET_RE.test(name)).toBe(true);
    expect(INSTALLER_NAME.test(name)).toBe(true);
  });
  it('also offers it under its real name, and never as an update candidate', () => {
    expect(pack).toContain('Project-DREAM_${v}_x64-setup.exe');
    expect(APP_ASSET_RE.test('Project-DREAM_2.2.0_x64-setup.exe')).toBe(false);
  });
});

describe('The installer takes over from the old install safely', () => {
  it('installs the new version first and removes the old one afterwards', () => {
    const pre = hooks.indexOf('NSIS_HOOK_PREINSTALL');
    const post = hooks.indexOf('NSIS_HOOK_POSTINSTALL');
    expect(pre).toBeGreaterThan(0);
    expect(post).toBeGreaterThan(pre);
    expect(hooks.indexOf('uninstall.exe" /S /UPDATE')).toBeGreaterThan(post); // only in the step after the new files are in place
  });
  it('tells the old uninstaller to keep shortcuts and saved data', () => {
    expect(hooks).toContain('/S /UPDATE _?=');
    expect(hooks).not.toMatch(/RMDir\s+\/r/i); // nothing is ever deleted recursively
  });
  it('keeps the old place on the disk and carries the shortcuts and taskbar pins over', () => {
    expect(hooks).toContain('SetShortcutTarget');
    expect(hooks).toContain('User Pinned\\TaskBar');
    expect(hooks).toContain('DreamMoveData');
  });
});
