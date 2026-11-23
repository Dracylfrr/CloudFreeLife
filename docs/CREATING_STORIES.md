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

Use `--kind stories` or `--kind adventures` (it only changes the wording of the notification). A pack may contain files under `stories/relaxing/<id>/` and `stories/adventures/<id>/`. See [PUBLISHING_CONTENT.md](PUBLISHING_CONTENT.md).

## Progress

The app saves where each reader stopped, and which endings they have found, in `progress/stories.json` inside the data folder. Deleting that file only resets progress.
