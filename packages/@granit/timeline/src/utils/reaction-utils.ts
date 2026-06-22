import type { ReactionEmoji } from '../types/reaction';

/**
 * Matches one well-formed emoji sequence — four shapes:
 *
 * 1. Keycap: `[0-9#*]` + optional VS-16 + mandatory U+20E3 combiner.
 *    `'1'` alone is not a valid emoji; `'1️⃣'` is.
 * 2. Regional Indicator pair: two consecutive
 *    `\p{Regional_Indicator}` codepoints (no ZWJ). Country flags like
 *    `🇧🇪`, `🇫🇷`, `🇺🇸`. The pair is matched as a unit so a single
 *    stray RI never validates.
 * 3. Pictographic: one `\p{Extended_Pictographic}` codepoint, optional
 *    VS-16, optional Fitzpatrick skin-tone modifier, optionally
 *    chained via ZWJ (families, professions, flag-of-… ZWJ forms).
 * 4. Tag sequence: the pictographic shape above, followed by one or
 *    more tag chars (U+E0020–U+E007E) terminated by U+E007F. Used by
 *    subdivision flags `🏴󠁧󠁢󠁥󠁮󠁧󠁿` (England), `🏴󠁧󠁢󠁳󠁣󠁴󠁿` (Scotland),
 *    `🏴󠁧󠁢󠁷󠁬󠁳󠁿` (Wales).
 */
const EMOJI_SEQUENCE = new RegExp(
  '^' +
    '(?:' +
    // Keycap
    '[0-9#*]️?⃣' +
    '|' +
    // Regional Indicator pair (flag)
    String.raw`\p{Regional_Indicator}\p{Regional_Indicator}` +
    '|' +
    // Pictographic + optional tag sequence
    String.raw`\p{Extended_Pictographic}️?[\u{1F3FB}-\u{1F3FF}]?` +
    String.raw`(?:‍\p{Extended_Pictographic}️?[\u{1F3FB}-\u{1F3FF}]?)*` +
    String.raw`(?:[\u{E0020}-\u{E007E}]+\u{E007F})?` +
    ')' +
    '$',
  'u'
);

/**
 * Unchecked brand cast — assumes the caller already validated the
 * shape (e.g. value comes from emoji-mart's `native` field, which only
 * produces well-formed sequences). Use {@link parseReactionEmoji} when
 * the source is user input or untrusted API data.
 */
export function toReactionEmoji(value: string): ReactionEmoji {
  return value as ReactionEmoji;
}

/**
 * Validate `value` against the wire grammar accepted by the backend
 * `EmojiValidator`. Returns the branded value when well-formed, `null`
 * otherwise. Cheap (single regex) — fine to call on the hot path.
 */
export function parseReactionEmoji(value: string): ReactionEmoji | null {
  if (value.length === 0 || value.length > 32) return null;
  return EMOJI_SEQUENCE.test(value) ? (value as ReactionEmoji) : null;
}
