# Creating stories and adventures

Cloud-Freelife 1.2 reads two kinds of reading content from plain JSON files. No code is involved: drop a folder in the right place (or ship it in a content pack) and it appears in **Cozy Stories** or **Story Adventures**.

```
content/stories/relaxing/<story_id>/story.json        + cover.svg
content/stories/adventures/<adventure_id>/adventure.json + cover.svg
```

Folder names use lowercase letters, digits and underscores. Both kinds need `"minAppVersion": "1.2.0"` or newer, so older apps simply ignore them.

The bundled stories are generated from `scripts/stories/relaxing.mjs` and `scripts/stories/adventures.mjs` (run `npm run content:generate`). You can edit the JSON by hand instead, whichever you prefer.

## Cozy Stories (`story.json`)

```json
{
  "id": "cloud_who_lost_its_rain",
  "name": "The Cloud Who Lost Its Rain",
  "description": "One or two sentences shown on the card.",
  "version": "1.2.0",
  "minAppVersion": "1.2.0",
  "cover": "cover.svg",
  "accent": "#8fc7ec",
  "mood": "Soothing",
  "minutes": 4,
  "order": 1,
  "chapters": [
    { "title": "A Very Dry Morning", "text": ["First paragraph.", "Second paragraph."] }
  ]
}
```

`accent`, `mood`, `minutes` and `order` are optional. Chapters are shown one at a time; the reader remembers the chapter you stopped on.

## Story Adventures (`adventure.json`)

An adventure is a set of *passages*. Each passage is either a place where the reader chooses, or an ending.

```json
{
  "id": "the_lantern_trail",
  "name": "The Lantern Trail",
  "description": "Shown on the card.",
  "version": "1.2.0",
  "minAppVersion": "1.2.0",
  "cover": "cover.svg",
  "genre": "Adventure",
  "protagonist": "girl",
  "hero": "Mira",
  "interest": "Elliot",
  "minutes": 9,
  "start": "start",
  "nodes": {
    "start": {
      "text": ["Paragraph one.", "Paragraph two."],
      "choices": [
        { "text": "Take the river path", "to": "river" },
        { "text": "Climb the old stone steps", "to": "steps" }
      ]
    },
    "river": { "text": ["..."], "choices": [{ "text": "Cross", "to": "end_home" }] },
    "steps": { "text": ["..."], "choices": [{ "text": "Climb", "to": "end_home" }] },
    "end_home": {
      "text": ["The last paragraphs."],
      "ending": { "title": "Wet but Warm", "mood": "cozy" }
    }
  }
}
```

- `protagonist` is `"guy"` or `"girl"`: whose perspective the story is told from. Players can filter by it. Write in the first person ("I") from that character's point of view.
- `genre` is free text (`Adventure`, `Romance`, `Comedy`, `Mystery` get their own colors). `hero` is the narrator's name. `interest` is the love interest in a romance. For now romances are guy-and-girl stories.
- Passage ids use lowercase letters, digits and underscores. A passage has **either** `choices` (1 to 4 of them) **or** an `ending`, never both.
- `ending.mood` is one of `happy`, `sweet`, `funny`, `dreamy`, `cozy` and tints the ending's title.
- Several choices may lead to the same passage; that is a good way to keep a story rich without writing everything twice.
- Keep it gentle and all-ages. Silly "bad" endings are welcome; scary or harsh ones are not what this app is for.

### What the app checks

An adventure is rejected (and listed under *skipped* content) unless:

1. `start` and every choice's `to` point at real passages;
2. it has **at least three endings** (the bundled ones have five or more);
3. every passage can be reached from the start;
4. every passage can still reach an ending (no dead ends or endless loops).

## Covers

`cover.svg` is a 400 x 300 picture in the same soft style as the book covers. SVGs must be passive (no scripts, no external links), the same rule as every other content file.

## Shipping them as a pack

```
node scripts/pack-content.mjs content --id my_stories --version 1.2.1 --name "My Stories" --kind stories --min-app 1.2.0
```

Use `--kind stories` or `--kind adventures` (WebP and PNG pictures travel as base64 inside the pack, and the pack is refused if a story points at a picture it does not contain) (it only changes the wording of the notification). A pack may contain files under `stories/relaxing/<id>/` and `stories/adventures/<id>/`. See [PUBLISHING_CONTENT.md](PUBLISHING_CONTENT.md).

## Progress

The app saves where each reader stopped, and which endings they have found, in `progress/stories.json` inside the data folder. Deleting that file only resets progress.

## Illustrated stories (1.3)

Any story, chapter or scene can carry one picture. Every field is optional, and a story without them (every 1.2 story) reads exactly as before.

```json
{
  "id": "night_train_to_moonwater",
  "name": "The Night Train to Moonwater",
  "description": "...", "version": "1.3.0", "minAppVersion": "1.3.0", "cover": "cover.svg",
  "illustration": "opening.svg",
  "illustrationAlt": "A small train waits under a purple evening sky.",
  "illustrationCaption": "Hollow Station",
  "chapters": [
    {
      "title": "The Last Ticket",
      "illustration": "ch1.svg",
      "illustrationAlt": "A blue-and-pink train at a lamp-lit station.",
      "illustrationCaption": "9:47 in the evening",
      "text": ["First paragraph.", "Second paragraph.", "Third paragraph."],
      "scenes": [
        { "after": 2, "illustration": "scene1.svg", "illustrationAlt": "A moth on a lantern." }
      ]
    }
  ]
}
```

- **`illustration`** (story level) is shown once, at the top of the first chapter, when that chapter has no picture of its own.
- **`illustration`** (chapter level) is shown under the chapter title.
- **`scenes`** place a picture *between* paragraphs of a long chapter: `after: 2` means after the second paragraph. At most three per chapter. Use them sparingly: a picture every few pages, never after every paragraph.
- Pictures are plain file names next to `story.json`, in `.svg`, `.webp` or `.png`. Prefer SVG (a few kilobytes) or WebP. Keep each file under about 40 KB; the tests fail on anything larger than that for the bundled stories.
- **`illustrationAlt`** is read by screen readers. Describe what the picture shows in a sentence.
- **`illustrationCaption`** is a short line under the picture.
- A malformed picture field (a path with `..`, a wrong file type, a missing file) is ignored. The story still opens and reads; it simply shows no picture there. A *content pack* that points at a picture it does not contain is refused when you install it, so mistakes are caught before a reader ever sees them.
- Pictures load only when their page is opened, never all at startup.

### Style
Soft, rounded and calm: pastel fills, one warm-grey outline (`#6e6a8e`, about 3 px), no sharp or scary shapes, original characters only. `scripts/stories/artlib.mjs` has the small building pieces used for the bundled pictures (clouds, hills, trees, houses, lanterns, an owl, a whale, a train...) if you would like to compose scenes in code; `scripts/stories/art_new.mjs` shows how.

## Writing for calm reading

These habits make a story pleasant to read, and keep it ready for narration if that returns:

- Keep paragraphs to about 40 to 110 words.
- Write sentences you could say in one breath. Short sentences read more calmly.
- Use plain punctuation. Do not use markdown (`*stars*`) or emoji.
- Spell out abbreviations ("for example", not "e.g.").
- Read it aloud yourself once. If you stumble, a reader will too.

## Favorites, progress and the Reading List

Nothing to author: the app saves the chapter and paragraph where each reader stopped, when it was last opened, favorites and found endings in `progress/stories.json`. A story shows under **Continue** once the reader is past its first chapter or paragraph, under **Finished** when they reach the end, and under **Not started** otherwise. Adventures are **Continue** while a run is in progress and **Finished** once any ending has been found.
