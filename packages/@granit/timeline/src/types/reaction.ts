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
