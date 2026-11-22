import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APP_VERSION, compareVersions, isNewer, isValidVersion, meetsMinVersion, parseVersion } from '../src/core/version';
import { checkCompatibility } from '../src/core/manifests';

describe('version comparison', () => {
  it('parses plain and v-prefixed versions', () => {
    expect(parseVersion('1.2.3')).toMatchObject({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion('v10.0.1')).toMatchObject({ major: 10, minor: 0, patch: 1 });
    expect(parseVersion('1.2')).toBeNull();
    expect(parseVersion('banana')).toBeNull();
    expect(parseVersion('1.2.3.4')).toBeNull();
  });

  it('compares numerically, not as text', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('0.9.9', '1.0.0')).toBe(-1);
    expect(compareVersions('v1.1.0', '1.1.0')).toBe(0);
  });

  it('ranks pre-releases below the release', () => {
    expect(compareVersions('1.1.0-beta.1', '1.1.0')).toBe(-1);
    expect(compareVersions('1.1.0-beta.2', '1.1.0-beta.10')).toBe(-1);
    expect(isNewer('1.1.0', '1.1.0-rc.1')).toBe(true);
  });

  it('throws on invalid input instead of guessing', () => {
    expect(() => compareVersions('x', '1.0.0')).toThrow();
  });

  it('isNewer / meetsMinVersion', () => {
    expect(isNewer('1.1.0', '1.0.0')).toBe(true);
    expect(isNewer('1.0.0', '1.0.0')).toBe(false);
    expect(meetsMinVersion('1.0.0', '1.0.0')).toBe(true);
    expect(meetsMinVersion('1.2.0', '1.1.9')).toBe(false);
    expect(meetsMinVersion('nope', '1.0.0')).toBe(false);
    expect(isValidVersion('2.0.0')).toBe(true);
  });

  it('reports content compatibility with the running app', () => {
    expect(checkCompatibility({ minAppVersion: '1.0.0' }, '1.0.0').ok).toBe(true);
    const bad = checkCompatibility({ minAppVersion: '2.0.0' }, '1.0.0');
    expect(bad.ok).toBe(false);
    expect(bad.reason).toMatch(/2\.0\.0/);
    expect(checkCompatibility({ minAppVersion: 'zzz' }, '1.0.0').ok).toBe(false);
  });

  it('keeps package.json, tauri.conf.json and Cargo.toml on the same version', () => {
    const root = resolve(__dirname, '..');
    const tauri = JSON.parse(readFileSync(resolve(root, 'src-tauri/tauri.conf.json'), 'utf8'));
    const cargo = readFileSync(resolve(root, 'src-tauri/Cargo.toml'), 'utf8');
    expect(tauri.version).toBe(APP_VERSION);
    expect(/^version = "([^"]+)"/m.exec(cargo)?.[1]).toBe(APP_VERSION);
  });
});
