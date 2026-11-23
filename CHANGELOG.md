# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and the project uses [Semantic Versioning](https://semver.org).

## [1.3.0]

### Added
- **Illustrated Cozy Stories.** Every story can now carry pictures: at the start of a story, at the start of a chapter, or between sections (never after every paragraph). The six original stories gained three pictures each, and the library has four new, longer stories: *The Night Train to Moonwater*, *The Little Library on Lantern Lane*, *Where the Rain Keeps Its Umbrellas* and *The Star Gardener* (seven to ten minutes each). Pictures are tiny SVG files loaded only when you open that page; if one is missing the story reads on without it.
- **Read Aloud.** Listen to any story in a voice installed on your computer: play, pause, resume, stop, previous and next paragraph, five speeds from 0.75x to 1.5x, a choice of voice and tone, a soft highlight on the paragraph being read, and an option to keep going into the next chapter. The controls stay on screen while you read. It works offline; online voices are never used, so story text never leaves your computer. Background music steps back while a story is being read.
- **Stories** is now one tidy place with **Continue**, **Cozy Stories**, **Story Adventures**, **Not started**, **Finished** and **Favorites**. Cards show *Chapter 3 of 7* with a progress bar, and a heart keeps favorites. A chapter list lets you jump around long stories. The Home *Continue* card resumes whichever you touched last: a painting, a story or an adventure.
- Better reading progress: the chapter, the paragraph, when you last opened it and which endings you found are all saved. Everything saved by 1.2 keeps working.
- **Four new Story Adventures**: *The Case of the Missing Lullaby* (girl, mystery), *Rainy Day Radio* (guy, comedy), *Letters Over the Garden Wall* (girl, romance with Felix) and *The Last Train to Starlight Bay* (guy, romance with Elsie). The library now has ten adventures with six to nine endings each.
- **Eight color themes** in Settings, Display: Cloud Morning (the default, looks exactly as before), Lavender Dream, Peach Sunset, Mint Breeze, Blossom Rain, Candle Glow, Moonlight and Ocean Mist, plus *Follow System*. Themes change the app's colors only, never your paintings. Higher Contrast works with every theme.
- **Mood presets** (Relaxed, Chill, Cozy, Dreamy): one tap changes how the app feels without changing how it looks. Sounds get softer, clouds drift more slowly and a matching music track plays.
- **Background music** for the whole app: gentle, slow music composed on your computer in four styles (Soft Morning, Quiet Garden, Rain Pause, Starry Night). No audio files and no downloads. A music button in the sidebar turns it on or off, and each volume slider plays a short preview when you let go.
- **Three new coloring books**: *Mountain Village*, *Night Garden* and *Happy Farm*, six pages each. The library now has 64 pages in 10 books.
- Five new palettes: *Candle Glow*, *Blossom Rain*, *Mountain Morning*, *Night Garden* and *Farm Sunrise* (19 in all).
- Story pictures can be SVG, WebP or PNG in content packs. See `docs/CREATING_STORIES.md`, `docs/THEMES_AND_AUDIO.md`.

### Changed
- **Redesigned sound effects.** Every sound now has a soft attack, a gentle decay and a shared warm room reverb. Repeated sounds (bubbles, bricks) walk up and down a pentatonic scale so a long run sounds like a little melody instead of a repeat. Nothing is shrill (no sound goes above about 2.6 kHz). New soft sounds for card flips, matches and balloon bounces.
- The Updates screen is now fully inside the app: installed and available version, a headline, the release notes, the download size and the content included, with **Install**. The top-right notice reads "Cloud-Freelife 1.3.1 is available" or "New content is ready" with **Install**, **Details** and **Later**. The app no longer shows any website, repository name or link, and it can no longer open web pages at all. It still downloads from the official release hosting, and still verifies the expected file name, host, size and SHA-256 first.
- Settings from 1.2 are upgraded once: background music is switched on the first time (it is new). After that your choice is kept.
- A slightly darker secondary text color for easier reading in every theme.

### Fixed
- The Read Aloud speed buttons wrap instead of overflowing in narrow windows.

### Not in this version
Meditation, Gentle Movement, four new relaxing mini-games, more levels for the existing games and Splash Wall gallery saving are planned for 1.4.0, with very long stories and optional voice packs for 1.5.0. See the roadmap.

## [1.2.0]

### Added
- **Cozy Stories**: six short, gentle stories to read slowly (*The Cloud Who Lost Its Rain*, *A Lantern for the Little Owl*, *The Tea Shop at the Rainbow's End*, *Moss and the Midnight Garden*, *The Whale Who Hummed*, *Snow Day in Mushroom Village*). A comfortable reader with adjustable text size; it remembers which chapter you were on.
- **Story Adventures**: six choose-your-path stories told in the first person as a guy or a girl, with five to nine endings each: *The Lantern Trail* and *The Museum After Midnight* (girl), *Skyship Summer* and *The Great Pie Disaster* (guy), plus the romances *The Bakery on Maple Lane* (a girl and the flour boy) and *Letters at the Lighthouse* (a guy and the lighthouse keeper's daughter). Filter by who you play as or by genre, step back to change a choice, and track which endings you have found. It saves your place.
- Both sit on Home and in the sidebar above Mini-Games.
- Eight new coloring pages, two each for Castle Dreams (*Unicorn Meadow*, *Swans on the Moat*), Ocean Friends (*Dolphin Jump*, *Glowing Jellyfish*), Sweet Treats (*Donut Shop*, *Birthday Cake*) and Forest Friends (*Deer in the Glade*, *Squirrel and Acorns*). The library now has 46 pages.
- A *Reading size* setting (Settings, Display).
- Story and adventure content can be shipped as content packs (`stories` and `adventures` kinds). See `docs/CREATING_STORIES.md`.

### Changed
- Forest Friends: the Sleepy Bear's head now sits down on its shoulders so it looks like one connected bear.

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
