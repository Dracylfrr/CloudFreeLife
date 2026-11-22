# Audio

Cloud-Freelife ships **no audio files**. Every sound is synthesised at runtime with the Web Audio API in
[`src/core/audio.ts`](../../src/core/audio.ts): soft sine/triangle tones, filtered brown noise, slow attacks and a
compressor on the master bus, so nothing is ever sharp or loud.

| Sound | How it is made |
|---|---|
| UI click, bubble pop | very short sine sweeps |
| Splash, page turn, fill | band-passed noise bursts |
| Soft brush | looping filtered noise whose level follows stroke speed |
| Calm music | sparse pentatonic bell tones |
| Ambience | slowly modulated low-passed noise |

Volumes (Master / Music / Ambience / Effects / Painting) and Mute live in *Settings → Audio*. Audio only starts after the
first click or key press (browser/webview autoplay rules) and suspends while the window is hidden or minimised.
