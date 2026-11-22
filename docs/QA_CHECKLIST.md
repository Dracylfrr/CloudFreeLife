# Manual QA checklist

Run through this on the **built** app (`npm run tauri build`, then the installed or portable exe) before every release. Tick each box; note the app version and Windows version at the top of your notes.

## Launch & shell
- [ ] App opens quickly (< 2 s) with no console window, no white flash.
- [ ] Home shows Continue Painting, Open Coloring Books, Start Free Draw, Mini-Games.
- [ ] Every sidebar item opens its screen: Home, Coloring Books, Free Draw, Gallery, Mini-Games, Updates, Settings, About.
- [ ] Window can be resized down to 980 × 660 without clipped controls.

## Coloring books (repeat for each of the 18 pages)
- [ ] Cloud Dreams (6), Cosmic Colors (6), Peaceful Places (6): each page opens, line art is crisp.
- [ ] Fill Bucket fills a region; filling again with another color replaces it (never locked).
- [ ] Brush / Marker / Crayon / Airbrush strokes are smooth; a fast stroke has no gaps.
- [ ] *Stay inside lines* ON keeps paint in the starting region; OFF paints freely.
- [ ] Eraser removes paint; Clear Region empties one region; Color Picker picks a painted color.
- [ ] Paintball: Small / Medium / Large, animation plays, splat is cute; undo removes it; eraser erases it; recolor over it works.
- [ ] Undo / Redo (buttons and Ctrl+Z / Ctrl+Y) across strokes, fills, paintballs and Reset.
- [ ] Zoom (wheel, +/-), Pan (Space+drag, Pan tool, middle mouse), Fit (0 or click %).
- [ ] Reset page asks for confirmation; Cancel keeps the art; Confirm clears it.
- [ ] Palette switcher: all 10 palettes; color names show; Custom color picker works.

## Free Draw
- [ ] All 8 backgrounds open (white, warm cream, cloud blue, lavender, mint, pastel pink, starry sky, soft clouds).
- [ ] Tools work; Clear canvas asks for confirmation.

## Autosave & Gallery
- [ ] "Saving…" then "Saved" appears after you stop painting (not while the mouse moves).
- [ ] Switch page / go Home / close the window right after painting → art is there on relaunch.
- [ ] Kill the app (Task Manager) 3 s after painting → art persists.
- [ ] Gallery shows thumbnail, title, book, page, last-edited date.
- [ ] Open, Duplicate, Rename, Export PNG (open the PNG: paper + paint + lines), Clear (confirm), Delete (confirm).
- [ ] Artwork is in `%APPDATA%\Cloud-Freelife\artworks\…`; reinstalling/updating keeps it.

## Mini-games
- [ ] Pastel Breaker: all 6 levels open; Relax / Classic / Endless; paddle follows the mouse; particles; level-complete screen; Classic game-over.
- [ ] Splash Wall: all 10 levels open; aim, click-throw, hold-to-charge throw; splat stays in the region; goals count correctly; color match hints; Wash and Save PNG.
- [ ] Pause with P; minimize the window and confirm CPU drops to ~0.

## Settings
- [ ] Reduced Motion removes drifting clouds/bubbles immediately; particles off removes game particles.
- [ ] UI scale, Low Power, 30 FPS take effect; sliders for Master/Music/Ambience/Effects/Painting; Mute.
- [ ] Settings persist after restart.
- [ ] Storage tab shows the data folder; *Open folder* works.

## Updates & offline
- [ ] With Internet and no newer release: *Check for Updates* says up to date (or "No releases published yet").
- [ ] Offline (disable network): app starts instantly, every feature above still works; *Check for Updates* shows a friendly message, not an error dialog.
- [ ] Test release with a newer version: top-right notice *Update available — vX* with **View** / **Later**; **Later** hides it for good; Updates page lists it.
- [ ] Test content release (e.g. `castle_dreams_v1.0.0`): *New coloring book available — Castle Dreams*; Install; the book appears in Coloring Books; artwork made with it survives *Remove*.
- [ ] Tampered pack (wrong checksum) is rejected with a clear message.

## Accessibility & performance
- [ ] Everything reachable and visible with keyboard focus rings; text readable at 140 % UI scale; High contrast mode.
- [ ] Idle RAM on Home < 150 MB; CPU ~0 % when idle or minimized.

## Packaging
- [ ] Installer installs per-user, creates a Start Menu entry, icon shows the cloud + brush.
- [ ] Portable zip runs from a USB stick / any folder.
- [ ] Uninstall removes the app but not `%APPDATA%\Cloud-Freelife`.
