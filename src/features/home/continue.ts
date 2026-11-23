/**
 * The Home "Continue" card resumes whichever thing you touched most recently: a painting, a story
 * or adventure, a meditation, or a Zen garden. This picks the winner; Home turns it into a card.
 */
export type ContinueKind = 'painting' | 'reading' | 'meditation' | 'zen';

export interface ContinueCandidate {
  kind: ContinueKind;
  /** Milliseconds since 1970: when it was last touched. */
  at: number;
}

/** The most recently touched candidate (earlier one wins a tie, so the order given is the priority). */
export function pickContinue(candidates: (ContinueCandidate | null | undefined)[]): ContinueCandidate | null {
  let best: ContinueCandidate | null = null;
  for (const c of candidates) {
    if (!c || !Number.isFinite(c.at) || c.at <= 0) continue;
    if (!best || c.at > best.at) best = c;
  }
  return best;
}
