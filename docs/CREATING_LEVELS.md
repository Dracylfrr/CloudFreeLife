# Creating mini-game levels

Levels are folders with a `level.json`. Folder names are human-readable and ordered with a number prefix (`07_moon_garden`).

```
content/minigames/pastel_breaker/levels/07_moon_garden/
  level.json
  thumbnail.svg

content/minigames/splash_wall/levels/11_garden_gate/
  level.json
  wall.svg
  thumbnail.svg
```

Every level defines the same base fields:

| Field | Meaning |
|---|---|
| `id` | Lowercase id (letters, digits, `_`), unique within the game. |
| `name`, `description`, `objective` | Shown in the level picker. |
| `minigame` | `pastel_breaker`, `splash_wall`, `memory_meadow`, `pastel_puzzle`, `bubble_garden`, `cloud_catcher`, `zen_garden` or `paint_flow`. |
| `thumbnail` | File name of the preview image (SVG or PNG, 4:3). |
| `version`, `minAppVersion` | As for books. |

All levels are open from the start — there is no locking system.

## Pastel Breaker

Template: [templates/breaker_level.json](templates/breaker_level.json)

```json
{
  "grid": ["..bbbbbbbb..", ".bllllllllb.", "bllppppppllb"],
  "legend": { "b": "#bfe4f7", "l": "#d9cdf6", "p": "#ffd3e2" },
  "tough": ["l"]
}
```

- `grid`: 1–16 rows, all the **same width** (3–20 columns; 12 is the standard). `.` or a space is empty; any other character is a block.
- `legend`: maps each character to a `#rrggbb` color. Every character used in the grid must be listed.
- `tough` (optional): characters whose blocks take **two hits**.
- Use soft pastel colors; design shapes you can recognise (a rainbow, a castle, stars).
- Check that it can be cleared: `npm test` auto-plays every bundled level.

The three modes (**Relax** — no lives, slower, ball returns automatically; **Classic** — three lives; **Endless** — generated rounds that speed up slightly) work with every handcrafted level.

## Splash Wall

Template: [templates/splash_level.json](templates/splash_level.json)

`wall.svg` follows exactly the same rules as a coloring page's `lineart.svg` ([CREATING_PAGES.md](CREATING_PAGES.md)): `viewBox="0 0 1000 750"`, colorable shapes with `data-region` / `data-name`, decoration without. There is no `regions.json` — the regions are read from the SVG. Paint from a balloon spreads **inside the region it hits**.

`goal` is one of:

| Goal | Meaning |
|---|---|
| `{ "type": "free" }` | No goal. Just splash. |
| `{ "type": "coverage", "target": 0.7 }` | Color 70 % of all region area. |
| `{ "type": "regions", "regions": ["car_body", "wheel_back"] }` | Paint at least half of each listed region (any color). |
| `{ "type": "color_match", "targets": { "ring_1": "#f6b8cf" } }` | Fill at least half of each region with its target color. A dotted hint tint is drawn on those regions. |

`colors` (optional) is the list of balloon colors for the level (up to 12). Target colors for `color_match` are added automatically.

Every region id named in a goal must exist in `wall.svg` (tests enforce this for bundled levels).

## Memory Meadow

```json
{
  "id": "moon_garden_pairs",
  "name": "Moon Garden Pairs",
  "description": "...", "objective": "...",
  "minigame": "memory_meadow", "thumbnail": "thumbnail.svg",
  "version": "1.0.0", "minAppVersion": "1.1.0",
  "columns": 4,
  "cardBack": "#c6ecda",
  "symbols": ["cloud", "star", "moon", "flower"]
}
```

- `symbols`: 2-12 **different** pictures. Allowed: `cloud star moon sun heart drop flower leaf balloon shell rainbow mushroom fish butterfly planet`. Each becomes a pair (so 4 symbols = 8 cards).
- `columns`: 2-6. The card count (symbols x 2) must fill complete rows, e.g. 8 cards with 4 columns.
- `cardBack` (optional): `#rrggbb` for the back of the cards.
- No timer and no lives; the Hint button is always available. A level needs `minAppVersion` of at least `1.1.0`.
- Adding a *new picture* needs an app release (pictures are drawn in `src/features/minigames/memory/icons.ts`).

## Pastel Puzzle

```json
{
  "id": "rainbow_hills",
  "name": "Rainbow Hills", "description": "...", "objective": "...",
  "minigame": "pastel_puzzle", "thumbnail": "picture.svg",
  "version": "1.0.0", "minAppVersion": "1.1.1",
  "picture": "picture.svg",
  "columns": 3,
  "rows": 3
}
```

