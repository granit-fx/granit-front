/**
 * Closed v1 catalog of reaction emoji codes — mirrors the backend
 * decision in granit-fx/granit-dotnet#1811. Extension requires an ADR
 * amendment (same anti-Odoo policy as the rest of Phase 2: closed
 * enums on the wire, never an `eval:` string).
 *
 * Codes follow the `:short_name:` convention, not the literal emoji,
 * so client-side rendering can swap visual style (Twemoji, Apple,
 * native) without re-keying state.
 */
export type ReactionEmoji = ':thumbs_up:' | ':heart:' | ':tada:' | ':joy:' | ':eyes:';

/** Closed catalog as a frozen tuple — useful for picker iteration. */
export const REACTION_EMOJIS: readonly ReactionEmoji[] = Object.freeze([
  ':thumbs_up:',
  ':heart:',
  ':tada:',
  ':joy:',
  ':eyes:',
]);

/**
 * Aggregated reaction count for one entry / emoji pair.
 *
 * `hasReacted` is the **caller's** status — true when the
 * authenticated user has reacted with this emoji on this entry.
 * Toggling the same emoji twice removes the reaction (idempotent).
 */
export interface Reaction {
  readonly emoji: ReactionEmoji;
  /** Distinct users who reacted with this emoji. */
  readonly count: number;
  /** True when the authenticated caller has reacted with this emoji. */
  readonly hasReacted: boolean;
}
