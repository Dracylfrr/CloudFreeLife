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
| `minigame` | `pastel_breaker`, `splash_wall` or `memory_meadow`. |
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

## Adding the level to the app

- **Bundled:** put the folder under `content/minigames/<game>/levels/` and run `npm run dev` / `npm test`.
- **Downloadable:** put it in a content pack ([PUBLISHING_CONTENT.md](PUBLISHING_CONTENT.md)); it appears in the right game's level list after installation.
