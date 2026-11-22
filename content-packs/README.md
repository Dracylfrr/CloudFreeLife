# Content pack sources

Put the source of each downloadable pack here, one folder per pack id:

```
content-packs/castle_dreams/
  pack.json        { "name": "Castle Dreams", "description": "...", "kind": "book", "minAppVersion": "1.0.0" }
  content/         same layout as the app's content/ folder
    books/castle_dreams/book_manifest.json
    books/castle_dreams/cover.svg
    books/castle_dreams/pages/01_gate_house/...
```

Push a tag `castle_dreams_v1.0.0` and `.github/workflows/content-release.yml` builds `castle_dreams_v1.0.0.cfpack`, the
release manifest (with its SHA-256) and publishes both as a GitHub Release. See
[docs/PUBLISHING_CONTENT.md](../docs/PUBLISHING_CONTENT.md). Starter files are in [docs/templates](../docs/templates).
