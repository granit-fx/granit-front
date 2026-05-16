import { buildApiUrl } from '@granit/api-client';

import type { ReactionEmoji, ReactionToggleResult } from '../types/reaction.js';
import type { TimelineEntryId } from '../types/stream.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Toggle a reaction on one timeline entry — idempotent.
 *
 * `POST {basePath}/entries/{entryId}/reactions/{emoji}`
 *
 * The backend treats the call as a toggle keyed on
 * `(entryId, emoji, callerUserId)`: a fresh call adds the reaction;
 * a repeat call from the same caller removes it. The response is the
 * post-toggle authoritative state for the `(entryId, emoji)` pair —
 * apps patch their local cache by merging this aggregate back into
 * the entry's `reactions` map.
 *
 * Mirror of the dotnet endpoint shipped in
 * granit-fx/granit-dotnet#1811. Permission: `Timeline.Reactions.React`.
 */
export async function toggleReaction(
  client: AxiosInstance,
  basePath: string,
  entryId: TimelineEntryId,
  emoji: ReactionEmoji
): Promise<ReactionToggleResult> {
  const { data } = await client.post<ReactionToggleResult>(
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
