# Spoken stories (voices)

Stories and adventures can be read aloud. The voices run **on the person's own computer**: nothing is sent anywhere, and once the voice files are downloaded the stories can be read aloud with no internet.

## How it works for a reader

- On a story or adventure, **Listen** reads the current chapter (or passage) aloud, a line at a time, and highlights the paragraph being read. Adventures read the choices after the passage. **Pause**, **Keep listening** and **Stop** are beside it.
- The first time, **Listen** opens **Voices**, which offers a download of the voice files (about 93 MB). Downloading is a choice; the installer does not contain them. Settings > Voices can also download or remove them.
- **Voices** (on every story) lists the narrator and each speaking character. Each has its own voice and its own speed (0.6× to 1.4×), with a **Hear** button. Choices are saved automatically for that character of that story. "Back to the suggested voices" undoes them.
- Settings > Voices sets the narrator for every story. A story's own narrator choice wins over it.

## Fast voices and standard voices

There are two speech models and a computer needs only one:

| | Runs on | Download | Speed (measured on a 16-core Intel laptop) |
| --- | --- | --- | --- |
| **Fast voices** (full precision) | the graphics chip | about 315 MB | about 4 to 5 times faster than the speech is spoken, clean sound |
| **Standard voices** (8-bit) | the processor | about 93 MB | about 1.2 to 2.5 times slower than the speech is spoken |

Fast voices need WebGPU (a recent Windows with a graphics chip and driver that support Direct3D 12). Many older computers do not have it, and then the standard voices are used. A half-precision model was tried too: it is fast, but one line in eleven came out as noise, so it is not used. If the graphics chip fails at any point the app falls back to the standard voices. The first sentence on the graphics chip takes a few seconds while the chip prepares, so pointing at Listen starts that early.

## How fast it is on the processor (an honest note)

The speech is made on the person's own computer, by a model of 82 million numbers, and that takes about as long as the speech lasts. On the 16-core laptop it was built on, a sentence takes roughly 1 to 2.5 times as long to make as to say, and neither more threads nor more engines made it faster (the limit is the processor's vector units, not the number of cores). So the app starts after a short wait, reads ahead as far as it can, and when the next line is not ready it says **Catching up…** and carries on as soon as it is. A faster processor reads more smoothly. The app runs two engines side by side on computers with four or more cores.

Ways to make it smoother later: remembering lines that have already been made, so a second listen is instant; making a chapter ahead of time; or using the graphics chip, which needs a larger voice download (about 326 MB).

## The nine voices

| Voice | Accent | Meant to sound | Suits |
| --- | --- | --- | --- |
| Nicole (`af_nicole`) | American | soft and hushed | the narrator, gentle girls |
| Bella (`af_bella`) | American | warm and expressive | warm and jolly women |
| Sarah (`af_sarah`) | American | clear and friendly | bright, lively girls |
| Emma (`bf_emma`) | British | bright and bookish | proper women, owls and librarians |
| Isabella (`bf_isabella`) | British | gentle and kind | wise, kindly women |
| Michael (`am_michael`) | American | warm and steady | warm, friendly men |
| Onyx (`am_onyx`) | American | deep and calm | wise elders, big gentle creatures |
| Santa (`am_santa`) | American | low and jolly | jolly, cheery men and bears |
| Lewis (`bm_lewis`) | British | polite and proper | gentlemen, foxes and tortoises |

The descriptions are intentions taken from the voices' published character; judge them by ear and change any you like.

## Giving a story a cast

A story or adventure may carry a `cast` in its `story.json` / `adventure.json`:

```json
"cast": [
  { "id": "tilly", "name": "Tilly", "gender": "f", "trait": "gentle" },
  { "id": "bear", "name": "the bear", "gender": "m", "trait": "jolly", "aka": ["Bear"] }
]
```

- `id`: lowercase letters, digits and underscores (not `narrator`). `name`: how the story names them. A name that starts with a small letter ("the bear") matches whatever its capitals; a proper name matches exactly. `aka`: other words the story uses for them.
- `gender` (`f` or `m`) picks female or male voices. `trait` (`gentle`, `warm`, `wise`, `jolly`, `proper`, `bright`) picks the voice that suits them. No two characters in a story get the same voice. An optional `voice` fixes one.
- Quoted words are given to the character named beside them ("said Tilly", "Tilly asked", "the bear said"); "he said" / "she said" go to the man or woman of that gender who spoke last. Anything that cannot be placed is read by the narrator, so a missing or wrong cast can never make a story unreadable.
- A story without a cast is read entirely by the narrator.

The bundled stories' casts are in `scripts/stories/casts.mjs`. Premium packs carry their own casts inside their story files.

## Publishing the voice files

The files are open-source copies of **Kokoro-82M** (ONNX, 8-bit), published as a release of this project so the app only ever downloads from one place.

1. `scripts/voices-manifest.json` pins the source address, size and SHA-256 of every file.
2. Push the tag `kokoro_voices_v1.0.0`. The **Voices release** workflow downloads the files from their source, checks each one against the manifest, and publishes them as the release.
3. The app downloads them from that release and checks the same SHA-256 values (written in `src/features/voices/model.ts`) before it keeps or uses any file. A test keeps the two lists in step.

## Notices

- **Kokoro-82M**, the speech model and voices: Apache-2.0. https://huggingface.co/hexgrad/Kokoro-82M, ONNX version https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
- **kokoro-js** (the method of turning text into speech that this follows): Apache-2.0.
- **ONNX Runtime Web**, which runs the model: MIT.
- **phonemizer**, the package that turns words into sounds: marked Apache-2.0, but it contains **eSpeak NG**, which is **GPL-3.0**. eSpeak NG is built into the app's voice engine files. Anyone who shares the app should keep these notices with it, and should look into what the GPL means for how the app itself is licensed before selling it.
- The app's own code is MIT.
