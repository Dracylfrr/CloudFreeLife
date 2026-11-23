# Manual QA checklist

Run through this on the **built** app (`npm run tauri build`, then the installed or portable exe) before every release. Tick each box; note the app version and Windows version at the top of your notes.

## Launch & shell
- [ ] App opens quickly (< 2 s) with no console window, no white flash.
- [ ] Home shows Continue Painting, Open Coloring Books, Start Free Draw, Mini-Games.
- [ ] Every sidebar item opens its screen: Home, Coloring Books, Free Draw, Gallery, Mini-Games, Updates, Settings, About.
- [ ] Window can be resized down to 980 × 660 and up to a 4K screen without clipped or out-of-place controls on any screen (check Gallery cards, the painter top bar, every game bar, Settings).
- [ ] Repeat at *Settings → Display → Interface size* 125 % and 140 %: the sidebar turns into icons and everything still fits.

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

## Cozy Stories & Story Adventures
- [ ] Home and the sidebar show **Cozy Stories** and **Story Adventures** above Mini-Games.
- [ ] Open each of the six stories; the text size buttons (A-/A+) change the text, Next/Previous and the arrow keys move chapters, and "The End" appears after the last chapter.
- [ ] Leave a story halfway, restart the app, reopen it: it is on the same chapter.
- [ ] Story Adventures: the "Play as a guy / girl" and genre filters work; each card shows its endings found.
- [ ] Play an adventure: keys 1-4 choose, Step back undoes a choice, Start over restarts, an ending shows its title and the endings tracker.
- [ ] Leave an adventure mid-way and restart the app: "Welcome back" and the same passage. A finished run starts over next time, but found endings stay.
- [ ] Nothing overflows the window at the smallest size or at a large interface scale.

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
- [ ] Idle on Home: well under 350 MB private memory across all WebView2 processes and only a percent or two of one CPU core with the ambient scenery on; ~0 % with Reduced Motion, when minimized, or on the painting screen.

## Packaging
- [ ] Installer installs per-user, creates a Start Menu entry, icon shows the cloud + brush.
- [ ] Portable zip runs from a USB stick / any folder.
- [ ] Uninstall removes the app but not `%APPDATA%\Cloud-Freelife`.
