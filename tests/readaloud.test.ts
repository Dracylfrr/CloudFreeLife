import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  ReadAloud,
  friendlyVoiceName,
  listLocalVoices,
  pickBestVoice,
  prepareSpeech,
  splitSentences,
  type SynthLike,
  type UtteranceLike,
  type VoiceLike
} from '../src/features/stories/readAloud';

class FakeUtterance implements UtteranceLike {
  voice: VoiceLike | null = null;
  rate = 1;
  pitch = 1;
  volume = 1;
  lang = '';
  onend: ((e: unknown) => void) | null = null;
  onerror: ((e: { error?: string }) => void) | null = null;
  constructor(public text: string) {}
}

class FakeSynth implements SynthLike {
  spoken: FakeUtterance[] = [];
  cancels = 0;
  current: FakeUtterance | null = null;
  listeners: (() => void)[] = [];
  constructor(public voices: VoiceLike[]) {}
  speak(u: UtteranceLike) {
    this.current = u as FakeUtterance;
    this.spoken.push(u as FakeUtterance);
  }
  cancel() {
    this.cancels++;
    // Real engines report the cancelled utterance as an error ("interrupted"/"canceled").
    const c = this.current;
    this.current = null;
    c?.onerror?.({ error: 'interrupted' });
  }
  getVoices() {
    return this.voices;
  }
  addEventListener(_: 'voiceschanged', fn: () => void) {
    this.listeners.push(fn);
  }
  removeEventListener(_: 'voiceschanged', fn: () => void) {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }
  /** Finish the sentence being spoken, as the engine would. */
  finish() {
    const c = this.current;
    this.current = null;
    c?.onend?.({});
  }
}

const voices: VoiceLike[] = [
  { voiceURI: 'local-aria', name: 'Microsoft Aria - English (United States)', lang: 'en-US', localService: true },
  { voiceURI: 'local-guy', name: 'Microsoft Guy - English (United States)', lang: 'en-US', localService: true },
  { voiceURI: 'online-jenny', name: 'Microsoft Jenny Online (Natural) - English (United States)', lang: 'en-US', localService: false },
  { voiceURI: 'local-hedda', name: 'Microsoft Hedda - German (Germany)', lang: 'de-DE', localService: true }
];

const make = (v = voices, extra = {}) => {
  const synth = new FakeSynth(v);
  const events: string[] = [];
  const ra = new ReadAloud({
    synth,
    Utterance: FakeUtterance,
    restartDelayMs: 0,
    paragraphPauseMs: 0,
    onParagraph: (i) => events.push(`p${i}`),
    onFinish: () => events.push('finish'),
    ...extra
  });
  return { synth, ra, events };
};
const tick = () => vi.advanceTimersByTimeAsync(5);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Read Aloud helpers', () => {
  it('splits paragraphs into sentences without losing text', () => {
    const text = 'Pebble was a small cloud. "Oh dear," said Pebble! Where did it go? Hm.';
    const parts = splitSentences(text);
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(text);
    expect(parts.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps very long sentences under the limit', () => {
    const long = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ') + '.';
    for (const p of splitSentences(long, 120)) expect(p.length).toBeLessThanOrEqual(125);
  });

  it('only offers local voices, in the reader language, with friendly names', () => {
    const list = listLocalVoices(voices);
    expect(list.map((v) => v.name)).toEqual(['Aria', 'Guy']);
    expect(list.find((v) => v.uri === 'online-jenny')).toBeUndefined();
    expect(friendlyVoiceName('Microsoft Jenny Online (Natural) - English (United States)')).toBe('Jenny');
  });

  it('falls back to any local voice when none match the language', () => {
    const list = listLocalVoices([voices[3], voices[2]]);
    expect(list.map((v) => v.uri)).toEqual(['local-hedda']);
  });
});

