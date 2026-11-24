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
  progress\stories.json  (your reading place, favorites and the story endings you have found)
  progress\meditation.json  (favorites, the last session, and how many times you finished each one)
  progress\movement.json  (favorites and the last Gentle Movement card you opened)
  progress\games.json  (Paint Flow boards you have connected, levels played and the last game)
  gardens\<name>.json  (your Zen Garden layouts)
  artworks\<name>\timelapse.json  (a list of your strokes, for the Timelapse button; no pictures)
  content\books\my_pages\...  (line art you imported)
  artworks\<name>\layers.json, layer-*.png  (the layers of a Free Draw painting)
  artworks\<name>\reference.jpg, reference.json  (a reference picture you chose, resized)
  albums.json  (your Gallery albums: names and which paintings are in them)
  artworks\<name>\artwork.json, paint.png, thumb.png
  content\...            (downloaded books, palettes, levels, stories)
  installed_packs.json
```

This is outside the install folder, so updating, repairing or uninstalling the app does not delete it. Exported PNGs go where you choose in the save dialog.

## When the app uses the network
Only for these two things, always over HTTPS:

1. **Checking for updates** — one request when the app starts (can be turned off in *Settings → Updates*), and whenever you press *Check for Updates*.
2. **Downloading content or an installer you ask for.**

Cloud-Freelife does not send personal content or analytics. When checking for or downloading updates, standard network requests are made to the infrastructure that hosts the official Cloud-Freelife releases, so that service can see the usual details of any web request (such as your IP address and the standard HTTP headers). Cloud-Freelife does not add cookies, tokens, user IDs or device information. The app never opens a web page.

**Meditation, Gentle Movement and the games** keep a few small files on your computer (listed above) so they can show your favorites and the last thing you did. They have no streaks, scores or health information, and they are never uploaded.

Without Internet access everything else works normally: painting, the Gallery, mini-games, exports and settings.

## Updating
When you press **Update now**, the new installer is downloaded from the official release host into `%APPDATA%\Cloud-Freelife\update`, checked against the published SHA-256, run quietly and removed the next time the app starts. Nothing is saved in Downloads or shown in File Explorer.

## Permissions
The desktop shell is limited to: reading/writing inside `%APPDATA%\Cloud-Freelife` (plus `Downloads\Cloud-Freelife` for update installers and any file you choose in a save dialog), and HTTPS requests to the official release host. It can set the window's own icon (for the *App icon* setting), run the app's own, checksum-verified update installer from its update folder (nothing else), and it cannot open web pages. See `src-tauri/capabilities/default.json`.
