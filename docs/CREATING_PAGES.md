# Creating a coloring page

Each page is its own folder inside a book's `pages/` folder:

```
pages/01_gate_house/
  page_manifest.json   description + file names
  lineart.svg          the line art with colorable regions
  thumbnail.svg        the same art, pre-colored, for the page card
  regions.json         the list of regions (ids, names, suggested colors)
```

Templates: [page_manifest.json](templates/page_manifest.json) · [lineart.svg](templates/lineart.svg) · [thumbnail.svg](templates/thumbnail.svg) · [regions.json](templates/regions.json)

## How region painting works

The app renders only the shapes marked `data-region="…"` in flat unique colors and uses that picture as a map of *which region is under the pointer*. That gives instant, leak-free **fill**, **Stay Inside Lines**, **Clear Region**, and means a region is never locked — filling again simply replaces the color.

The visible line art is `lineart.svg` drawn on top of the player's paint with a *multiply* blend, so white fills disappear and only lines remain.

## `lineart.svg` rules

- **Size:** `viewBox="0 0 1000 750"` (4:3). Other ratios are scaled to fit the canvas.
- **Paper:** a first `<rect fill="#fff">` with no `data-region`.
- **Colorable regions:** shapes (`path`, `circle`, `ellipse`, `rect`, `polygon`) with
  - `data-region="<id>"` — must match an id in `regions.json`,
  - `fill="#ffffff"` and an outline `stroke` (width 4–6 in a soft color such as `#6e6a8e`).
- **Order matters.** Shapes are painted in file order; a later shape sits in front of an earlier one. A region is the *visible* part of its shape, so a cloud drawn after the sky owns its pixels, and the sky owns the rest.
- **Decoration and detail lines** (smiles, stems, hatching, eyes) have **no** `data-region`. Use `fill="none"` for lines. They stay visible over any color but are not themselves colorable.
- **Avoid:** tiny regions (under ~25 × 25 units), gradients, filters, `<image>`, scripts, external links, `<style>` classes on regions. Keep strokes ≥ 3 units so fills never show a gap.
- Use `transform="…"` on a region element if you like — it is honored by the region map.
- Keep it **cute, clean and easy to color**: big shapes, rounded corners, not too many regions (10–25 is comfortable).

## `regions.json`

```json
{
  "viewBox": [1000, 750],
  "regions": [
    { "id": "sky", "name": "Sky", "suggested": "#dff0fb" }
  ]
}
```

The list must contain **every** `data-region` id used in the SVG, in the same order. `suggested` is optional and only documents the intended colors.

## `thumbnail.svg`

Copy `lineart.svg` and replace each region's `fill="#ffffff"` with a pastel color. It appears on the book's page card and as the Gallery fallback.

## `page_manifest.json`

| Field | Meaning |
|---|---|
| `id` | Short id for the page (lowercase, digits, `_`). Unique within the book. |
| `name`, `description` | Shown on the page card. |
| `version`, `minAppVersion` | As for books. |
| `thumbnail`, `lineArt`, `regions` | File names inside the page folder. |
| `difficulty` | Optional: `easy`, `relaxed` or `detailed`. |

## Tips for authoring

- Draw in any vector editor (Inkscape, Figma, Affinity…), export plain SVG, then add `data-region` attributes by hand.
- The bundled pages are generated from small scripts in `scripts/art/` (see `dsl.mjs`) — a handy way to build clean, consistent shapes (clouds, stars, hills, flowers, balloons) if you prefer code. `node scripts/preview-art.mjs out.png cloud color` renders a contact sheet.
- Test every region: open the page, pick *Fill Bucket*, click each shape; try *Stay inside lines* with the brush; try *Clear Region*.
- Use only **original** artwork.
