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
  it('the workflow runs on voices_ tags only, and the pack workflow leaves them alone', () => {
    expect(readFileSync('.github/workflows/voices-release.yml', 'utf8')).toContain("tags: ['voices_v*']");
    expect(readFileSync('.github/workflows/content-release.yml', 'utf8')).toContain("'!voices_v*'");
  });
  it('the voice files are never bundled with the app', () => {
    const ignored = readFileSync('.gitignore', 'utf8');
    expect(ignored).toContain('public/tts/');
    expect(MODEL_FILES.every((f) => f.path.startsWith('voices/'))).toBe(true);
  });
});
