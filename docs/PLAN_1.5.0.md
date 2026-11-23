# Plan for 1.5.0 (draft)

Status: planning only. Nothing here is built yet. Decisions already made are marked **Decided**.

## Goals
1. **Very long reads** that feel good over 30 minutes to several hours, with the tools to pick up where you left off.
2. **Keep the installer small** (about 3 MB today). Long stories are mostly downloadable.
3. Add three of the "later ideas" you chose: **import your own line art**, **timelapse export**, **installable themes**. (**Free Draw layers** were moved to 1.6.0, see below.)
4. Same promises as always: offline, no telemetry, nothing locked, nothing to fail.

No narration or voice work is planned. Read Aloud was removed in 1.4.0 and stays out until you choose models.

## Decided
- Long stories ship as **downloadable story packs**; the app carries only the reader features plus a short starter.
- Writing target: **two long stories and one long adventure**, each about 30 to 60 minutes (roughly 6,000 to 12,000 words).
- Reader features: **bookmarks and resume**, **reading time left**, **sleep mode**, **series and collections**.
- Extras: **import line art**, **timelapse export**, **installable themes**.
- **Free Draw layers move to 1.6.0**, in a release of their own.

## Where things stand today
- The longest story is about 1,800 words (7 chapters, about 8 minutes). The longest adventure has 32 scenes and about 2,000 words.
- Story and adventure progress is saved as one small file (`progress/stories.json`) with chapter, paragraph, favorites and endings found.
- The painting engine is 750 lines with one paint layer per artwork (`paint.png`), and a region map is already built from raster data (`RegionMap.fromRgba`), which helps with imported line art.
- Content packs, SHA-256 verification and the Update Center already exist, so new pack kinds are cheap to add.

## Workstreams

### A. Long-story reader (core of the release)
| Feature | What it means | Notes |
|---|---|---|
| Bookmarks | Tap a paragraph to leave a bookmark (optional short note). A list lets you jump between them. Up to about 20 per story. | Stored in `progress/stories.json`; extend the sanitizer, keep old files working. |
| Resume | Opening a story returns to the exact paragraph (already saved today) and says "Continue from chapter 5". | Mostly present; polish plus tests with 10x longer stories. |
| Reading time left | "About 12 minutes left in this chapter, 41 in the story." Based on about 200 words a minute, scaled by the Reading size setting. | Pure function, easy to test. |
| Good place to stop | A soft marker at chapter ends, with no pressure to continue. | Optional field `rest: true` on a chapter. |
| Sleep mode | One button: dimmed page, larger text, no animation, and the music fades out after 15, 30 or 60 minutes. | Reuses themes and the audio engine; no new files. |
| Series and collections | A `series` field groups stories ("The Lantern Lane books, part 2 of 3"); the shelf shows one stack that opens to its parts. | Manifest change (`series: {id, name, order}`), shelf grouping in `readingList.ts`. |
| Chapter list at scale | Search-free jump list stays usable with 20 to 40 chapters; group by "part". | Add optional `part` to chapters. |

Adventures get the same bookmarks, resume and time-left (time left is shown as "about N minutes for a typical path").

### B. Long-form content (the biggest piece of work)
- **Writing**: two long stories and one long adventure, drafted and edited in this repo, then split into chapters and illustrated at chapter starts, like the 1.3 stories.
- **Length budget**: 6,000 to 12,000 words each as plain JSON. A 12,000-word story is about 70 KB of text, so size is dominated by illustrations (about 20 to 60 KB each as SVG).
- **Packs**: each long piece is one `.cfpack` (kinds `stories` and `adventures` already exist). The Update Center shows them as downloadable content.
- **Starter inside the app**: one medium story ships inside the installer so the reader features work offline on a fresh install.
- **Quality bar**: read each draft end to end, run the existing story lint (short paragraphs, plain punctuation), check every adventure ending is reachable, and test the reader with the real packs.

### C. Import your own line art
- Pick an SVG or PNG; the app converts it to a coloring page stored in the user's data folder (not in the install folder).
- PNG path: threshold to black lines on white, build the region map with the existing `RegionMap.fromRgba`, store `lineart.png` plus `page.json`.
- SVG path: rasterize at the canvas size, then the same path.
- Limits: file size cap (a few MB), dimension cap, scripts and external links stripped from SVG.
- Shows up in a new "My Pages" book on the shelf. Deleting removes only that page.
- Honest limit: photos and shaded art will not make good coloring pages; the import screen says so and shows a preview before saving.

