/**
 * Reaction emoji wire type — any well-formed Unicode emoji sequence.
 *
 * Mirrors the open-ended payload accepted by the backend's
 * `EmojiValidator` (Extended_Pictographic codepoint, optionally
 * followed by VS-16, a Fitzpatrick modifier, a ZWJ-joined sequence,
 * or a keycap combiner). The closed v1 catalog (thumbs_up / heart /
 * tada / joy / eyes) is gone — picker UX is now a client concern.
 *
 * Branded so callers can't accidentally pass arbitrary strings to the
 * wire: build values via {@link toReactionEmoji} (unchecked cast for
 * hot paths) or {@link parseReactionEmoji} (runtime-validated, returns
 * `null` for malformed input). The brand is erased at runtime — the
 * underlying value is always the literal emoji glyph (`'👍'`, not a
 * short name).
 *
 * Wire change tracked in ADR-040 (amendment in granit-docs).
 */
export type ReactionEmoji = string & { readonly __reactionEmoji: unique symbol };

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
    '[0-9#*]\\uFE0F?\\u20E3' +
    '|' +
    // Regional Indicator pair (flag)
    '\\p{Regional_Indicator}\\p{Regional_Indicator}' +
    '|' +
    // Pictographic + optional tag sequence
    '\\p{Extended_Pictographic}\\uFE0F?[\\u{1F3FB}-\\u{1F3FF}]?' +
    '(?:\\u200D\\p{Extended_Pictographic}\\uFE0F?[\\u{1F3FB}-\\u{1F3FF}]?)*' +
    '(?:[\\u{E0020}-\\u{E007E}]+\\u{E007F})?' +
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

/**
 * Aggregated reaction count for one emoji on one entry. Lives inside
 * the entry's {@link ReactionMap}, keyed by the emoji glyph — the map
 * only carries emojis with at least one reaction, so an entry with
 * zero reactions has `reactions` either undefined or `{}`.
 */
export interface ReactionAggregate {
  /** Distinct users who reacted with this emoji. */
  readonly count: number;
  /** True when the authenticated caller is among the reactors. */
  readonly byCurrentUser: boolean;
}

/**
 * Per-emoji reaction summary attached to a timeline entry. Mirrors
 * the backend `IReadOnlyDictionary<string, ReactionAggregateResponse>`
 * payload — only emojis with at least one reaction are present. The
 * `ReactionEmoji` brand is erased at runtime so the record key is just
 * the literal emoji glyph.
 */
export type ReactionMap = Readonly<Partial<Record<ReactionEmoji, ReactionAggregate>>>;

/**
 * Post-toggle authoritative state for a single (entry, emoji) pair,
 * returned by `POST /entries/{entryId}/reactions/{emoji}`.
 */
export interface ReactionToggleResult {
  readonly entryId: string;
  readonly emoji: ReactionEmoji;
  readonly count: number;
  readonly currentUserHasReacted: boolean;
}
