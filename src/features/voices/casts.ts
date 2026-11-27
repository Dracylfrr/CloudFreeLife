/**
 * Voices for stories: who can speak, which voice each one gets, and how the text is cut up so that
 * every line is read by the right person. Pure functions only: no sound, no storage, no screen.
 *
 * Every story has a narrator and, optionally, a cast of speaking characters. A character's voice and
 * speed are chosen by the story's author as a starting point and can be changed by the reader; the
 * reader's choices are remembered for each character of each story.
 */

export type Gender = 'f' | 'm';
export type Trait = 'gentle' | 'warm' | 'wise' | 'jolly' | 'proper' | 'bright';
export const TRAITS: readonly Trait[] = ['gentle', 'warm', 'wise', 'jolly', 'proper', 'bright'];

export interface Voice {
  id: string;
  /** The name the voice goes by in the app. */
  name: string;
  /** The short word the recordings of this voice are published and stored under. It never changes, even if the name does. */
  pack: string;
  gender: Gender;
  accent: 'American' | 'British';
  /** A few words on how it is meant to sound. */
  feel: string;
}

/**
 * The nine voices the app offers. The `id` is the speech model's own name for the voice (a/b = American/British,
 * f/m = female/male) and is never shown; the `name` is what people see and can be changed without touching anything else.
 */
export const VOICES: readonly Voice[] = [
  { id: 'af_nicole', name: 'Wren', pack: 'wren', gender: 'f', accent: 'American', feel: 'soft and hushed' },
  { id: 'af_bella', name: 'Saffron', pack: 'saffron', gender: 'f', accent: 'American', feel: 'warm and expressive' },
  { id: 'af_sarah', name: 'Lark', pack: 'lark', gender: 'f', accent: 'American', feel: 'clear and friendly' },
  { id: 'bf_emma', name: 'Elodie', pack: 'elodie', gender: 'f', accent: 'British', feel: 'bright and bookish' },
  { id: 'bf_isabella', name: 'Linnea', pack: 'linnea', gender: 'f', accent: 'British', feel: 'gentle and kind' },
  { id: 'am_michael', name: 'Corin', pack: 'corin', gender: 'm', accent: 'American', feel: 'warm and steady' },
  { id: 'am_onyx', name: 'Orrin', pack: 'orrin', gender: 'm', accent: 'American', feel: 'deep and calm' },
  { id: 'am_santa', name: 'Bramble', pack: 'bramble', gender: 'm', accent: 'American', feel: 'low and jolly' },
  { id: 'bm_lewis', name: 'Edmund', pack: 'edmund', gender: 'm', accent: 'British', feel: 'polite and proper' }
];
export const VOICE_IDS: readonly string[] = VOICES.map((v) => v.id);
export const isVoice = (id: unknown): id is string => typeof id === 'string' && VOICE_IDS.includes(id);
export const voiceInfo = (id: string): Voice | undefined => VOICES.find((v) => v.id === id);
export const voiceByPack = (pack: string): Voice | undefined => VOICES.find((v) => v.pack === pack);

export const NARRATOR_ID = 'narrator';
export const DEFAULT_NARRATOR_VOICE = 'bf_emma';
/** The calm bedtime pace. On the speech model 0.8 reads about 85% as fast as 1.0 (measured: a 6.8 second line lasts 8.1 seconds). */
export const DEFAULT_NARRATOR_SPEED = 0.8;
/** Characters speak a touch quicker than the narrator, so a conversation still feels lively. */
export const DEFAULT_CHARACTER_SPEED = 0.85;
export const SPEED_MIN = 0.6;
export const SPEED_MAX = 1.4;
export const clampSpeed = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) ? Math.round(Math.min(SPEED_MAX, Math.max(SPEED_MIN, n)) * 20) / 20 : 1);

/** A speaking character, as an author writes it in a story's `cast`. */
export interface CastMember {
  id: string;
  /** How the character is named in the story ("Tilly", "Mr. Alder", "the bear"). */
  name: string;
  gender: Gender;
  trait?: Trait;
  /** Other words the story uses for this character ("Miss Quill", "Hester"). */
  aka?: string[];
  /** The voice the author suggests; otherwise one is chosen from the gender and the trait. */
  voice?: string;
}

