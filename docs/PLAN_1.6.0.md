# Plan for 1.6.0 (draft)

Status: planning only. Nothing here is built yet. Decisions already made are marked **Decided**.

## Goals
1. **Layers for Free Draw**, done carefully, because it is the one change that can put people's existing paintings at risk.
2. A few painting and Gallery upgrades that go with it: **brushes and stamps**, a **reference image overlay**, **albums and search**.
3. **More content packs** (new coloring books, meditation sessions, stories) that need no app change.
4. Same promises as always: offline, no telemetry, nothing locked, nothing to fail, small installer.

## Decided
- **Layers are for Free Draw only.** Coloring pages keep their single paint layer under the line art, so every existing painting and all the line-art and region code stay as they are.
- Layer tools: **show/hide, reorder, opacity, merge down, duplicate, lock and blend modes.**
- Also in 1.6.0: **Gallery albums and search**, **more brushes and a stamp tool**, **a reference image overlay**, **more content packs.**
- **Layer cap: 4.** Four keeps memory and the panel simple.
- **Export PNG stays one flat picture.** No per-layer export in 1.6.0.
- **The reference image is allowed on coloring pages too.** It only shows beside the canvas there, so it is harmless.
- **Brushes in priority order:** Watercolor, Pastel, Ink Pen, Glitter. If time is short, cut from the end of that list.

## Where things stand today
- The paint engine (`src/features/painting/engine.ts`, 750 lines) works on one `paint` canvas (24 places touch it). A stroke is drawn on a separate stroke layer and composited onto `paint`. History is a list of small pixel patches of `paint` (`src/core/undo.ts`, up to 60 steps or 96 MB).
- An artwork is a folder: `artwork.json`, `paint.png` (transparent paint layer) and `thumb.png`. Free Draw draws a background first, then paint. Coloring pages draw paper, paint, then the line art with *multiply*.
- Everything that shows or exports a picture goes through `compose()` or reads `paint.png`: the Gallery thumbnails, Export PNG, `exportArtwork.ts`, Splash Wall saved to the Gallery, and the 1.5 Timelapse (which replays a stroke log on a fresh engine).
- Brushes are data (`BRUSHES` in `tools.ts`), so a new brush is mostly a new entry plus a drawing recipe.

## Workstreams

### A. Layers (the core of the release)

**Model.** A Free Draw artwork has 1 to 4 layers. Each layer: id, name, visible, locked, opacity (0 to 1), blend mode, and its own canvas. The background (paper or one of the Free Draw backgrounds) stays below all layers and is not a layer. Coloring pages have exactly one hidden layer and no layer panel.

**Blend modes.** Normal, Multiply, Screen, Overlay, Soft Light, Color. These map straight onto the canvas `globalCompositeOperation` values, so they are cheap and easy to test. Each mode gets a one-line plain explanation in the panel ("Multiply: darkens, like layering tracing paper").

**Engine changes.**
- `paint` becomes "the active layer's canvas". The 24 places that use it keep working through an accessor, and a stroke, fill, paintball or eraser acts on the active layer only. A locked or hidden layer cannot be painted on: the tool shows a gentle message instead.
- `compose()` draws the background, then each visible layer from bottom to top with its opacity and blend mode, then the line art (coloring pages only).
- History patches record the layer they belong to. Layer operations (add, delete, reorder, merge, duplicate, rename, opacity, visibility, lock, blend mode) are history entries too, so Undo works across them. Opacity changes while dragging a slider are one entry.
- Memory: four full-size layers is four times the canvas memory (about 5 MB each at 1280 x 960), which is fine. History's byte limit stays.

**Storage and compatibility.**
- `paint.png` stays and always holds the **flattened** layers without the background, exactly as today. Anything that reads `paint.png` (Gallery export, Splash Wall, older app versions) keeps working with no change.
- New files for layered artworks: `layers.json` (the list, order, names, opacity, visibility, lock, blend mode) and `layer-<n>.png` per layer.
- Opening an old artwork with no `layers.json` makes one layer from `paint.png`. Nothing is converted until you add a second layer.
- **Safety:** the first time a layered save would replace an old single-layer file, the old `paint.png` is copied to `paint.v15.png` and kept until the artwork has been saved successfully three times in a row. Layer files are written first and `layers.json` last, so a power cut never leaves a half-written artwork pointing at missing files. Damaged or missing layer files fall back to `paint.png`.
- Duplicate and delete in the Gallery copy and remove the layer files too.

**Interface.** A "Layers" panel beside the palette in Free Draw: a stack of rows (eye, name, lock, thumbnail), an opacity slider and blend-mode picker for the selected row, and buttons for Add, Duplicate, Merge down and Delete (asks first). Drag to reorder, with Up/Down buttons for keyboard use. Everything reachable with the keyboard, labelled for screen readers and calm under Reduced Motion.

