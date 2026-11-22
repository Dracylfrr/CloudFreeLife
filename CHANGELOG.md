# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and the project uses [Semantic Versioning](https://semver.org).

## [1.1.1]

### Added
- **Sweet Treats** coloring book — Cupcake Tower, Tea Party, Bakery Shop, Ice Cream Cart, Picnic Basket.
- **Forest Friends** coloring book — Sleepy Bear, Fox in the Leaves, Bunny Garden, Owl and Moon, Hedgehog Meadow. The library now has 38 pages.
- **Pastel Puzzle**, a fourth mini-game: a finished picture is scrambled into pieces and you swap them back, two at a time. Eight levels from 6 to 24 pieces, with Peek and soft Helpers, no timer.
- Two new palettes: *Sweet Frosting* and *Forest Dawn*.

### Changed
- **Mini-Games** now shows each game as a card with a preview picture, like the coloring books. Pick a game to see its levels.
- The top-right update notice now reads "New content is ready" with a one-line summary and an **Install update** button (it downloads and verifies the installer, then shows it so you can open it).
- The Home card says "Pastel Breaker, Splash Wall and more".
- Release manifests can carry a short `headline` for that notice.

### Fixed
- Gallery card buttons no longer spill outside the card, and nothing else overflows at small or large window sizes: bars wrap instead of clipping, the sidebar collapses to icons in narrow windows or at a large interface scale, Settings stacks, and game boards fit their space.

## [1.1.0]

### Added
- **Castle Dreams** coloring book — five new pages: Gate House, Dragon Tower, Knight Friend, Throne Room, Castle Garden.
- **Ocean Friends** coloring book — five new pages: Happy Whale, Octopus Cove, Turtle Reef, Seahorse Garden, Fish School.
- **Memory Meadow**, a third mini-game: flip soft pastel cards and find the pairs. Six handcrafted levels, no timer, no lives, and a Hint button that never spoils anything.
- Two new palettes: *Castle Twilight* and *Ocean Pearl*.
- Content can now say which app version it needs; the new books, palettes and levels require 1.1.0 and stay hidden on older apps.
- Downloadable content packs can carry Memory Meadow levels.

### Changed
- Books are ordered by an optional `order` field in their manifest.
- The window-minimised state now pauses animation and audio reliably in the desktop app.

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
- Light on resources: the ambient scenery runs from a single ~10 fps clock that stops completely for Reduced Motion, Low Power, a hidden window and the painting screen; games stop their loop when paused or hidden.
- Automated tests for save/load, autosave, undo/redo, manifests, palettes, levels, versions, update parsing, checksums, content compatibility and settings persistence.