/** What each kind of character starts with. The first choice is used unless another character already has it. */
const PREFERENCE: Record<Gender, Record<Trait, string[]>> = {
  f: {
    gentle: ['af_nicole', 'bf_isabella', 'af_sarah', 'af_bella', 'bf_emma'],
    warm: ['af_bella', 'af_sarah', 'bf_isabella', 'af_nicole', 'bf_emma'],
    wise: ['bf_isabella', 'bf_emma', 'af_sarah', 'af_nicole', 'af_bella'],
    jolly: ['af_bella', 'af_sarah', 'bf_emma', 'af_nicole', 'bf_isabella'],
    proper: ['bf_emma', 'bf_isabella', 'af_sarah', 'af_bella', 'af_nicole'],
    bright: ['af_sarah', 'af_bella', 'bf_emma', 'af_nicole', 'bf_isabella']
  },
  m: {
    gentle: ['am_michael', 'bm_lewis', 'am_onyx', 'am_santa'],
    warm: ['am_michael', 'am_santa', 'bm_lewis', 'am_onyx'],
    wise: ['am_onyx', 'bm_lewis', 'am_michael', 'am_santa'],
    jolly: ['am_santa', 'am_michael', 'am_onyx', 'bm_lewis'],
    proper: ['bm_lewis', 'am_michael', 'am_onyx', 'am_santa'],
    bright: ['am_michael', 'am_santa', 'bm_lewis', 'am_onyx']
  }
};

export interface SavedVoice {
  voice: string;
  speed: number;
}
/** The reader's choices, remembered by story and then by character ("narrator" for the narrator). */
export type SavedCasts = Record<string, Record<string, SavedVoice>>;

export interface Speaker {
  id: string;
  name: string;
  isNarrator: boolean;
  gender?: Gender;
  voice: string;
  speed: number;
  /** True when the reader changed this one (and the choice is remembered). */
  custom: boolean;
  aka: string[];
}

/**
 * Everyone who can speak in a story, narrator first, each with a voice and a speed.
 * Order of authority: what the reader chose, then what the author suggested, then the best free voice.
 */
export function resolveSpeakers(cast: readonly CastMember[] | undefined, saved: Record<string, SavedVoice> | undefined, narrator: SavedVoice): Speaker[] {
  const out: Speaker[] = [];
  const nSaved = saved?.[NARRATOR_ID];
  out.push({
    id: NARRATOR_ID,
    name: 'Narrator',
    isNarrator: true,
    voice: isVoice(nSaved?.voice) ? nSaved!.voice : narrator.voice,
    speed: nSaved ? clampSpeed(nSaved.speed) : clampSpeed(narrator.speed),
    custom: !!nSaved,
    aka: []
  });
  const taken = new Set<string>([out[0].voice]);
  for (const m of cast ?? []) {
    const own = saved?.[m.id];
    let voice: string;
    if (isVoice(own?.voice)) voice = own!.voice;
    else if (isVoice(m.voice)) voice = m.voice;
    else {
      const prefs = PREFERENCE[m.gender][m.trait ?? 'warm'];
      voice = prefs.find((v) => !taken.has(v)) ?? prefs[0];
    }
    taken.add(voice);
    out.push({ id: m.id, name: m.name, isNarrator: false, gender: m.gender, voice, speed: own ? clampSpeed(own.speed) : DEFAULT_CHARACTER_SPEED, custom: !!own, aka: m.aka ?? [] });
  }
  return out;
}

// ------------------------------------------------------------------ cutting text into lines

export interface Chunk {
  /** Which paragraph of the passage this came from (for highlighting). */
  para: number;
  /** The id of the speaker: a cast member, or "narrator". */
  who: string;
  text: string;
}

const TITLE_RE = /^(?:Mr|Mrs|Ms|Miss|Dr|Sir|Lady|Lord|Old|Captain|Professor)\.?$/i;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The words that point at a character in the narration: its name, the name without a title, and any `aka`. */
export function namesFor(s: Pick<Speaker, 'name' | 'aka'>): string[] {
  const set = new Set<string>();
  for (const full of [s.name, ...s.aka]) {
    const clean = full.replace(/^the\s+/i, '').trim();
    if (!clean) continue;
    set.add(clean);
    const parts = clean.split(/\s+/).filter((p) => !TITLE_RE.test(p));
    for (const p of parts) if (p.length > 2) set.add(p.replace(/[.,]$/, ''));
  }
  return [...set].sort((a, b) => b.length - a.length);
}

function findSpeaker(text: string, speakers: Speaker[], from: 'start' | 'end'): { id: string; at: number } | null {
  const words = text.split(/\s+/).filter(Boolean);
  const near = (from === 'start' ? words.slice(0, 9) : words.slice(-9)).join(' ');
  let best: { id: string; at: number } | null = null;
  for (const sp of speakers) {
    if (sp.isNarrator) continue;
    for (const n of namesFor(sp)) {
      // "the bear" is found as "The bear" too; a proper name must match its capital letter
      const m = new RegExp(`(?<![A-Za-z])${escapeRe(n)}(?![A-Za-z])`, /^[a-z]/.test(n) ? 'i' : '').exec(near);
      if (!m) continue;
      const pos = from === 'start' ? m.index : -m.index;
      if (!best || pos < best.at) best = { id: sp.id, at: pos };
    }
  }
  return best;
}

interface Piece {
  speech: boolean;
  text: string;
}

/** Splits a paragraph at its quotation marks into narration and speech. */
export function splitQuotes(text: string): Piece[] {
  const out: Piece[] = [];
  const re = /["“]([^"“”]*)["”]/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ speech: false, text: text.slice(last, m.index) });
    out.push({ speech: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ speech: false, text: text.slice(last) });
  return out.filter((p) => p.text.trim().length > 0);
}

