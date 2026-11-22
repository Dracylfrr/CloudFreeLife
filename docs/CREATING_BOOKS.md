# Creating a coloring book

A book is a folder with a manifest, a cover and a `pages/` folder. Nothing is registered in code: if a valid book is in the right place, it appears on the *Coloring Books* shelf.

```
content/books/castle_dreams/
  book_manifest.json
  cover.svg
  pages/
    01_gate_house/
      page_manifest.json
      lineart.svg
      thumbnail.svg
      regions.json
    02_dragon_tower/
      ...
```

Folder and file names are always **lowercase letters, digits and underscores** and human-readable (`castle_dreams`, `01_gate_house`) — never generated IDs.

## `book_manifest.json`

Template: [templates/book_manifest.json](templates/book_manifest.json)

| Field | Meaning |
|---|---|
| `id` | Same as the folder name. Lowercase letters, digits, `_`. |
| `name` | Display name (max 60 characters). |
| `description` | One or two friendly sentences. |
| `cover` | File name of the cover image in the book folder (SVG or PNG, 4:3 works best, e.g. 400 × 300). |
| `version` | `MAJOR.MINOR.PATCH`. Bump it when you change the book. |
| `minAppVersion` | Oldest Cloud-Freelife that can use it. Newer-only content is hidden on older apps. |
| `kind` | `"coloring"` (default) or `"free_canvas"`. |
| `accent` | Optional `#rrggbb` used for the cover edge. |
| `pages` | Page **folder names**, in display order. Every entry must have a folder under `pages/`. |

A **free canvas** book has `"kind": "free_canvas"`, `"pages": []` and a `backgrounds` list (see `content/books/free_canvas/book_manifest.json`). Background `type` is `solid`, `gradient`, `stars` or `clouds`.

## Steps

1. Copy the templates into `content/books/<your_book>/`.
2. Make a cover (any SVG/PNG).
3. Add pages — see [CREATING_PAGES.md](CREATING_PAGES.md) — and list each folder in `pages`.
4. Run `npm run dev` and open *Coloring Books*. If a book or page is missing, invalid manifests are reported in the browser console (`catalog.skipped`) and `npm test` checks every bundled manifest.
5. To ship it to players **without a new app release**, build a content pack — see [PUBLISHING_CONTENT.md](PUBLISHING_CONTENT.md).

## Palettes

Palettes are single files: `content/palettes/<id>.json` ([template](templates/palette.json)). At least 4 colors; each has a friendly `name` and a `#rrggbb` `hex`. Keep them soft — no pure black, neon or aggressive red.
