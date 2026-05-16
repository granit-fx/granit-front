/**
 * Closed v1 catalog of reaction emoji codes — mirrors the backend
 * decision in granit-fx/granit-dotnet#1811. Extension requires an ADR
 * amendment (same anti-Odoo policy as the rest of Phase 2: closed
 * enums on the wire, never an `eval:` string).
 *
 * Wire identifier is the snake_case short name (no `:` delimiters) —
 * matches `Granit.Timeline.Domain.ReactionEmojiCatalog`. The literal
 * glyph is purely a client-side rendering concern (Twemoji, Apple,
 * native) and never crosses the wire.
 */
export type ReactionEmoji = 'thumbs_up' | 'heart' | 'tada' | 'joy' | 'eyes';

/** Closed catalog as a frozen tuple — useful for picker iteration. */
export const REACTION_EMOJIS: readonly ReactionEmoji[] = Object.freeze([
  'thumbs_up',
  'heart',
  'tada',
  'joy',
  'eyes',
]);

/**
 * Aggregated reaction count for one emoji on one entry. Lives inside
 * the entry's {@link ReactionMap}, keyed by the emoji short name —
 * the map only carries emojis with at least one reaction, so an
 * entry with zero reactions has `reactions` either undefined or `{}`.
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
 * payload — only emojis with at least one reaction are present.
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
