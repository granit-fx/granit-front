import { buildApiUrl } from '@granit/api-client';

import type { ReactionEmoji, ReactionToggleResponse } from '../types/reaction';
import type { TimelineEntryId } from '../types/stream';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Toggle a reaction on one timeline entry — idempotent.
 *
 * `POST {basePath}/entries/{entryId}/reactions/{emoji}`
 *
 * `emoji` is the literal Unicode sequence (e.g. `'👍'`,
 * `'👨‍👩‍👧'`). `encodeURIComponent` widens it to its UTF-8
 * percent-encoding (`'👍'` → `%F0%9F%91%8D`); the backend
 * `EmojiValidator` decodes and validates against the same
 * Extended_Pictographic grammar as {@link parseReactionEmoji}.
 *
 * The backend treats the call as a toggle keyed on
 * `(entryId, emoji, callerUserId)`: a fresh call adds the reaction;
 * a repeat call from the same caller removes it. The response is the
 * post-toggle authoritative state for the `(entryId, emoji)` pair —
 * apps patch their local cache by merging this aggregate back into
 * the entry's `reactions` map.
 *
 * Wire opened to any well-formed emoji sequence in
 * granit-fx/granit-dotnet#2188 (ADR-040 amendment).
 * Permission: `Timeline.Reactions.React`.
 */
export async function toggleReaction(
  client: AxiosInstance,
  basePath: string,
  entryId: TimelineEntryId,
  emoji: ReactionEmoji
): Promise<ReactionToggleResponse> {
  const { data } = await client.post<ReactionToggleResponse>(
    buildApiUrl(
      basePath,
      'entries',
      encodeURIComponent(entryId),
      'reactions',
      encodeURIComponent(emoji)
    )
  );
  return data;
}
