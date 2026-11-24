# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com), and the project uses [Semantic Versioning](https://semver.org).

## [1.6.0]

### Added
- **Layers in Free Draw.** Up to four layers, with a Layers panel beside the colors. Show or hide a layer, lock it so it cannot be painted on by accident, rename it (double-click), move it up or down, copy it, merge it into the one below, set its opacity and choose a blend mode (Normal, Multiply, Screen, Overlay, Soft Light, Color, each with a one-line explanation). Every layer action can be undone, including deleting a layer. Coloring pages are unchanged and keep their single paint layer under the line art.
  - **Old paintings are safe.** An older Free Draw opens exactly as before as a single layer, and nothing is converted until you add a second layer. Even then the flattened picture (`paint.png`) is always kept, so the Gallery, Export PNG and Splash Wall saves keep working, and the old single-layer file is kept as a backup for the first few saves. If a layer file is ever missing or damaged, the painting opens from the flattened picture instead.
  - Export PNG, Duplicate and Timelapse all understand layers.
- **Four new brushes**: *Watercolor* (soft, see-through washes with a slightly darker rim), *Pastel* (chalky and grainy), *Ink Pen* (thin and steady) and *Glitter* (a soft trail of sparkles). They work on coloring pages and Free Draw, and on whichever layer is selected.
- **Stamps**: press a star, heart, flower, cloud, leaf, paw, moon or drop in your chosen color, with a little random tilt. A stamp is one undo step and respects *Stay inside lines*.
- **Reference picture**: keep a picture in view while you paint. Show it beside the canvas, or faintly over it to trace (with a strength slider). It is only for looking at: it is never part of the painting or its exports, and it stays on this computer, resized so it stays small.
- **Gallery albums and search**: make albums, put any painting in as many as you like, and search by name. Filter by All, Coloring pages, Free Draw or Splash Wall. Deleting an album never deletes paintings.
- **Quiet Moments**, four more meditation sessions as a downloadable pack: *Gentle Morning*, *Soft Shoulders*, *Before Sleep* and *A Kind Thought*.

### Changed
- Timelapse recordings now include layer actions and stamps (older recordings still replay).

### Not in this version
A new coloring book, and per-layer export, are not part of 1.6.0.

## [1.5.0]

### Added
- **Two long cozy stories and a long adventure, as downloadable packs** (open Updates to install them; the installer stays small):
  - *Tales of the Slow Country* (one pack, two stories that sit together on the shelf as a series): *The Tea Boat on Willow River* (10 chapters, about 27 minutes), a slow day of delivering tea and small kindnesses down a river, and *The Cartographer of Small Things* (12 chapters, about 31 minutes), a young badger who learns to look closely and discovers a whole country under the hedge. Both have a picture at the start of every chapter, part headings and "good place to rest" markers.
  - *The Night Market at Lamplight Quay* (a mystery adventure with 33 passages, about 5,700 words and 7 endings): the first flame of the night market has gone missing and the tide turns at nine.
- **Bookmarks** in Cozy Stories: leave a bookmark (with a short note) at any place, see them in a list and jump back. Up to 20 per story.
- **Time left** while reading: "About 12 minutes left in this chapter, about 41 in the story", scaled by your text size.
- **Sleep mode** for reading in bed: dimmer page, larger text, no motion, and the music fades out after 15, 30 or 60 minutes.
- Long-story structure for authors: **series** (parts shelved together, "part 2 of 3"), **parts** headings in the chapter list and **good place to rest** markers. See docs/CREATING_STORIES.md.
- **Installable themes**: a theme can be shipped as a content pack and appears in Settings, Display. Colors are checked for readability first.
- **Import your own line art**: Coloring Books, Import line art turns a clean outline picture (PNG, JPG, WebP or SVG) into a page in the new My Pages book. Closed shapes become areas you can color, and the page paints, saves and exports like any other.
- **Timelapse**: pictures you start from now on keep a light log of your strokes, and a **Timelapse** button replays it as a short .webm video you can save. (Free Draw layers are planned for 1.6.0.)

### Changed
- Story cards show longer lengths properly ("2 h 10 min").
- Settings from 1.4 and older keep working: an unknown or installed theme in the settings file is kept, and shows the default theme until it is available.

### Not in this version
Free Draw layers are planned for 1.6.0, in a release of their own. See the roadmap.

## [1.4.1]

### Changed
- **Pick your background music.** Settings, Audio now always lets you choose one of the four tracks (Soft Morning, Quiet Garden, Rain Pause, Starry Night), even when a mood preset is on, and the track starts playing right away. With a mood on, a *Match my mood* choice hands the decision back to the mood.
- **Softer, bubblier background music.** Each track now has little runs of soft bubbles that rise a touch in pitch, on top of the pad and bells. Soft Morning has the most, Starry Night the fewest. Chords change a little sooner, the levels stay quiet, and during a meditation the bubbles step far back.

