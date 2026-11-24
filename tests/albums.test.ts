import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryStorage, setStorage } from '../src/core/storage';
import { MAX_ALBUMS, MAX_ALBUM_NAME, MAX_ART_PER_ALBUM, addToAlbum, albums, albumsOf, cleanAlbumName, createAlbum, deleteAlbum, forgetArtwork, kindOf, loadAlbums, matchesQuery, normalize, removeFromAlbum, renameAlbum, sanitizeAlbums } from '../src/features/gallery/albums';

let st: MemoryStorage;
beforeEach(() => {
  st = new MemoryStorage();
  setStorage(st);
  albums.__reset();
  albums.__enable();
});

describe('albums', () => {
  it('are created with a clean name, and refuse an empty one', () => {
    expect(createAlbum('   ')).toBeNull();
    const id = createAlbum('  Summer   skies ');
    expect(id).toMatch(/^a[0-9a-z]{3,10}$/);
    expect(albums.value().albums[0]).toEqual({ id, name: 'Summer skies', art: [] });
    expect(cleanAlbumName('x'.repeat(100)).length).toBe(MAX_ALBUM_NAME);
  });
  it('have a limit on how many there can be', () => {
    for (let i = 0; i < MAX_ALBUMS; i++) expect(createAlbum(`Album ${i}`)).not.toBeNull();
    expect(createAlbum('One too many')).toBeNull();
    expect(albums.value().albums).toHaveLength(MAX_ALBUMS);
  });
  it('hold paintings, once each, and a painting can be in several', () => {
    const a = createAlbum('Sky')!;
    const b = createAlbum('Sea')!;
    expect(addToAlbum(a, 'free-drawing-aaaa')).toBe(true);
    expect(addToAlbum(a, 'free-drawing-aaaa')).toBe(true);
    expect(addToAlbum(b, 'free-drawing-aaaa')).toBe(true);
    expect(albums.value().albums.find((x) => x.id === a)!.art).toEqual(['free-drawing-aaaa']);
    expect(albumsOf(albums.value(), 'free-drawing-aaaa').map((x) => x.name)).toEqual(['Sky', 'Sea']);
    expect(addToAlbum('anope', 'free-drawing-aaaa')).toBe(false);
    expect(addToAlbum(a, '../bad')).toBe(false);
  });
  it('stop at a full album without losing what is in it', () => {
    const a = createAlbum('Big')!;
    for (let i = 0; i < MAX_ART_PER_ALBUM; i++) expect(addToAlbum(a, `art-${i}`)).toBe(true);
    expect(addToAlbum(a, 'art-extra')).toBe(false);
    expect(albums.value().albums[0].art).toHaveLength(MAX_ART_PER_ALBUM);
  });
  it('can be renamed and removed, and removing one never touches the paintings', () => {
    const a = createAlbum('Sky')!;
    addToAlbum(a, 'art-1');
    expect(renameAlbum(a, 'Clouds')).toBe(true);
    expect(renameAlbum(a, '  ')).toBe(false);
    expect(renameAlbum('anope', 'x')).toBe(false);
    expect(albums.value().albums[0].name).toBe('Clouds');
    removeFromAlbum(a, 'art-1');
    expect(albums.value().albums[0].art).toEqual([]);
    deleteAlbum(a);
    expect(albums.value().albums).toEqual([]);
  });
  it('lose a painting when it is deleted', () => {
    const a = createAlbum('Sky')!;
    const b = createAlbum('Sea')!;
    addToAlbum(a, 'art-1');
    addToAlbum(b, 'art-1');
    addToAlbum(b, 'art-2');
    forgetArtwork('art-1');
    expect(albums.value().albums.map((x) => x.art)).toEqual([[], ['art-2']]);
    forgetArtwork('art-never-there'); // nothing to do
  });
  it('are read safely from a damaged file', () => {
    expect(sanitizeAlbums(null).albums).toEqual([]);
    expect(sanitizeAlbums({ albums: 'no' }).albums).toEqual([]);
    const f = sanitizeAlbums({
      albums: [
        { id: 'abc123', name: 'Good', art: ['art-1', 'art-1', '../x', 5, 'art-2'] },
        { id: 'abc123', name: 'Same id' },
        { id: 'BAD ID', name: 'Bad id' },
        { id: 'abc124', name: '   ' },
        { id: 'abc125', name: 'No art list' },
        null,
        'x'
      ]
    });
    expect(f.albums.map((a) => a.name)).toEqual(['Good', 'No art list']);
    expect(f.albums[0].art).toEqual(['art-1', 'art-2']);
  });
  it('are saved to disk and read back', async () => {
    const id = createAlbum('Keepers')!;
    addToAlbum(id, 'art-9');
    await albums.flush();
    albums.__reset();
    await loadAlbums();
    expect(albums.value().albums).toEqual([{ id, name: 'Keepers', art: ['art-9'] }]);
    await st.writeText('albums.json', '{ broken');
    albums.__reset();
    await loadAlbums();
    expect(albums.value().albums).toEqual([]);
  });
});

describe('search and filters', () => {
  it('ignores case and accents', () => {
    expect(normalize('Café Ñandú')).toBe('cafe nandu');
    expect(matchesQuery('Café at dawn', 'CAFE')).toBe(true);
    expect(matchesQuery('Sleepy Bear', 'bear sleepy')).toBe(true);
  });
  it('needs every word, and an empty search matches everything', () => {
    expect(matchesQuery('Sleepy Bear', 'sleepy fox')).toBe(false);
    expect(matchesQuery('anything', '')).toBe(true);
    expect(matchesQuery('anything', '   ')).toBe(true);
  });
  it('tells the kinds of painting apart', () => {
    expect(kindOf({ pageId: 'cloud_castle', title: 'Cloud Castle' })).toBe('coloring');
    expect(kindOf({ pageId: null, title: 'Free drawing' })).toBe('free');
    expect(kindOf({ pageId: null, title: 'Splash Wall: Birthday Cake' })).toBe('splash');
    expect(kindOf({ pageId: null, title: 'My splash wall idea' })).toBe('free');
  });
});
