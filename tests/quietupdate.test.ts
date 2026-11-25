import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INSTALLER_NAME, UPDATE_DIR, canSelfUpdate, installUpdate, installerVersion, staleInstallers } from '../src/features/updates/updater';
import type { UpdateItem } from '../src/features/updates/release';

describe('quiet updates: installer file names', () => {
  it('reads the version from a real installer name', () => {
    expect(installerVersion('Cloud-Freelife_1.7.0_x64-setup.exe')).toBe('1.7.0');
    expect(installerVersion('Cloud-Freelife_12.3.45_x64-setup.exe')).toBe('12.3.45');
  });
  it('refuses anything else, including paths and other files', () => {
    for (const bad of ['', 'setup.exe', 'Cloud-Freelife_1.7_x64-setup.exe', 'Cloud-Freelife_1.7.0_x64-setup.exe.bak', '../Cloud-Freelife_1.7.0_x64-setup.exe', 'sub/Cloud-Freelife_1.7.0_x64-setup.exe', 'Cloud-Freelife_1.7.x_x64-setup.exe', 'cloud-freelife_1.7.0_x64-setup.exe', 'Cloud-Freelife_1.7.0_x64-setup.zip']) {
      expect(installerVersion(bad), bad).toBeNull();
    }
    expect(INSTALLER_NAME.test('Cloud-Freelife_1.7.0_x64-setup.exe')).toBe(true);
  });
  it('picks out only the installers that are not newer than this version, and leaves everything else alone', () => {
    const names = ['Cloud-Freelife_1.4.1_x64-setup.exe', 'Cloud-Freelife_1.6.0_x64-setup.exe', 'Cloud-Freelife_1.7.0_x64-setup.exe', 'notes.txt', 'My holiday photos.png', 'Cloud-Freelife_1.5.0_x64-portable.zip'];
    expect(staleInstallers(names, '1.6.0')).toEqual(['Cloud-Freelife_1.4.1_x64-setup.exe', 'Cloud-Freelife_1.6.0_x64-setup.exe']);
    expect(staleInstallers(names, '1.0.0')).toEqual([]);
    expect(staleInstallers([], '1.6.0')).toEqual([]);
  });
  it('keeps the quiet update inside the app folder, not Downloads', () => {
    expect(UPDATE_DIR).toBe('update');
  });
});

describe('quiet updates: outside the desktop app', () => {
  it('a browser copy cannot update itself', async () => {
    expect(await canSelfUpdate()).toBe(false);
  });
  it('installing an app update does nothing risky without a verified installer or the desktop app', async () => {
    const noAsset = { kind: 'app', version: '9.9.9', name: 'x', description: '', downloadUrl: '', contentKind: 'book' } as unknown as UpdateItem;
    const r = await installUpdate(noAsset);
    expect(r.ok).toBe(false);
  });
});

describe('quiet updates: the desktop side', () => {
  const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
  it('runs the installer with no windows, keeps data, and restarts the app', () => {
    expect(rust).toContain('"/S", "/UPDATE", "/R"');
  });
  it('checks the checksum again right before running, and only accepts a newer, correctly named installer', () => {
    expect(rust).toContain('Sha256::digest');
    expect(rust).toContain('installer_version(&file_name)');
    expect(rust).toContain('version <= current_version()');
  });
  it('only works for a copy that the installer put there', () => {
    expect(rust).toContain('uninstall.exe');
    expect(rust).toContain('can_self_update');
  });
  it('is registered as a command', () => {
    expect(rust).toContain('generate_handler![can_self_update, install_update, set_taskbar_icon, premium::premium_check_license, premium::premium_open_pack]');
  });
  it('can still read and tidy up its own old installers, and the NSIS installer runs for the current user', () => {
    const caps = readFileSync('src-tauri/capabilities/default.json', 'utf8');
    for (const p of ['fs:allow-read-dir', 'fs:allow-remove']) expect(caps).toContain(p);
    const conf = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    expect(conf.bundle.windows.nsis.installMode).toBe('currentUser');
  });
});
