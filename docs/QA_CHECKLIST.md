# Manual QA checklist

Run through this on the **built** app (`npm run tauri build`, then the installed or portable exe) before every release. Tick each box; note the app version and Windows version at the top of your notes.

## Launch & shell
- [ ] App opens quickly (< 2 s) with no console window, no white flash.
- [ ] Home shows Continue Painting, Open Coloring Books, Start Free Draw, Games.
- [ ] Every sidebar item opens its screen: Home, Coloring Books, Free Draw, Gallery, Games, Updates, Settings, About.
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

## Games
- [ ] Pastel Breaker: all 12 levels open; Relax / Classic / Endless; paddle follows the mouse; particles; level-complete screen; Classic game-over.
- [ ] Splash Wall: all 16 levels open; aim, click-throw, hold-to-charge throw; splat stays in the region; goals count correctly; color match hints; Wash and Save PNG.
- [ ] Pause with P; minimize the window and confirm CPU drops to ~0.

## 1.7.1 checks (avatar)
- [ ] The sidebar top shows only the avatar, "Project D.R.E.A.M" and "Cloud Sonata". The five words are on the About page.
- [ ] An avatar saved by 1.7.0 opens unchanged. Style tab: Chibi, Anime, Semi-realistic and Storybook each look different; the sliders still work after changing style.
- [ ] Face tab: head width and height, chin, eye shape, eye size, eye spacing, mouth and ears all change the picture at once. Reset puts the style's shape back.
- [ ] Body tab: body type and neck length/width change the portrait without gaps between head, neck and body.
- [ ] Extras tab: each hat, glasses, earrings and hair accessory shows, takes a color, and none removes it. A cap or beanie hides a bun and spikes.
- [ ] Frame tab: every frame looks right with a drawn avatar and with a picture; the sidebar avatar is not cut off by a frame.
- [ ] Picture tab: Choose a picture opens the Windows file window. After choosing, drag, zoom (slider and wheel) and turn it; Use this picture makes it the avatar. A non-picture file or a file over 12 MB gives a plain message. Use my drawn avatar goes back; Delete picture removes it.
- [ ] My looks: Save this look asks for a name; Use brings it back (with its frame); Delete asks first; the 13th look is refused with a message.
- [ ] Close and reopen the app: the avatar, frame, picture and looks are all still there.

## 1.7.0 checks
- [ ] Sidebar: the avatar circle (empty with a +) is top left with the full name "Project D.R.E.A.M", "Cloud Sonata" and the five words under it. Gallery is last under Explore.
- [ ] Click the avatar: choose Girl or Boy; change hair style, hair, eyes, skin, clothes, clothes color and background; each change shows at once and is still there after restarting. Remove avatar returns to the empty circle. Esc closes the editor.
- [ ] Story Adventures: the avatar shows on the page header ("Playing as you") and on every adventure; clicking it opens the editor.
- [ ] Every game: finishing a level shows "Congratulations! Level N complete" with Play again on the left and Next level on the right; finishing the last level shows "You finished every level!" and Back to level 1.
- [ ] Memory Meadow > Endless: round 1 has 8 cards, each round adds 4 cards, a big board (10 x 10) is still readable, and Next round works.
- [ ] Meditation: Sort by time reorders the cards; the choice is still set after restarting.
- [ ] Export PNG and Timelapse: a notice appears for several seconds with the file name and Show in folder; the button opens the folder with the file selected.
- [ ] Free Draw: Add layer works up to 10; Delete or Backspace on a selected layer asks to delete it; undo brings it back; a 10-layer painting saves and reopens.
- [ ] Opening a coloring page and opening Free Draw play different soft sounds; Watercolor, Marker, Ink, Glitter and Crayon sound different while painting.
- [ ] Cozy Stories and Story Adventures open on the All tab; Continue is the second tab.

## 1.6.3 checks
- [ ] Coloring Books (the books, and the pages inside a book), Meditation, Exercise, Cozy Stories (All stories) and Story Adventures show five cards across at a full-size window; narrower windows show fewer columns, never a sideways scrollbar.
- [ ] Settings > Display > App icon: pick another icon and the taskbar button changes within a couple of seconds (and the title bar icon too). Picking the original icon again puts it back.

