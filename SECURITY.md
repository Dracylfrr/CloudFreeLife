# Security

## Reporting a vulnerability
Please **do not** open a public issue for security problems. Use GitHub's *Report a vulnerability* (Security tab → Advisories) on this repository, or contact the maintainers privately. We aim to reply within a few days.

## How updates are kept safe
- Update data is fetched only over **HTTPS** from GitHub hosts on an allow-list. No access token is embedded in the app.
- A release carries `cloud-freelife-release.json`. Before anything is downloaded or used the app validates: schema, versions, asset **name** (must match `<id>_v<version>.cfpack` or `Cloud-Freelife_<version>_x64-setup.exe` and the declared id/version), **content type**, size, **SHA-256**, and `minAppVersion`. Download URLs must point at this repository's own release assets.
- The app **never executes** a downloaded file. App installers are saved to `Downloads\Cloud-Freelife`, verified, and left for you to open yourself.
- Content packs (`.cfpack`) are JSON. They contain only `.json`, `.svg` and `.png` files, limited to the content folders (`books/`, `palettes/`, `minigames/…/levels/`). Paths with `..`, absolute paths and unknown extensions are rejected; SVG files with scripts, `foreignObject`, event handlers or external references are rejected; every manifest inside is validated with the same code as bundled content; nothing is written to disk until the whole pack passes.
- Installed SVG art is only ever displayed as an image (scripts in images never run).

## App hardening
- Tauri's capability file grants only the file, dialog, opener and HTTP permissions the app needs, each scoped (`src-tauri/capabilities/default.json`).
- A strict Content-Security-Policy (`script-src 'self'`) is set in `src-tauri/tauri.conf.json`.
- No remote code, no `eval`, no auto-update binaries.

## Known limitation
Release assets are verified against the manifest published in the **same** GitHub Release. If an attacker could change both the installer and the manifest (i.e. compromise the repository's release permissions), the check cannot detect it. Keep release permissions tight, enable two-factor authentication, and prefer signed releases (see the roadmap).
