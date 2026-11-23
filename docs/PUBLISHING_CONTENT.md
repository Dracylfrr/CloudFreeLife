# Publishing content and app releases

Cloud-Freelife checks this repository's GitHub **Releases** page once when it starts (and when you press *Check for Updates*). Two kinds of release exist:

| Release | Tag | Attach |
|---|---|---|
| **App release** | `v1.1.0` | installer, portable zip, `cloud-freelife-release.json`, `SHA256SUMS.txt` |
| **Content release** | `castle_dreams_v1.0.0` | `castle_dreams_v1.0.0.cfpack`, `cloud-freelife-release.json` |

The app then shows *Update available — v1.1.0* or *New coloring book available — Castle Dreams* and the player installs it from **Updates**. Installed content appears automatically in the right section.

> First, set your repository in [`src/core/config.ts`](../src/core/config.ts) (`GITHUB_OWNER`, `GITHUB_REPO_NAME`) and ship that in an app release. The app only trusts downloads from that repository.

## Publish a new coloring book (no app release needed)

1. Create the book as in [CREATING_BOOKS.md](CREATING_BOOKS.md) in a folder that mirrors `content/`:
   ```
   castle_dreams_src/books/castle_dreams/book_manifest.json
   castle_dreams_src/books/castle_dreams/cover.svg
   castle_dreams_src/books/castle_dreams/pages/01_gate_house/...
   ```
2. Build the pack:
   ```powershell
   node scripts/pack-content.mjs castle_dreams_src --id castle_dreams --version 1.0.0 --name "Castle Dreams" --description "Castles and gentle dragons." --kind book --min-app 1.0.0 --out release
   ```
   This writes `release/castle_dreams_v1.0.0.cfpack` and `release/cloud-freelife-release.json` (with the SHA-256 and size).
3. On GitHub: **Releases → Draft a new release**, tag **`castle_dreams_v1.0.0`**, attach **both files**, publish. (Or commit the source under `content-packs/castle_dreams/{pack.json,content/}` and push the tag — `.github/workflows/content-release.yml` does steps 2–3.)
4. Players: *Update available* appears on their next start → **Updates → Install**.

The `id` in the pack, the `id` in `book_manifest.json`, the tag (`<id>_v<version>`) and the asset name must agree. A pack may contain books, palettes (`palettes/<id>.json`) and levels (`minigames/<game>/levels/<folder>/…`). Cozy Stories and Story Adventures live under `stories/relaxing/<id>/` and `stories/adventures/<id>/` (see [CREATING_STORIES.md](CREATING_STORIES.md)). Use `--kind palettes`, `breaker_levels`, `splash_levels`, `memory_levels`, `puzzle_levels`, `bubble_levels`, `catcher_levels`, `zen_levels`, `flow_levels`, `stories`, `adventures`, `meditation` or `movement` accordingly (it only changes the wording of the notification).

To **update** a book later, bump `version` in its manifest and publish `castle_dreams_v1.1.0`. Newer versions replace older ones.

## Publish an app release

1. Bump the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` (a test checks they match). Update `CHANGELOG.md`.
2. `npm test`, `npm run check`.
3. Build and collect files:
   ```powershell
   npm run tauri build
   npm run package:win
   ```
   `release/` now holds the installer (`Cloud-Freelife_1.1.0_x64-setup.exe`), the portable zip, `cloud-freelife-release.json` and `SHA256SUMS.txt`.
4. Create a GitHub Release tagged `v1.1.0` and attach everything in `release/`. (Pushing the tag also triggers `.github/workflows/release.yml`, which does the above on GitHub.)

Players are notified; *Updates → Download* saves the installer to `Downloads\Cloud-Freelife`, verifies it, and shows it in Explorer. They run it when they like.

### Friendly update notice

The top-right notice reads **New content is ready** with a one-line summary and an **Install update** button. The summary comes from `docs/RELEASE_HEADLINE.txt`: edit that single line (for example `2 new books and a new mini-game`) before running `npm run package:win`; it is stored as `headline` in `cloud-freelife-release.json`. Without it the notice says "A new version is ready". Apps older than 1.1.1 still show their original "Update available" wording.

## What the app verifies

Manifest schema, version formats, asset name pattern (including that it matches the declared id/version), content type, size, SHA-256, `minAppVersion` vs. the running app, that the download URL is HTTPS and belongs to this repository's release assets, and — for packs — path/extension restrictions and passive-only SVGs. Anything that fails is ignored or rejected and nothing is written. See [SECURITY.md](../SECURITY.md).

## Manifest reference

See [templates/release-manifest.example.json](templates/release-manifest.example.json). Content `type` is one of `book`, `palettes`, `breaker_levels`, `splash_levels`, `memory_levels`, `puzzle_levels`, `bubble_levels`, `catcher_levels`, `zen_levels`, `flow_levels`, `stories`, `adventures`, `meditation`, `movement`, `minigame`.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Nothing shows in the app | Tag does not match `<id>_v<x.y.z>` / `v<x.y.z>`, release is a draft or pre-release, or `cloud-freelife-release.json` is not attached. |
| "Checksum mismatch" | The file was re-uploaded after the manifest was generated. Rebuild with `pack-content.mjs` and re-attach both files. |
| "This content needs Cloud-Freelife x.y.z" | `minAppVersion` is newer than the player's app. |
| "Pack content is invalid" | A manifest inside failed validation; the message names the file. Run the pack's source through the app locally first. |
