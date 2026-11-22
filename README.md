# Cloud-Freelife ☁️🖌️

A calm, pastel place to **color, draw and play** — a lightweight Windows desktop app.

- **Coloring Books** — 28 original cartoon pages across *Cloud Dreams*, *Cosmic Colors*, *Peaceful Places*, *Castle Dreams* and *Ocean Friends*
- **Free Draw** — eight soft backgrounds (white, warm cream, cloud blue, lavender, mint, pastel pink, starry sky, soft clouds)
- **Painting tools** — Brush, Marker, Crayon, Airbrush, Fill Bucket, Eraser, Paintball, Color Picker, Clear Region, Undo/Redo, Zoom, Pan
- **Autosave & Gallery** — your art saves itself (outside the install folder), with Open / Duplicate / Rename / Export PNG / Clear / Delete
- **Mini-games** — *Pastel Breaker* (6 handcrafted levels + Relax / Classic / Endless), *Splash Wall* (10 walls) and *Memory Meadow* (6 pair-matching levels)
- **Updates** — a startup check against this repository's GitHub Releases, plus downloadable content packs (new books, palettes and levels) verified with SHA-256
- **Private & offline** — no telemetry, no accounts, no ads. Everything except update checks works without Internet.

Built with **Tauri 2 + Svelte 5 + TypeScript**, HTML Canvas for painting and games. No Electron.

## Install (Windows 10 / 11)

Download from the [Releases page](../../releases):

| File | What it is |
|---|---|
| `Cloud-Freelife_<version>_x64-setup.exe` | Installer (per-user, no admin rights needed) |
| `Cloud-Freelife_<version>_x64-portable.zip` | Just the app — unzip and run |
| `SHA256SUMS.txt` | Checksums for the files above |

Your artwork and settings live in `%APPDATA%\Cloud-Freelife`. Uninstalling or updating never deletes them.

## Develop

Prerequisites: Node 20+, [Rust](https://rustup.rs) and the Visual Studio C++ Build Tools (for Tauri), and the WebView2 runtime (included in Windows 11).

```powershell
npm install
npm run dev            # UI in the browser at http://127.0.0.1:1420 (uses browser storage)
npm run tauri dev      # the real desktop app
npm test               # unit tests
npm run check          # type-check Svelte + TypeScript
npm run tauri build    # installer in src-tauri/target/release/bundle/nsis
npm run package:win    # collects installer + portable zip + checksums + manifest into ./release
```

### Project layout

```
src/core                 storage, settings, router, audio, manifests, versions, content registry
src/ui                   shared components (Button, Toggle, dialogs, ambient background...)
src/features/home        Home screen
src/features/books       book shelf + page picker
src/features/painting    painting engine, tools, palettes, backgrounds
src/features/gallery     artwork persistence + Gallery
src/features/minigames   Pastel Breaker and Splash Wall
src/features/updates     update check, release manifests, content packs, Update Center
src/features/settings    Settings
content/books            bundled coloring books (manifests + SVG art)
content/palettes         bundled palettes
content/minigames        bundled mini-game levels
src-tauri                the thin native shell (Rust)
scripts                  content generator, pack/release tools
docs                     guides and templates
```

## Make your own content

Books, pages, palettes and levels are plain JSON + SVG — nothing is hard-coded. See:

- [docs/CREATING_BOOKS.md](docs/CREATING_BOOKS.md)
- [docs/CREATING_PAGES.md](docs/CREATING_PAGES.md)
- [docs/CREATING_LEVELS.md](docs/CREATING_LEVELS.md)
- [docs/PUBLISHING_CONTENT.md](docs/PUBLISHING_CONTENT.md)
- [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md)

Before publishing under your own GitHub account, set `GITHUB_OWNER` / `GITHUB_REPO_NAME` in [`src/core/config.ts`](src/core/config.ts).

## More

[CHANGELOG](CHANGELOG.md) · [ROADMAP](ROADMAP.md) · [CONTRIBUTING](CONTRIBUTING.md) · [PRIVACY](PRIVACY.md) · [SECURITY](SECURITY.md)

Licensed under MIT. All artwork in `content/` is original. The Nunito font is used under the SIL Open Font License (`src/assets/nunito-OFL-LICENSE.txt`).
