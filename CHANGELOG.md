# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and the project uses [Semantic Versioning](https://semver.org).

## [1.0.0] — first release

### Added
- Home, Coloring Books, Free Draw, Gallery, Mini-Games, Updates, Settings and About screens in a soft pastel design with slowly drifting clouds, bubbles and sparkles (all removable with *Reduced Motion*).
- Three coloring books with six original pages each — **Cloud Dreams**, **Cosmic Colors**, **Peaceful Places** — and a **Free Canvas** book with eight backgrounds.
- Painting tools: Brush, Marker, Crayon, Airbrush, Fill Bucket, Eraser, Paintball, Color Picker, Clear Region, Undo / Redo, Zoom and Pan, with interpolated strokes so fast movement leaves no gaps.
- Region fill, *Stay Inside Lines*, recoloring (regions are never locked), region clearing and a confirmed *Reset page*.
- Ten pastel palettes with friendly color names and an advanced color picker.
- Debounced autosave with a subtle *Saving… / Saved* indicator; art is stored in `%APPDATA%\Cloud-Freelife`, outside the install folder.
- Gallery with thumbnails, Open, Duplicate, Rename, Export PNG, Clear and (confirmed) Delete.
- **Pastel Breaker** — six handcrafted levels, Relax / Classic / Endless modes, bubbles, stars, paint dots and little clouds.
- **Splash Wall** — ten illustrated walls (including *Paint the Car*), mouse aiming, hold-to-charge throws, squash-and-burst impacts and goals (cover, color regions, match colors, or free play).
- Built-in updater: one asynchronous check on startup, top-right notification (*View* / *Later*), manual *Check for Updates*, and an Update Center.
- Downloadable content packs (`.cfpack`) for books, palettes and levels, validated by manifest, version, asset name, size, content type and SHA-256 before installing.
- Settings: General, Display (UI scale, Low Power, 30 FPS), Audio (Master / Music / Ambience / Effects / Painting), Accessibility (Reduced Motion, disable particles, higher contrast), Updates and Storage.
- Gentle synthesized sounds (no audio files, nothing sharp or loud).
- Automated tests for save/load, autosave, undo/redo, manifests, palettes, levels, versions, update parsing, checksums, content compatibility and settings persistence.