## [1.4.0]

### Added
- **Meditation.** Six optional quiet sessions: *One Minute Reset* (1 min), *Cloud Breathing* (3 min), *Quiet Garden* (5 min), *Evening Wind Down* (8 min), *Rain Pause* (4 min) and a *Silent Timer* you set to 1, 3, 5, 10, 15 or 20 minutes. A soft cloud grows and settles as you breathe, short gentle cues appear on screen, and a quiet bowl sounds at the start and the end. You can pause, finish early or leave at any time and it is always "lovely". There are no streaks, goals or scores. The app remembers only your favorites, the last session you took and how many times you finished each one, in one small file on your computer. These are relaxation exercises only, with no medical claims.
- **Gentle Movement.** Ten stretch-and-break cards with a friendly picture, short step-by-step instructions, an approximate time, Previous / Next, favorites and an optional timer: *Shoulder Rolls*, *Neck Mobility*, *Wrist Break*, *Hand Stretch*, *Seated Side Stretch*, *Standing Reach*, *Gentle Back Stretch*, *Ankle Circles*, *Short Desk Break* and *Full Body Reset*. General movement ideas, not medical advice. No points, levels or rewards.
- **Four new relaxing mini-games** (Mini-Games now has eight):
  - **Bubble Garden**: tap to pop, or drag matching colors together to merge them. Modes *Relax*, *Color Match* and *Endless*, six levels.
  - **Cloud Catcher**: drag drifting clouds, stars, moons, raindrops and petals into soft zones. Modes *Relax*, *Color Match*, *Pattern* and *Endless*, six levels.
  - **Zen Garden**: rake lines in the sand and place stones, plants, flowers and bushes. Five backgrounds (warm sand, lavender sand, moonlight, garden, seaside), automatic saving, and *New*, *Duplicate*, *Clear* and a gallery of your saved gardens.
  - **Paint Flow**: join the matching colors with a flowing line of paint, in *Puzzle*, *Relax* and *Free Flow* modes. Twelve handcrafted boards from 4 x 4 to 7 x 7, with Undo, Reset and Hint, and no timer.
- **Six more levels in every older mini-game**, all unlocked from the start: Pastel Breaker (12), Splash Wall (16), Memory Meadow (12) and Pastel Puzzle (14, up to 30 pieces).
- **Splash Wall: Save to Gallery.** Any wall, finished or not, can be saved to the Gallery, where it can be opened, painted on some more, renamed, duplicated or exported as a PNG. *Export PNG* is still there for saving a file directly.
- **App icon.** Settings, Display now has five little cloud icons (*Morning Cloud*, *Lavender Dusk*, *Mint Meadow*, *Peach Sunrise*, *Moonlit Cloud*). The choice changes the app's corner logo and the icon in the window and taskbar. The installed shortcut and the .exe file keep the original icon (Windows reads those from the file).
- **Home** has cards for Meditation and Gentle Movement, and the *Continue* card now also resumes your last meditation or Zen garden, whichever you touched most recently.
- New content kinds for packs and a shared, tiny local save for progress. New guides: [docs/CREATING_WELLNESS.md](docs/CREATING_WELLNESS.md) and four new level sections in [docs/CREATING_LEVELS.md](docs/CREATING_LEVELS.md).

### Changed
- **A tidier sidebar.** Home stays on top, then an **Explore** group (Coloring Books, Free Draw, Gallery, Cozy Stories, Story Adventures, Mini-Games, Meditation, Gentle Movement) and an **App controls** group (Updates, Settings, About). Each group can be folded away with its heading, the choice is remembered, and the group you are in always stays open. In a narrow window the groups become icons with a thin line between them.
- **Cozy Stories and Story Adventures are separate again**: two entries in the sidebar, two cards on Home and two screens, each with its own Continue / All / Not started / Finished / Favorites tabs. Books you simply read live in Cozy Stories; the stories where you choose live in Story Adventures. Nothing was removed and all your saved places are kept.

### Removed
- **Read Aloud** (added in 1.3.0) is gone for now. The player, its settings (voice, tone, speed, highlight, keep reading) and the music ducking that went with it are removed, so stories are for reading. A better narration may come back later. Your reading place is kept, and old Read Aloud settings in an existing settings file are ignored.

### Fixed
- Cloud Catcher draws each cloud with one clean outline.
- Progress for the mini-games (solved Paint Flow boards and the last game played) is now loaded when the app starts and saved when you leave.

### Not in this version
Very long stories are planned for 1.5.0. See the roadmap.

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