describe('natural-sounding narration', () => {
  it('does not pause after abbreviations such as Mr. and Mrs.', () => {
    const parts = splitSentences('Mr. Hazel wiped the teapots, and Mrs. Quill waved. Then they had tea together.');
    expect(parts.join(' ')).toBe('Mr. Hazel wiped the teapots, and Mrs. Quill waved. Then they had tea together.');
    expect(parts.some((p) => p === 'Mr.' || p === 'Mrs.')).toBe(false);
  });

  it('turns dashes into pauses and removes stray symbols before speaking', () => {
    expect(prepareSpeech('Wait — what? *Oh*, it is _fine_...')).toBe('Wait, what? Oh, it is fine…');
  });

  it('chooses the most natural local voice when the reader has not picked one', () => {
    const more: VoiceLike[] = [
      { voiceURI: 'a', name: 'Microsoft David - English (United States)', lang: 'en-US', localService: true },
      { voiceURI: 'b', name: 'Microsoft Zira - English (United States)', lang: 'en-US', localService: true },
      { voiceURI: 'c', name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', localService: false },
      { voiceURI: 'd', name: 'Microsoft Ryan (Natural) - English (United Kingdom)', lang: 'en-GB', localService: true }
    ];
    expect(pickBestVoice(more)?.voiceURI).toBe('d'); // a local neural voice wins; the online one is never used
    expect(pickBestVoice(more.slice(0, 2))?.voiceURI).toBe('b');
    expect(pickBestVoice([])).toBeNull();
  });

  it('speaks with the best voice by default and leaves a breath between paragraphs', async () => {
    const { synth, ra } = make(voices, { paragraphPauseMs: 450 });
    ra.setText(['First paragraph is here.', 'Second paragraph is here.']);
    ra.play();
    await tick();
    expect(synth.current?.voice?.voiceURI).toBe('local-aria');
    synth.finish();
    await tick();
    expect(synth.current).toBeNull(); // still in the pause
    await vi.advanceTimersByTimeAsync(460);
    expect(synth.current?.text).toBe('Second paragraph is here.');
  });
});

describe('Read Aloud controller', () => {
  it('plays paragraph by paragraph and reports each one', async () => {
    const { ra, synth, events } = make();
    ra.setText(['First one.', 'Second one.', 'Third one.']);
    ra.play();
    await tick();
    expect(get(ra.state).status).toBe('playing');
    expect(synth.current?.text).toBe('First one.');
    synth.finish();
    await tick();
    expect(synth.current?.text).toBe('Second one.');
    synth.finish();
    await tick();
    expect(events).toEqual(['p0', 'p1', 'p2']);
    expect(synth.current?.text).toBe('Third one.');
    synth.finish();
    expect(get(ra.state).status).toBe('idle');
    expect(events.at(-1)).toBe('finish');
  });

  it('pauses by stopping the engine and resumes from the same sentence', async () => {
    const { ra, synth } = make();
    ra.setText(['The first sentence is quite long enough. The second sentence is also long enough. The third one finishes it.']);
    ra.play();
    await tick();
    synth.finish(); // "One." done, "Two." next
    await tick();
    const during = synth.current?.text;
    expect(during).toBeTruthy();
    ra.pause();
    expect(get(ra.state).status).toBe('paused');
    expect(synth.current).toBeNull();
    const countBefore = synth.spoken.length;
    await tick();
    expect(synth.spoken.length).toBe(countBefore); // nothing speaks while paused
    ra.resume();
    await tick();
    expect(get(ra.state).status).toBe('playing');
    expect(synth.current?.text).toBe(during);
  });

  it('ignores the cancel error the engine reports for the old sentence', async () => {
    const { ra, synth } = make();
    ra.setText(['A fine paragraph of text here.']);
    ra.play();
    await tick();
    ra.pause();
    await tick();
    expect(get(ra.state).error).toBeNull();
    expect(get(ra.state).status).toBe('paused');
    expect(synth.cancels).toBeGreaterThan(0);
  });

  it('stop returns to idle and speaks nothing more', async () => {
    const { ra, synth } = make();
    ra.setText(['Alpha beta gamma.', 'Delta.']);
    ra.play();
    await tick();
    ra.stop();
    expect(get(ra.state).status).toBe('idle');
    await tick();
    expect(synth.current).toBeNull();
  });

  it('jumps to the next and previous paragraph while playing', async () => {
    const { ra, synth, events } = make();
    ra.setText(['Para one here.', 'Para two here.', 'Para three here.']);
    ra.play();
    await tick();
    ra.next();
    await tick();
    expect(synth.current?.text).toBe('Para two here.');
    ra.next();
    await tick();
    expect(synth.current?.text).toBe('Para three here.');
    ra.next(); // clamps at the end
    await tick();
    expect(get(ra.state).index).toBe(2);
    ra.prev();
    await tick();
    expect(synth.current?.text).toBe('Para two here.');
    expect(events).toContain('p1');
  });

  it('previous restarts the current paragraph when already part-way through it', async () => {
    const { ra, synth } = make();
    ra.setText(['First sentence is long enough here. Second sentence is also long enough.', 'Next paragraph.']);
    ra.play(1);
    await tick();
    ra.prev();
    await tick();
    expect(get(ra.state).index).toBe(0);
    synth.finish();
    await tick();
    ra.prev(); // mid-paragraph: restart it, not jump back
    await tick();
    expect(get(ra.state).index).toBe(0);
    expect(synth.current?.text.startsWith('First sentence')).toBe(true);
  });

  it('applies speed, voice and tone, and restarts the sentence when they change', async () => {
    const { ra, synth } = make();
    ra.setText(['One sentence that is being read aloud now.']);
    ra.play();
    await tick();
    expect(synth.current?.rate).toBe(1);
    ra.setRate(1.25);
    await tick();
    expect(synth.current?.rate).toBe(1.25);
    ra.setVoice('local-guy');
    await tick();
    expect(synth.current?.voice?.voiceURI).toBe('local-guy');
    ra.setTone('warm');
    await tick();
    expect(synth.current?.pitch).toBeLessThan(1);
    ra.setRate(9);
    await tick();
    expect(synth.current?.rate).toBe(1.5); // clamped to the supported range
    const n = synth.spoken.length;
    ra.setRate(1.5); // unchanged: no restart
    await tick();
    expect(synth.spoken.length).toBe(n);
  });

  it('never uses an online voice even if its id was saved', async () => {
    const { ra, synth } = make();
    ra.setText(['Some text to read aloud right now.']);
    ra.setVoice('online-jenny');
    ra.play();
    await tick();
    expect(synth.current?.voice).toBeNull();
  });

  it('switching chapters stops the old narration', async () => {
    const { ra, synth } = make();
    ra.setText(['Old chapter text goes here.']);
    ra.play();
    await tick();
    ra.setText(['New chapter text goes here.']);
    expect(get(ra.state).status).toBe('idle');
    expect(synth.current).toBeNull();
    ra.play();
    await tick();
    expect(synth.current?.text).toBe('New chapter text goes here.');
  });

  it('destroy cancels speech and detaches from the engine', async () => {
    const { ra, synth } = make();
    ra.setText(['Closing the story while it is reading.']);
    ra.play();
    await tick();
    expect(synth.listeners.length).toBe(1);
    ra.destroy();
    expect(synth.current).toBeNull();
    expect(synth.listeners.length).toBe(0);
    expect(get(ra.state).status).toBe('idle');
  });

  it('is unsupported, with a gentle message, when there is no usable voice', async () => {
    const { ra } = make([voices[2]]); // only an online voice
    expect(get(ra.state).supported).toBe(false);
    ra.setText(['Anything.']);
    ra.play();
    expect(get(ra.state).status).toBe('idle');
    expect(get(ra.state).error).toBe("Read Aloud isn't available with the current system voice configuration.");
  });

  it('does not crash when the browser has no speech engine at all', () => {
    const ra = new ReadAloud({ synth: null, Utterance: null });
    ra.setText(['Text.']);
    expect(() => {
      ra.play();
      ra.pause();
      ra.resume();
      ra.next();
      ra.prev();
      ra.stop();
      ra.destroy();
    }).not.toThrow();
    expect(get(ra.state).supported).toBe(false);
  });

  it('reports an engine error once and goes back to idle', async () => {
    const { ra, synth } = make();
    ra.setText(['Reading until the engine fails.']);
    ra.play();
    await tick();
    synth.current?.onerror?.({ error: 'synthesis-failed' });
    expect(get(ra.state).status).toBe('idle');
    expect(get(ra.state).error).toContain("isn't available");
  });

  it('picks up voices that finish loading after start-up', async () => {
    const synth = new FakeSynth([]);
    const ra = new ReadAloud({ synth, Utterance: FakeUtterance, restartDelayMs: 0 });
    expect(get(ra.state).supported).toBe(false);
    synth.voices = voices;
    synth.listeners.forEach((l) => l());
    expect(get(ra.state).supported).toBe(true);
    expect(get(ra.state).voices.map((v) => v.name)).toEqual(['Aria', 'Guy']);
  });
});