### D. Free Draw layers (moved to 1.6.0)
This section is kept as the starting design for 1.6.0 and is not part of 1.5.0.

- Two to four layers per Free Draw artwork, with show/hide, reorder and an opacity slider. Coloring pages keep their single paint layer plus line art.
- Storage: `layer-1.png`, `layer-2.png` ... next to `artwork.json`; a flattened `paint.png` is kept for the Gallery and exports, so older artworks and the Gallery need no migration.
- This is the riskiest change, because it touches the 750-line engine, undo and autosave. It needs its own undo history per layer and a lot of tests.

### E. Timelapse export
- Record a light stroke log while painting (tool, color, size, points), saved as a small file beside the artwork.
- Export replays it onto a canvas and records a short WebM video with the browser's `MediaRecorder`, then saves it with the usual save dialog.
- Honest limits: only artworks painted after 1.5.0 have a log; fill-bucket and region fills are recorded as events too; the video format is WebM unless an MP4 path is found that stays small.
- Needs a check that WebView2 `MediaRecorder` works in the packaged app (it is untested today).

### F. Installable themes as packs
- A new pack kind `themes`: one JSON file of color tokens (the same tokens as the built-in themes) with validation, contrast checks and a preview.
- Installed themes appear after the built-ins in Settings, Display. A broken theme is skipped and never blocks the app.
- Document it in `docs/THEMES_AND_AUDIO.md`.

## Suggested order and where to cut
All of this in one release is a lot. A sensible order, with a cut line:

1. **Reader upgrades (A)**, **themes as packs (F)** and **import line art (C)**: contained changes that do not touch the painting engine.
2. **Long-form content (B)**, written while 1 is built, so the reader is tested on real long text.
3. **Timelapse (E)** after a quick MediaRecorder check.

**Decided:** ship 1.5.0 after these three steps. **Free Draw layers (D)** are **1.6.0**, because they are the one change that can put people's existing paintings at risk and deserve their own release and test pass.

## Risks
- **Writing volume**: about 25,000 to 35,000 words of new prose. This is the long pole, so it should start first and run alongside the code.
- **Layers and undo (1.6.0)**: the one change that can corrupt user art if wrong. Needs migration tests and a backup-on-first-open for existing artworks.
- **MediaRecorder** in the packaged WebView2 is unverified.
- **Import quality**: results depend heavily on the source image.
- **Installer size**: new code is small; keep the long stories out of the bundle.

## Testing plan
- Unit tests: bookmark sanitizer, reading-time math, series grouping, theme validation, line-art conversion (synthetic images), stroke-log replay.
- Content tests: every new story passes the lint; every adventure ending is reachable; packs validate and install in the Update Center test harness.
- Packaged-app checks (as in 1.4): reader on a real 10,000-word story, a theme pack install, a line-art import, a timelapse export, and CPU/memory with a long story open.
- Manual QA list additions in `docs/QA_CHECKLIST.md`.

## Open questions
- Titles, genres and settings for the two long stories and the adventure (for example one cozy slice-of-life, one gentle fantasy, one mystery adventure).
- Whether "My Pages" imported art should also be exportable and shareable as a pack.
- Whether timelapse should be WebM only or worth adding a small MP4 path.

## Build status (working notes)
Built and tested in the browser pane and by unit tests (not yet in a packaged build):
- Reader: bookmarks, time left, sleep mode, rest markers, chapter parts, series shelves.
- Installable themes (pack kind `themes`).
- Import your own line art (Coloring Books, Import line art, My Pages).
- Timelapse (stroke log plus WebM export).

Written since: *Tales of the Slow Country* (*The Tea Boat on Willow River*, about 5,100 words, and *The Cartographer of Small Things*, about 5,800 words) and the adventure *The Night Market at Lamplight Quay* (33 passages, about 5,700 words, 7 endings). They are shorter than the 6,000 to 12,000 word target: about half an hour each rather than up to an hour. No separate starter story was written; the first long story can serve that purpose once installed.
