import { buildApiUrl } from '@granit/api-client';

import type { ReactionEmoji } from '../types/reaction.js';
import type { TimelineEntry, TimelineEntryId } from '../types/stream.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Toggle a reaction on one timeline entry — idempotent.
 *
 * `POST {basePath}/entries/{entryId}/reactions/{emoji}`
 *
 * The backend treats the call as a toggle keyed on
 * `(entryId, emoji, callerUserId)`: a fresh call adds the reaction;
 * a repeat call from the same caller removes it. The response is the
 * full updated entry (with refreshed `reactions[]`) so the client can
 * patch its cache without a separate stream re-fetch.
 *
 * Mirror of the dotnet endpoint shipped in
 * granit-fx/granit-dotnet#1811. Permission: {@link TimelinePermissions.Timeline.React}.
 */
export async function toggleReaction(
  client: AxiosInstance,
  basePath: string,
  entryId: TimelineEntryId,
  emoji: ReactionEmoji
): Promise<TimelineEntry> {
  const { data } = await client.post<TimelineEntry>(
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
