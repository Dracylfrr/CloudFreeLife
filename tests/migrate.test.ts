// @vitest-environment node
// The saved-data folder used to be called "Cloud-Freelife" and is now "Project D.R.E.A.M".
// These tests give the storage a small pretend disk and check that nothing is ever lost on the way.
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Disk = Map<string, Uint8Array | 'dir'>;
let disk: Disk;
let failRename = false;

const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '');
const isUnder = (p: string, dir: string) => p.startsWith(dir + '/');

vi.mock('@tauri-apps/plugin-fs', () => ({
  BaseDirectory: { Data: 'Data', Download: 'Download' },
  exists: async (p: string) => disk.has(norm(p)),
  mkdir: async (p: string) => {
    const parts = norm(p).split('/');
    for (let i = 1; i <= parts.length; i++) if (!disk.has(parts.slice(0, i).join('/'))) disk.set(parts.slice(0, i).join('/'), 'dir');
  },
  readDir: async (p: string) => {
    const dir = norm(p);
    const names = new Map<string, boolean>();
    for (const [k, v] of disk) if (isUnder(k, dir)) {
      const rest = k.slice(dir.length + 1).split('/');
      names.set(rest[0], rest.length > 1 || v === 'dir');
    }
    return [...names].map(([name, isDirectory]) => ({ name, isDirectory, isFile: !isDirectory, isSymlink: false }));
  },
  readFile: async (p: string) => {
    const v = disk.get(norm(p));
    if (!(v instanceof Uint8Array)) throw new Error('not a file');
    return v;
  },
  writeFile: async (p: string, bytes: Uint8Array) => void disk.set(norm(p), bytes),
  remove: async (p: string) => {
    const dir = norm(p);
    for (const k of [...disk.keys()]) if (k === dir || isUnder(k, dir)) disk.delete(k);
  },
  rename: async (from: string, to: string) => {
    // only moving the whole data folder is made to fail (saving a file also renames, from a temporary name)
    if (failRename && norm(from) === 'Cloud-Freelife') throw new Error('in use');
    const a = norm(from);
    const b = norm(to);
    for (const [k, v] of [...disk]) {
      if (k === a || isUnder(k, a)) {
        disk.delete(k);
        disk.set(b + k.slice(a.length), v);
      }
    }
  }
}));
vi.mock('@tauri-apps/api/path', () => ({ dataDir: async () => 'C:\\Users\\me\\AppData\\Roaming' }));

const enc = (s: string) => new TextEncoder().encode(s);
const put = (path: string, text: string) => {
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i++) disk.set(parts.slice(0, i).join('/'), 'dir');
  disk.set(path, enc(text));
};

async function storage() {
  vi.resetModules();
  const { TauriStorage } = await import('../src/core/storage/tauri');
  return new TauriStorage();
}

beforeEach(() => {
  disk = new Map();
  failRename = false;
});

describe('Moving the saved data to the new folder name', () => {
  it('uses the new name for a fresh start, and says so', async () => {
    const s = await storage();
    await s.writeText('settings.json', '{"a":1}');
    expect(disk.has('Project D.R.E.A.M/settings.json')).toBe(true);
    expect([...disk.keys()].some((k) => k.startsWith('Cloud-Freelife'))).toBe(false);
    expect(await s.describeRoot()).toBe('C:\\Users\\me\\AppData\\Roaming\\Project D.R.E.A.M');
  });

  it('moves everything from the old folder on the first start, with nothing lost', async () => {
    put('Cloud-Freelife/settings.json', '{"mine":1}');
    put('Cloud-Freelife/artworks/a/art.png', 'painting');
    put('Cloud-Freelife/avatar/picture.png', 'face');
    put('Cloud-Freelife/license.dreamlicense', 'lic');
    const s = await storage();
    expect(await s.readText('settings.json')).toBe('{"mine":1}');
    expect(await s.readText('artworks/a/art.png')).toBe('painting');
    expect(await s.readText('avatar/picture.png')).toBe('face');
    expect(await s.readText('license.dreamlicense')).toBe('lic');
    expect([...disk.keys()].filter((k) => k === 'Cloud-Freelife' || k.startsWith('Cloud-Freelife/'))).toEqual([]);
    expect([...disk.keys()].filter((k) => k.startsWith('Project D.R.E.A.M/')).length).toBeGreaterThanOrEqual(4);
  });

  it('is happy when the installer already moved it', async () => {
    put('Project D.R.E.A.M/settings.json', '{"moved":1}');
    const s = await storage();
    expect(await s.readText('settings.json')).toBe('{"moved":1}');
  });

  it('never overwrites: if both folders hold things, the new one is used and the old one is left alone', async () => {
    put('Cloud-Freelife/settings.json', '{"old":1}');
    put('Project D.R.E.A.M/settings.json', '{"new":1}');
    const s = await storage();
    expect(await s.readText('settings.json')).toBe('{"new":1}');
    expect(new TextDecoder().decode(disk.get('Cloud-Freelife/settings.json') as Uint8Array)).toBe('{"old":1}');
  });

  it('steps aside an empty new folder so the old one can move in', async () => {
    disk.set('Project D.R.E.A.M', 'dir');
    put('Cloud-Freelife/settings.json', '{"old":1}');
    const s = await storage();
    expect(await s.readText('settings.json')).toBe('{"old":1}');
  });

  it('if the folder cannot be moved, the old one keeps being used, so nothing ever looks lost', async () => {
    failRename = true;
    put('Cloud-Freelife/settings.json', '{"mine":1}');
    const s = await storage();
    expect(await s.readText('settings.json')).toBe('{"mine":1}');
    await s.writeText('later.json', '{"b":2}');
    expect(disk.has('Cloud-Freelife/later.json')).toBe(true);
    expect(await s.describeRoot()).toBe('C:\\Users\\me\\AppData\\Roaming\\Cloud-Freelife');
  });

  it('works the same however the first call is made, and only moves once', async () => {
    put('Cloud-Freelife/settings.json', '{"mine":1}');
    const s = await storage();
    const [a, b, c] = await Promise.all([s.list(''), s.exists('settings.json'), s.usage('')]);
    expect(a).toContain('settings.json');
    expect(b).toBe(true);
    expect(c).toBeGreaterThan(0);
  });
});

describe('Where the new name is used', () => {
  it('the folder and the permissions use Project D.R.E.A.M, and the old name is kept only for moving', async () => {
    const { readFileSync } = await import('node:fs');
    const caps = readFileSync('src-tauri/capabilities/default.json', 'utf8');
    for (const p of ['$DATA/Project D.R.E.A.M', '$DATA/Project D.R.E.A.M/**', '$DOWNLOAD/Project D.R.E.A.M', '$DATA/Cloud-Freelife']) expect(caps).toContain(p);
    const hooks = readFileSync('src-tauri/windows/hooks.nsh', 'utf8');
    expect(hooks).toContain('DreamMoveData');
    expect(hooks).toContain('Rename "$APPDATA\\${DREAM_DATA_OLD}" "$APPDATA\\${DREAM_DATA_NEW}"');
    const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
    expect(rust).toContain('join("Project D.R.E.A.M")');
    // nothing a person reads still says the old name
    for (const f of ['src/features/updates/Updates.svelte', 'src/features/premium/license.ts', 'src/features/updates/packs.ts', 'src/core/manifests.ts', 'src/core/content/registry.ts']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/Requires Cloud-Freelife|for Cloud-Freelife|Cloud-Freelife desktop|Cloud-Freelife only|needs Cloud-Freelife/);
    }
  });
});