**Timelapse.** The stroke log gets a version bump (v2) with a layer id on each event and layer operations as events. Version 1 logs (from 1.5) keep replaying on a single layer.

**Tests.** Compositing order, opacity and each blend mode (pixel checks on tiny canvases); history across layer operations; merge and duplicate; lock and hide rules; save and load round trips; opening a 1.5 artwork; recovery from a missing or corrupt layer file; flattened `paint.png` matches the composite; timelapse v1 and v2.

### B. Brushes and stamps
- **New brushes** (data-driven like the current ones): Watercolor (soft, edge-darkening, slightly translucent), Pastel (chalky, grainy), Glitter (soft sparkles that follow the stroke) and Ink Pen (thin, steady). No new dependencies, and nothing above the app's gentle visual style.
- **Stamp tool:** stars, hearts, flowers, clouds, leaves, paws and a few more, drawn from simple built-in shapes. Size from the size slider, optional random rotation. A stamp is one history step.
- The tool list gains two or three buttons; the toolbar already scrolls in a small window.
- Brushes and stamps work on the active layer, and are recorded in the timelapse log.

### C. Reference image overlay
- Choose a picture (PNG, JPG, WebP) to show **beside or under** the canvas, faintly (opacity slider), for painting from. It is never part of the artwork or its export.
- It is stored with the artwork as `reference.png` (resized to at most 1600 pixels on the long side, 3 MB cap) so it is still there when you come back, and removed with the artwork.
- A small panel: choose, opacity, show beside / show under, remove.
- Honest limit: no copying of colors automatically; the Color Picker already works on the painting, and a reference-picker is a possible later addition.

### D. Gallery albums and search
- **Albums** are plain data in `albums.json` (id, name, artwork ids). One artwork can be in several albums. Deleting an album never deletes artworks.
- **Search** filters by title as you type. Filter chips: All, Coloring pages, Free Draw, Splash Wall, and each album.
- Album screens reuse the existing Gallery grid; a "Move to album" menu is added to each card. No artwork file changes, so older versions ignore albums.
- Tests: album add/remove, deleting an artwork removes it from albums, damaged `albums.json` starts fresh, search is case- and accent-insensitive.

### E. More content packs (no app change)
Delivered as downloadable packs, in this order of value:
1. A new **coloring book** (about 6 pages) in the same hand-built style.
2. **Meditation sessions:** three or four new ones (for example a body-scan style rest, a gentle morning start, and a short "before sleep" breathing).
3. **A long story or adventure** following the 1.5 format, if wanted.
These can ship at any time and do not block the app release.

## Suggested order and where to cut
1. **A. Layers**, built and tested on its own with the safety net above. This is the release's reason to exist and the riskiest part.
2. **D. Albums and search** and **B. Brushes and stamps**, which are independent of layers and of each other.
3. **C. Reference image overlay.**
4. **E. Content packs**, alongside, any time.

**Cut line:** if layers take longer than expected, 1.6.0 ships layers alone, and B, C and D move to 1.7.0. They are separate enough that this loses nothing.

## Risks
- **Layers and existing art** (the main one): mitigated by flattened `paint.png` staying valid, writing `layers.json` last, keeping the old file until three good saves, and a lot of round-trip tests. A packaged-app check should open a copy of a real 1.5 artwork before release.
- **History across layers:** patches must restore the right layer even after reorders. Covered by tests and by keeping layer ids stable (not positions).
- **Performance:** blend modes and four layers cost more per frame during a stroke. Only the dirty rectangle is re-composited, and Low Power mode caps layers at 2 if it proves slow.
- **Memory:** four layers plus history stays within the existing budgets, but is measured in the packaged app.
- **Scope:** four extras plus layers is a lot; the cut line above is the pressure valve.

## Testing plan
- Unit and pixel tests as listed under A, plus tests for each new brush's output bounds, stamp shapes, albums and the reference-image size limits.
- Content tests for any new packs (same lint as 1.5).
- Packaged-app checks: open a real 1.5 artwork and a Free Draw with four layers, undo across layer operations, close and reopen, export PNG and Timelapse with layers, CPU and memory with four layers.
- QA checklist additions in `docs/QA_CHECKLIST.md`.

## Build status (working notes)
Built and checked in the browser pane and by unit tests: layers (all six actions, blend modes, opacity, undo across layer steps, saving and reopening, flattened paint.png kept, backup of the old file, fallback when a layer file is missing), the four new brushes and stamps, the reference picture, Gallery albums and search, and the Quiet Moments pack.

Not done: the new coloring book (left for a later pack), and per-layer export (decided against). The packaged-app check of an old real painting was not done, because it would touch your own saved art.

## Open questions
None at the moment: the four earlier questions were settled with the defaults listed under Decided. New ones will be added here as the build raises them.