- `picture`: an SVG or PNG in the level folder. 4:3 pictures (for example 1000 x 750) fit the board best. It is cut into `columns` x `rows` equal pieces, so use a finished, colored picture (a page's `thumbnail.svg` makes a nice one).
- `columns` and `rows`: whole numbers from 2 to 8. 6 to 24 pieces feels calm; more is a challenge.
- The thumbnail can simply be the picture file itself.
- Pieces are never locked, there is no timer, and *Peek* shows the finished picture.

## Bubble Garden

Levels live in `content/minigames/bubble_garden/levels/<folder>/level.json`.

```json
{
  "minigame": "bubble_garden",
  "palette": ["#bfe4f7", "#ffd3e2", "#c6ecda", "#fff2bd", "#e6d8f8"],
  "sky": ["#d6ecfb", "#f2f9ff"],
  "scenery": "morning",
  "spawn": 0.8,
  "speed": 26,
  "size": [26, 50],
  "rounds": 3
}
```

- `palette`: 3 to 8 bubble colors (`#rrggbb`). Fewer colors make matching easier.
- `sky`: two colors for the backdrop gradient (top, bottom). `scenery` adds a soft picture: `morning`, `garden`, `ocean`, `evening`, `night` or `sunset`.
- `spawn`: new bubbles per second (0.2 to 3). `speed`: upward drift in pixels per second (8 to 90). `size`: smallest and largest radius (14 to 120).
- `rounds`: in *Color Match* mode, how many "pop or merge N of this color" requests make a gentle finish (1 to 10).
- The three modes are *Relax* (no goal), *Color Match* (a few friendly requests) and *Endless*. The game keeps at most 36 bubbles on screen however you set `spawn`.

## Cloud Catcher

Levels live in `content/minigames/cloud_catcher/levels/<folder>/level.json`.

```json
{
  "minigame": "cloud_catcher",
  "kinds": ["cloud", "drop"],
  "colors": ["#bfe4f7", "#ffd3e2", "#fff2bd"],
  "zones": [
    { "id": "zone_1", "label": "Sky blue", "color": "#bfe4f7" },
    { "id": "zone_2", "label": "Rose", "color": "#ffd3e2" }
  ],
  "spawn": 0.7,
  "speed": 28,
  "sky": ["#d6ecfb", "#f2f9ff"],
  "scenery": "morning",
  "pattern": ["cloud", "drop", "cloud"]
}
```

- `kinds`: any of `cloud`, `star`, `moon`, `drop`, `petal` that may drift by.
- `colors`: 2 to 6 colors the drifting things can have.
- `zones`: 1 to 4 catching zones with unique ids. A zone has a color, a short label and, optionally, a `kind` (it then accepts only that shape, which is how *Pattern* mode works).
- `pattern`: the order of shapes wanted in *Pattern* mode (2 to 6, repeated). If you leave it out the first kinds are used.
- `spawn`, `speed`, `sky`, `scenery` work as in Bubble Garden. Modes: *Relax*, *Color Match* (match a zone's color), *Pattern* and *Endless*. Nothing can be dropped in a "wrong" place in a way that costs anything; it simply floats back.

## Zen Garden

A Zen Garden "level" is a **background** the person rakes on. Files live in `content/minigames/zen_garden/levels/<folder>/level.json`.

```json
{
  "minigame": "zen_garden",
  "ground": ["#f4e4c0", "#e9d3a4"],
  "groove": "#cdb07c",
  "light": "#fff6df",
  "scenery": "sand"
}
```

- `ground`: two colors, top and bottom of the sand. `groove`: the color of raked lines. `light`: the soft highlight on the lines.
- `scenery`: `sand`, `lavender`, `moon`, `garden` or `sea` (the little surroundings drawn at the edges).
- The five bundled backgrounds are warm sand, lavender sand, moonlight, garden and seaside.
- A person's own gardens are **not** content: each is one small file in `gardens\<id>.json` in their data folder, saved automatically, with caps on strokes, points and objects so a garden can never grow without limit.

## Paint Flow

Boards live in `content/minigames/paint_flow/levels/<folder>/level.json`. Join each pair of dots with a path of the same color; paths cannot cross or share a square.

```json
{
  "minigame": "paint_flow",
  "size": 4,
  "pairs": [
    { "color": "#f49bbd", "a": [0, 3], "b": [2, 3] },
    { "color": "#7fb8f0", "a": [3, 3], "b": [1, 2] },
    { "color": "#7fd2a8", "a": [0, 2], "b": [2, 0] }
  ],
  "solution": [
    [[0, 3], [1, 3], [2, 3]],
    [[3, 3], [3, 2], [2, 2], [1, 2]],
    [[0, 2], [0, 1], [0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 0], [2, 0]]
  ]
}
```

- `size`: 3 to 9 squares per side. `pairs`: 2 to 9 pairs. Cells are `[column, row]` counted from 0, and no two dots may share a cell.
- `solution` is optional: one path per pair, in the same order, each running from `a` to `b` one square at a time. It powers **Hint**. If a solution is wrong the board still loads, it just has no Hint. A good board has a solution that fills **every** square, which makes it feel complete.
- A board is only worth shipping if it can be solved; the bundled ones are generated with a solver and checked in `npm test`.
- Modes: *Puzzle* (the boards in your levels), *Relax* (a fresh random board every time) and *Free Flow* (draw colorful lines wherever you like, with no goal).

## Adding the level to the app

- **Bundled:** put the folder under `content/minigames/<game>/levels/` and run `npm run dev` / `npm test`.
- **Downloadable:** put it in a content pack ([PUBLISHING_CONTENT.md](PUBLISHING_CONTENT.md)); it appears in the right game's level list after installation.
