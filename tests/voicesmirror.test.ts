import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MODEL_FILES, VOICE_RELEASE_TAG } from '../src/features/voices/model';

describe('The voice files the app downloads and the ones the workflow publishes are the same', () => {
  const manifest = JSON.parse(readFileSync('scripts/voices-manifest.json', 'utf8')) as { tag: string; files: { asset: string; source: string; size: number; sha256: string }[] };
  it('same release tag, same names, same sizes, same checksums', () => {
    expect(manifest.tag).toBe(VOICE_RELEASE_TAG);
    expect(manifest.files.map((f) => f.asset).sort()).toEqual(MODEL_FILES.map((f) => f.asset).sort());
    for (const f of manifest.files) {
      const mine = MODEL_FILES.find((m) => m.asset === f.asset)!;
      expect(mine.sha256, f.asset).toBe(f.sha256);
      expect(mine.size, f.asset).toBe(f.size);
      expect(f.source.startsWith('https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/')).toBe(true);
    }
  });
  it('the voices workflow runs on its own tags only, and the other two workflows leave those tags alone', () => {
    const voices = readFileSync('.github/workflows/voices-release.yml', 'utf8');
    expect(voices).toContain("tags: ['kokoro_voices_v*']");
    expect(voices).toContain('name: "Spoken stories - voice files"'); // a colon in an unquoted name breaks the file
    expect(readFileSync('.github/workflows/content-release.yml', 'utf8')).toContain("'!kokoro_voices_v*'");
    // the app release is for version tags like v2.0.1; a tag that merely starts with "v" must not build an app
    expect(readFileSync('.github/workflows/release.yml', 'utf8')).toContain("tags: ['v[0-9]*']");
    expect(VOICE_RELEASE_TAG.startsWith('v')).toBe(false);
  });
  it('the voice files are never bundled with the app', () => {
    const ignored = readFileSync('.gitignore', 'utf8');
    expect(ignored).toContain('public/tts/');
    expect(MODEL_FILES.every((f) => f.path.startsWith('voices/'))).toBe(true);
  });
});
