# Privacy

Cloud-Freelife collects **nothing**.

| Collected? | |
|---|---|
| Telemetry / usage statistics | No |
| Analytics | No |
| Crash reports | No |
| Personal data | No |
| Accounts / sign-in | No |
| Advertising identifiers | No |

## Where your data lives
Artwork, settings and downloaded content are stored **only on your computer**, in `%APPDATA%\Cloud-Freelife`:

```
%APPDATA%\Cloud-Freelife\
  settings.json
  progress\stories.json  (your reading place and the story endings you have found)
  artworks\<name>\artwork.json, paint.png, thumb.png
  content\...            (downloaded books, palettes, levels, stories)
  installed_packs.json
```

This is outside the install folder, so updating, repairing or uninstalling the app does not delete it. Exported PNGs go where you choose in the save dialog.

## When the app uses the network
Only for these things, always over HTTPS to GitHub:

1. **Checking for updates** — one request to this project's GitHub Releases when the app starts (can be turned off in *Settings → Updates*), and whenever you press *Check for Updates*.
2. **Downloading content or an installer you ask for** — from this project's GitHub release assets.
3. **Opening a GitHub link** you click (it opens in your browser).

These requests contain no identifiers beyond what any web request carries (your IP address and the standard HTTP headers). Cloud-Freelife does not add cookies, tokens, user IDs or device information. GitHub's own privacy policy applies to their servers.

Without Internet access everything else works normally: painting, the Gallery, mini-games, exports and settings.

## Permissions
The desktop shell is limited to: reading/writing inside `%APPDATA%\Cloud-Freelife` (plus `Downloads\Cloud-Freelife` for update installers and any file you choose in a save dialog), opening GitHub links, and HTTPS requests to GitHub hosts. See `src-tauri/capabilities/default.json`.
