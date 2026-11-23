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
- [ ] Pastel Breaker: all 12 levels open; Relax / Classic / Endless; paddle follows the mouse; particles; level-complete screen; Classic game-over.
- [ ] Splash Wall: all 16 levels open; aim, click-throw, hold-to-charge throw; splat stays in the region; goals count correctly; color match hints; Wash and Save PNG.
- [ ] Pause with P; minimize the window and confirm CPU drops to ~0.

## 1.5 checks
- [ ] Reader: bookmark a spot with a note, leave, come back and jump to it; remove it; the list is limited to 20; "time left" falls as you read and grows with bigger text.
- [ ] Reader: Sleep mode dims the page, enlarges the text, stops the page-turn motion and fades the music out after 15, 30 or 60 minutes; turning it off (or leaving the story) brings the music back.
- [ ] Chapters with a `part` show headings in the chapter list; a chapter with `rest` shows the rest note.
- [ ] Stories with the same `series` sit together under one heading, in order, with "part N of M" on each card.
- [ ] Themes: a theme pack installs and appears after the built-in themes; picking it works; Higher Contrast still works; a pack with unreadable colors is refused with a clear reason.
- [ ] Coloring Books, Import line art: a clean outline drawing becomes a page in My Pages, fills stay inside the lines, a photo or a blank picture is refused with a plain message, Remove deletes only that page.
- [ ] Timelapse: after painting a new picture, the Timelapse button appears; the video plays your painting back and saves as a .webm in the packaged app; Cancel stops it cleanly; an older picture that had paint before 1.5 has no Timelapse button.

## 1.4 checks
- [ ] Settings, Audio: each of the four tracks can be picked at any time (also with a mood on) and starts playing; *Match my mood* appears with a mood on and returns control to it; the choice survives a restart.
- [ ] Sidebar: Home, then Explore (eight entries) and App controls (Updates, Settings, About); each heading folds and unfolds, the choice survives a restart, the group you are in stays open, and the Updates dot shows on the App controls heading while it is folded.
- [ ] Sidebar and Home show Cozy Stories and Story Adventures as two separate places; each has its own tabs; the Home Continue card resumes the last painting, story, adventure, meditation or Zen garden.
- [ ] Meditation: each of the six sessions starts, shows the cloud and cues, pauses and resumes (the clock stops while paused), finishes early without any "failed" wording, and rings the soft bowl; Silent Timer offers 1, 3, 5, 10, 15 and 20 minutes; leaving the screen mid-session stops all sound; favorites and "last time" survive a restart.
- [ ] Gentle Movement: all ten cards open with a picture, steps, Previous / Next (and arrow keys), an optional timer, a favorite heart and the "not medical advice" note.
- [ ] Bubble Garden: pop by click, merge by dragging matching colors, Color Match requests complete, Relax / Color Match / Endless, all six levels; Space pops the lowest bubble.
- [ ] Cloud Catcher: dragging into the right zone works in each mode (Relax, Color Match, Pattern, Endless); all six levels.
- [ ] Zen Garden: rake, stones, plants, flowers, bushes, Move, Erase, Undo, Clear (asks first); each of the five backgrounds; leave and come back and the garden is still there; New, Duplicate and the Gardens list work; a corrupt file in `gardens\` is skipped, not fatal.
- [ ] Paint Flow: all twelve boards are solvable (Hint solves them); Undo, Reset, Free Flow and Relax; keyboard cursor works.
- [ ] Old games: the new levels (Pastel Breaker 7-12, Splash Wall 11-16, Memory Meadow 7-12, Pastel Puzzle 9-14) all open and none is locked.
- [ ] Splash Wall: **Save to Gallery** adds an item that opens in the painter and exports as a PNG; **Export PNG** still opens the save dialog.
- [ ] Settings, Display, App icon: each of the five icons changes the corner logo at once and the window / taskbar icon; the choice survives a restart.
- [ ] Reduced Motion and Disable Particles calm every new screen; Higher Contrast stays readable; every new screen works with the keyboard alone.
- [ ] Minimize the window during a meditation, a game and a Zen garden: CPU drops to near zero.

## 1.3 checks
- [ ] Themes: pick each of the eight and Follow System in Settings, Display. Everything stays readable, Higher Contrast still works, paintings never change color, the choice survives a restart.
- [ ] Mood presets change the sound and the drift speed but not the colors.
- [ ] Background music plays after the first click, fades when turned off, stops when the window is minimized,.
- [ ] Volume sliders play a short preview when released; Mute silences previews too.
- [ ] There is no Read Aloud button in the story reader, and an old settings file that still has Read Aloud settings opens without any problem.
- [ ] Stories: Continue, Cozy Stories, Story Adventures, Not started, Finished and Favorites tabs; favorites persist; "Chapter N of M" and the progress bar update.
- [ ] Every story picture loads; deleting one on disk does not stop the story from reading.
- [ ] The Updates screen shows installed and available versions, a headline, notes, size and Install, and no website, repository name or link anywhere.
- [ ] Offline: everything except update checks works with no Internet.

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