## 1.6.2 checks
- [ ] The sidebar and Home say **Games** and **Exercise**; the Exercise pages say "exercise" rather than "movement".
- [ ] Open Exercise on a light theme (Cloud Morning) and a dark one (Moonlight): the little friend is clear on both, and there is no pastel sky box behind it.
- [ ] Free Draw: throw a paintball, then Clear canvas right away and a few seconds later: nothing is left on the canvas.
- [ ] Turn off the Internet and press Check for Updates: the message is a plain sentence with no web address.

## 1.6.1 checks: paint mode
- [ ] On a coloring page the switch reads **Inside the lines / Splash anywhere / Fill areas**; on Free Draw it reads **Inside areas / Anywhere / Fill areas**.
- [ ] Inside the lines: a stroke that starts in one area never crosses its outline (try Brush, Watercolor, Glitter, Stamp and Paintball).
- [ ] Splash anywhere: strokes cross the lines freely.
- [ ] Fill areas: tapping with any painting brush fills that area; the Eraser still erases normally; Undo undoes the fill.
- [ ] Free Draw: draw a closed shape, switch to Inside areas and scribble from inside it: color stays in the shape. Fill areas fills only the shape or only the outside.
- [ ] A coloring page remembers its mode after restarting; a new Free Draw always starts on Anywhere.
- [ ] Timelapse of a painting made with Fill areas replays the fills.

## 1.6.1 checks (quiet updates; test on an installed copy, from one version to the next)
- [ ] Updates shows **Update now** (not "Install") and the line "updates quietly and reopens Cloud-Freelife".
- [ ] Pressing it shows no installer window, no UAC prompt, no question and nothing in File Explorer; the app closes, then reopens on the new version within about half a minute.
- [ ] Paintings, Gallery, albums, settings, story places and Meditation favorites are all still there afterwards.
- [ ] After the restart there is no Cloud-Freelife installer left in `Downloads\Cloud-Freelife` and no `update` folder in the app's data folder (the second may take until the next start).
- [ ] A copy unpacked from the portable zip still gets the old behaviour (Install, then the installer is shown).
- [ ] Turn off the Internet in the middle of the download: a clear message, and the app stays open and untouched.

## 1.6 checks
- [ ] Layers (Free Draw): Add up to four; paint on each; show/hide, lock (a gentle message appears when you try to paint on a locked or hidden layer), rename, move up and down, copy, merge down, delete (asks first), opacity and each blend mode; Undo and Redo work across every one of these, including delete and merge.
- [ ] Layers survive closing and reopening, Duplicate in the Gallery, Export PNG (looks the same as in the painter) and Timelapse.
- [ ] Old paintings: open a Free Draw from 1.5 (it shows one layer and looks the same), add a layer, save, reopen. A coloring page shows no Layers panel and paints as before.
- [ ] Damage test: delete one of a painting's layer-*.png files in the data folder; the painting still opens (flattened) instead of failing.
- [ ] Brushes: Watercolor, Pastel, Ink Pen and Glitter each paint on coloring pages and Free Draw, honor Stay inside lines, and Undo works. Stamps: all eight shapes, size follows the size slider, one Undo removes one stamp.
- [ ] Reference picture: choose a PNG/JPG/WebP, see it beside and faintly over the canvas, change strength, hide, remove; it is not in Export PNG or the Gallery thumbnail; it is still there after reopening.
- [ ] Gallery: search by name (also without accents), the filter chips, New album, add a painting to two albums, open an album, rename and delete an album (paintings stay), delete a painting and see it leave its albums.
- [ ] Quiet Moments: the pack installs from Updates and its four sessions run (the two "stillness" ones show their cues and no breathing cloud pattern).

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
- [ ] Exercise: all ten cards open with a picture, steps, Previous / Next (and arrow keys), an optional timer, a favorite heart and the "not medical advice" note.
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
- [ ] Home and the sidebar show **Cozy Stories** and **Story Adventures** above Games.
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
