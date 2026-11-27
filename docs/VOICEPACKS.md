# Recorded stories (voice packs)

Spoken stories can be made two ways. **Recorded stories** are made once, on the author's computer, and downloaded by
listeners: they start at once, use almost no power and work offline. The older way, voices made on the listener's own
computer, stays as a fallback for stories that have no recording yet.

## What a listener sees

- **Settings > Voices** lists the nine voices. Each has a **Hear** button that plays a short sample which comes with the app
  (no download), **Use this voice** and **Download all**.
- A story's **Voices** window shows the recording of that story in the narrator's voice, with **Download** (one story, 1 to 3 MB).
- **Listen** plays a downloaded recording when there is one and the character voices have not been changed; otherwise it
  makes the voices on the computer as before.

## Making recordings

Needs the voice files that the app keeps in its data folder (open the app once and download the fast voices). The speech is
made on the graphics chip, about 3 to 4 times faster than it lasts (an Intel Xe laptop chip; an NVIDIA chip is faster).

```powershell
npm run dev                                          # in one window
node scripts/voices/pack-server.mjs voicepacks-out   # in another: hands out the voice files, receives the finished files
```

Open these in a browser tab (the tab must stay open while it works):

| Page | Does |
|---|---|
| `http://localhost:1420/scripts/voices/render.html?all=1&voice=bf_emma&resume=1` | every free story and adventure, one voice; `resume=1` skips finished ones |
| `http://localhost:1420/scripts/voices/render.html?path=stories/relaxing/<story>&voice=bf_emma` | one story |
| `http://localhost:1420/scripts/voices/render.html?samples=1` | the nine samples (copy them to `public/voices/samples`) |

Files appear in `voicepacks-out` as `<voice word>.<story>.dvp`. The voice word is the `pack` field in
`src/features/voices/casts.ts` (elodie, wren, ...). It never changes even if the display name does. Then:

```powershell
node scripts/voices/make-manifest.mjs voicepacks-out elodie   # writes voicepacks-out/voicepacks.json
```

## Publishing a voice

On the project's GitHub page create (or edit) a release with the tag **`voices_<voice word>`**, for example `voices_elodie`, and
attach every `elodie.*.dvp` file plus `voicepacks.json`. The app only downloads from that exact tag, checks each file's size and
checksum against `voicepacks.json`, and throws away anything that does not match. To add a new story later, render it, attach
its file and replace `voicepacks.json`. Releases are not counted against the repository's size, and each file is well under the
2 GB limit.

## Format (`.dvp`)

`DVP1`, a 4-byte header length, a JSON header (`story`, `voice`, and per part `o`/`n` offset and length, `s` seconds and `l`
lines `[paragraph, start, end]`), then the audio of every part: Ogg Opus, 24 kHz mono, 24 kbps. Parts are `c1`, `c2`... for a
story's chapters and the node ids for an adventure's passages. In an adventure the choices are read after the passage and have
paragraph numbers after the last paragraph of the passage, so they are highlighted too.

## Every new story needs recordings

When a story or adventure is added, render it in every voice that has a release and attach the files, as above. Premium
stories are not recorded here: their recordings must go through the encrypted pack route.
