# Themes, moods and music

Everything here lives in three small data files, so adding to it never means touching a screen.

| File | What it holds |
|---|---|
| `src/core/themes.ts` | the color themes |
| `src/core/moods.ts` | the mood presets (Relaxed, Chill, Cozy, Dreamy) |
| `src/core/music.ts` | the background music tracks |

Your paintings are never affected by any of this. Artwork is drawn on its own paper, not with the app's colors.

## Themes

A theme is a set of CSS custom properties (colors, soft shadows, the drifting clouds and bubbles). Components only ever use these tokens, so a new theme needs no component changes. Cloud Morning is the default and looks exactly as it did before 1.3.

To add a theme, copy this template into the `THEMES` list in `src/core/themes.ts` (and add its id to the `ThemeId` type at the top):

```ts
make({
  id: 'rose_garden',                 // lowercase letters and underscores
  name: 'Rose Garden',
  blurb: 'Soft roses and cream.',
  // dark: true,                     // set for evening themes: switches native controls to dark
  bg: ['#fde8ee', '#f8e6f4', '#fff0e4'],          // page background gradient (3 stops)
  amb: ['#fcd9e4', '#f3dcf3', '#ffe4d2', '#f6e1ee'], // soft glows behind the scenery
  panelSolid: '#fffafc',             // card surface
  panel: 'rgba(255, 255, 255, 0.74)',
  ink: '#523a48',                    // main text
  inkSoft: '#765c6a',                // secondary text
  inkFaint: '#baa3b0',
  accent: '#e58aa8',                 // main accent (selected states, links)
  accentSoft: '#f7d3df',
  sky: '#f5cfe0',
  skyDeep: '#e9a2bd',
  g: ['#f8bfd2', '#d9b8f0'],         // the two colors of the main button gradient
  gInk: '#4a2d3c',                   // text on those buttons
  nav: ['#fbdce6', '#eadcf8', '#8a3f66'], // active menu item: gradient a, b and text
  brand: ['#e57ba0', '#a98be0'],     // the logo wordmark gradient
  hero: ['#dc6f98', '#b87fd8', '#f1a06f'],
  focus: '#c0527d',                  // keyboard focus ring
  w: '255 255 255',                  // "glass" color as r g b (a dark theme uses a lighter tone of its surface)
  shadow: '190, 110, 140',           // shadow color as r, g, b
  cloud: '#fffafc',
  bubbles: ['#f7cfe0', '#e8d6f5', '#ffe0cf', '#fbd5e6', '#fff0c8'],
  track: '#f2dde6'                   // slider and toggle tracks
})
```

### Readability is checked automatically
`npm test` checks every theme: body text at least 7:1 against the card color, secondary text at least 4.5:1, text on buttons and on the active menu item at least 4.5:1, Moonlight dark but not black, and that Higher Contrast pushes text further from the surface in every theme. A theme that fails these will fail the build.

### Higher Contrast and Reduced Motion
Higher Contrast is applied on top of whichever theme is chosen (see `highContrastVars`). Reduced Motion removes drifting clouds and bubbles in every theme.

## Moods

A mood is one tap that changes how the app *feels* without changing how it looks. In `src/core/moods.ts`:

```ts
cozy: { id: 'cozy', label: 'Cozy', hint: 'Warm, rounded sounds and a quiet garden melody.',
        music: 'garden',   // which track plays (or null to use the one chosen in Audio settings)
        softness: 0.85,    // sound effects volume multiplier
        warmth: 0.75,      // lower = rounder sounds
        reverb: 1,         // how much room echo
        ambientSpeed: 0.8  // drifting clouds and bubbles
}
```

## Music

Music is composed on the computer from data, so it needs no audio files and adds nothing to the download. A track is a slow chord progression, a soft pad that glides between the chords and a few bell notes. In `src/core/music.ts`:

```ts
garden: {
  id: 'garden', label: 'Quiet Garden', blurb: 'Warm and rounded, like sun on leaves.',
  root: 146.83,                       // key (Hz): D3
  chords: [[0, 4, 7, 11], [-5, -1, 2, 6], [-3, 0, 4, 7], [2, 5, 9, 12]], // semitones from the root
  chordSeconds: 13,                   // how long each chord lasts
  scale: [12, 14, 16, 19, 21, 24],    // notes the bells may play
  bells: 2.6,                         // bells per chord, on average
  padCutoff: 760,                     // softness of the pad (Hz): keep it at or below 1000
  pad: 0.052, bell: 0.05, wet: 0.5,   // levels (keep pad and bell at or below 0.06)
  // rain: true                       // adds a soft rain layer
}
```

Add the track id to `MUSIC_MOODS` in `src/core/settings.ts`. The tests check that every track stays gentle: slow chords, no pitch above about 1.7 kHz, and low levels.

## Sound effects

Sound effects are in `src/core/audio.ts`. Each one is a few soft tones with a gentle attack and a long decay through a shared room reverb. Repeated sounds (bubbles, bricks) walk up and down a pentatonic scale, so a long run sounds like a little melody. The tests play every effect against a fake audio engine and check that none is loud, shrill (nothing above 2.6 kHz) or starts with a click.

## App icon (1.4)

Settings, Display, *App icon* offers five little cloud icons. They are defined in `src/core/appIcon.ts` as a short list of colors (three background stops, the cloud, the paint mark and the sparkles), and one function draws the same cloud with those colors, so adding a sixth icon is one more line in `APP_ICONS`.

The choice is saved as `appIcon` in `settings.json`. It changes the corner logo straight away and, in the desktop app, the icon of the window and the taskbar (the app draws the icon to a small PNG and hands it to Windows). The installed shortcut and the `.exe` file keep the original icon because Windows reads those from the file. An unknown value falls back to *Morning Cloud*.
