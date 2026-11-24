# Cloud-Freelife ☁️🖌️

A calm, pastel place to **color, draw and play** — a lightweight Windows desktop app.

- **Coloring Books** — 64 original cartoon pages across ten books: *Cloud Dreams*, *Cosmic Colors*, *Peaceful Places*, *Castle Dreams*, *Ocean Friends*, *Sweet Treats*, *Forest Friends*, *Mountain Village*, *Night Garden* and *Happy Farm*
- **Illustrated Cozy Stories** — ten gentle stories with soft pictures, adjustable text size, a chapter list, favorites and a progress bar; it remembers your chapter and paragraph
- **Story Adventures** — ten choose-your-path stories told as a guy or a girl (adventure, romance, comedy and mystery), each with five or more endings to find; it remembers your place and the endings you have found
- **Themes, moods and music** — eight color themes (plus Follow System), four mood presets and gentle generated background music, with redesigned soft sound effects
- **Long reads** — bookmarks, "time left", a dimmer **Sleep mode** with music that fades out, and series. Two half-hour stories (*The Tea Boat on Willow River*, *The Cartographer of Small Things*) and a long mystery adventure (*The Night Market at Lamplight Quay*) are downloadable from Updates
- **Layers and more brushes** — Free Draw has up to four layers with opacity and blend modes; new Watercolor, Pastel, Ink Pen and Glitter brushes, stamps, a reference picture to paint from, and Gallery albums with search
- **Import line art** — turn a clean outline drawing into a coloring page, and replay any new painting as a **Timelapse** video
- **Free Draw** — eight soft backgrounds (white, warm cream, cloud blue, lavender, mint, pastel pink, starry sky, soft clouds)
- **Painting tools** — Brush, Marker, Crayon, Airbrush, Fill Bucket, Eraser, Paintball, Color Picker, Clear Region, Undo/Redo, Zoom, Pan
- **Autosave & Gallery** — your art saves itself (outside the install folder), with Open / Duplicate / Rename / Export PNG / Clear / Delete
- **Meditation** — six optional quiet sessions (One Minute Reset, Cloud Breathing, Quiet Garden, Evening Wind Down, Rain Pause and a Silent Timer). No streaks, no scores, no medical claims
- **Gentle Movement** — ten friendly stretch cards with pictures, steps and an optional timer. General ideas, not medical advice
- **Mini-games** — eight calm games: *Pastel Breaker* (12 levels), *Splash Wall* (16 walls, saved to the Gallery or exported), *Memory Meadow* (12 levels), *Pastel Puzzle* (14 pictures), *Bubble Garden*, *Cloud Catcher*, *Zen Garden* (rake sand, place stones and plants, save your gardens) and *Paint Flow* (12 boards)
- **App icon** — five cute icons to choose from in Settings
- **Updates** — a quiet startup check, an in-app Update Center with release notes, and downloadable content packs (books, palettes, stories, levels) verified with SHA-256
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
src/features/minigames   the eight mini-games (Pastel Breaker, Splash Wall, Memory Meadow, Pastel Puzzle, Bubble Garden, Cloud Catcher, Zen Garden, Paint Flow)
src/features/meditation  Meditation sessions and the breathing timer
src/features/movement    Gentle Movement cards
src/features/stories     Stories hub, reader, adventures, reading list and progress
src/features/import      import line art as coloring pages (My Pages)
src/features/updates     update check, release manifests, content packs, Update Center
src/features/settings    Settings
content/books            bundled coloring books (manifests + SVG art)
content/palettes         bundled palettes
content/minigames        bundled mini-game levels
content/stories         bundled cozy stories and story adventures
content-packs            sources of downloadable packs (long stories, adventures, themes)
content/meditation      bundled meditation sessions
content/movement        bundled Gentle Movement cards
src-tauri                the thin native shell (Rust)
scripts                  content generator, pack/release tools
docs                     guides and templates
```

## Make your own content

Books, pages, palettes and levels are plain JSON + SVG — nothing is hard-coded. See:

- [docs/CREATING_BOOKS.md](docs/CREATING_BOOKS.md)
- [docs/CREATING_PAGES.md](docs/CREATING_PAGES.md)
- [docs/CREATING_LEVELS.md](docs/CREATING_LEVELS.md)
- [docs/CREATING_WELLNESS.md](docs/CREATING_WELLNESS.md) (meditation sessions and Gentle Movement cards)
- [docs/CREATING_STORIES.md](docs/CREATING_STORIES.md) (stories, illustrated stories, adventures)
- [docs/THEMES_AND_AUDIO.md](docs/THEMES_AND_AUDIO.md) (themes, moods and music)
- [docs/PUBLISHING_CONTENT.md](docs/PUBLISHING_CONTENT.md)
- [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md)

Before publishing under your own GitHub account, set `GITHUB_OWNER` / `GITHUB_REPO_NAME` in [`src/core/config.ts`](src/core/config.ts).

## More

[CHANGELOG](CHANGELOG.md) · [ROADMAP](ROADMAP.md) · [CONTRIBUTING](CONTRIBUTING.md) · [PRIVACY](PRIVACY.md) · [SECURITY](SECURITY.md)

Licensed under MIT. All artwork in `content/` is original. The Nunito font is used under the SIL Open Font License (`src/assets/nunito-OFL-LICENSE.txt`).