/** How long a line of speech may be. Shorter lines are made faster, so the next one is ready sooner. */
export const SPEECH_MAX = 110;

/** Cuts a long piece of text into sentences no longer than `max` characters, for smooth, quick speech. */
export function sentences(text: string, max = 240): string[] {
  const parts = text.replace(/\s+/g, ' ').trim().match(/[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/g) ?? [];
  const out: string[] = [];
  let cur = '';
  for (const p of parts.map((s) => s.trim()).filter(Boolean)) {
    if (cur && (cur + ' ' + p).length > max) {
      out.push(cur);
      cur = p;
    } else cur = cur ? `${cur} ${p}` : p;
  }
  if (cur) out.push(cur);
  // a single very long sentence is cut at commas as a last resort
  return out.flatMap((s) => (s.length <= max * 1.6 ? [s] : s.split(/(?<=[,;:])\s+/).reduce<string[]>((a, piece) => (a.length && (a[a.length - 1] + ' ' + piece).length <= max ? [...a.slice(0, -1), `${a[a.length - 1]} ${piece}`] : [...a, piece]), [])));
}

/**
 * Turns a passage into lines to be read: quoted words go to the character who said them (found from the
 * words around the quote: "said Tilly", "Tilly asked"), everything else goes to the narrator.
 * A line whose speaker cannot be told is read by the narrator, which is always safe.
 */
export function toChunks(paragraphs: readonly string[], speakers: Speaker[], carry: { last?: string } = {}): Chunk[] {
  const gendered = (g: Gender): string | undefined => {
    const last = speakers.find((s) => s.id === carry.last);
    if (last && last.gender === g) return last.id;
    const same = speakers.filter((s) => !s.isNarrator && s.gender === g);
    return same.length ? same[0].id : undefined;
  };
  const chunks: Chunk[] = [];
  paragraphs.forEach((paragraph, para) => {
    const pieces = splitQuotes(paragraph);
    pieces.forEach((piece, i) => {
      if (!piece.speech) {
        for (const s of sentences(piece.text, SPEECH_MAX)) chunks.push({ para, who: NARRATOR_ID, text: s });
        return;
      }
      const before = pieces[i - 1]?.speech === false ? pieces[i - 1].text : '';
      const after = pieces[i + 1]?.speech === false ? pieces[i + 1].text : '';
      const found = (after && findSpeaker(after, speakers, 'start')) || (before && findSpeaker(before, speakers, 'end')) || null;
      // "he said" / "she asked": the character of that gender who spoke last, or the only one there is
      const pronoun = /^[\s,.:;!?]*(he|she)\b/i.exec(after)?.[1] ?? /\b(he|she)\s+(?:said|asked|says|asks|replied|whispered|called|answered|murmured|added|laughed)[\s,.:;!?]*$/i.exec(before)?.[1];
      const byPronoun = pronoun ? gendered(pronoun.toLowerCase() === 'he' ? 'm' : 'f') : undefined;
      const who = found ? found.id : byPronoun ? byPronoun : carry.last && !after && !before ? carry.last : NARRATOR_ID;
      if (who !== NARRATOR_ID) carry.last = who;
      for (const s of sentences(piece.text, SPEECH_MAX)) chunks.push({ para, who, text: s });
    });
  });
  return chunks;
}

/** The choices saved for a story without the narrator's, so the narrator chosen in Settings applies to it again. */
export function withoutNarrator(saved: SavedCasts): SavedCasts {
  const out: SavedCasts = {};
  for (const [story, members] of Object.entries(saved)) {
    const { [NARRATOR_ID]: _n, ...rest } = members;
    if (Object.keys(rest).length) out[story] = rest;
  }
  return out;
}

/** A short, friendly sample line for trying out a voice. */
export const SAMPLE_LINE = 'Good evening. The lanterns are lit.';

// ------------------------------------------------------------------ settings

export function sanitizeSavedCasts(raw: unknown): SavedCasts {
  const out: SavedCasts = {};
  if (!raw || typeof raw !== 'object') return out;
  let stories = 0;
  for (const [storyId, members] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[a-z0-9][a-z0-9_]{0,63}$/.test(storyId) || !members || typeof members !== 'object' || ++stories > 400) continue;
    const clean: Record<string, SavedVoice> = {};
    let n = 0;
    for (const [id, v] of Object.entries(members as Record<string, unknown>)) {
      if (!/^[a-z0-9][a-z0-9_]{0,31}$/.test(id) || !v || typeof v !== 'object' || ++n > 24) continue;
      const { voice, speed } = v as { voice?: unknown; speed?: unknown };
      if (isVoice(voice)) clean[id] = { voice, speed: clampSpeed(speed) };
    }
    if (Object.keys(clean).length) out[storyId] = clean;
  }
  return out;
}
