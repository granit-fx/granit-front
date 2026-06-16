import { toggleReaction } from '@granit/timeline';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { buildTimelineQueryKey, useTimelineConfig } from '../providers/timeline-provider';

import type {
  ReactionEmoji,
  ReactionMap,
  ReactionToggleResponse,
  TimelineStreamEntryResponse,
  TimelineEntryId,
  TimelineEntryPage,
} from '@granit/timeline';

/**
 * Mutation arguments for {@link useToggleReaction}. Apps pass the
 * surrounding stream's `(entityType, entityId)` so the hook scopes
 * cache patches + invalidation to that stream's query keys —
 * unrelated streams' caches survive untouched.
 *
 * For entries with `origin === 'External'` that have no native shadow
 * row yet, the caller must first call {@link useAnchorEntry} to
 * materialise the shadow, then pass the returned shadow id as
 * `entryId` here. The reaction endpoint only operates on native ids.
 */
export interface ToggleReactionVariables {
  readonly entityType: string;
  readonly entityId: string;
  readonly entryId: TimelineEntryId;
  readonly emoji: ReactionEmoji;
}

interface ToggleReactionContext {
  readonly previousQueries: readonly [readonly unknown[], unknown][];
}

/**
 * Toggle one reaction on one entry, with **scoped** optimistic updates
 * + rollback on the React Query cache.
 *
 * Wire: `POST {basePath}/entries/{entryId}/reactions/{emoji}` (idempotent
 * — toggling the same emoji twice removes the reaction; backend keys on
 * `(entryId, emoji, callerUserId)`). See
 * granit-fx/granit-dotnet#1811.
 *
 * Cache strategy:
 * - `onMutate` cancels in-flight queries on the surrounding stream's
 *   prefix and patches every cached `TimelineEntryPage` (and
 *   single-entry cache) so the matching entry's `reactions[]` reflects
 *   the toggle immediately.
 * - `onError` restores the snapshot taken in `onMutate`.
 * - `onSuccess` writes server truth (the authoritative
 *   `ReactionToggleResponse` for the toggled emoji) into the map of
 *   any matching cached entries, then invalidates the prefix so any
 *   in-flight subscribers refetch from authority.
 * - The prefix is `[...queryKeyPrefix, entityType, entityId]` — a
 *   100-toggle session on `Quote/q-1` never invalidates the cache
 *   for `Quote/q-2` or `Party/p-3`.
 *
 * Note: the standalone `useTimeline` hook in this package keeps its
 * own internal state (not React Query) and is not affected by this
 * cache layer. Apps using both wire `mutation.onSuccess` to call
 * `useTimeline.refresh()` themselves; apps that maintain a React
 * Query stream cache benefit from the scoped patching out of the box.
 */
export function useToggleReaction(): UseMutationResult<
  ReactionToggleResponse,
  Error,
  ToggleReactionVariables,
  ToggleReactionContext
> {
  const config = useTimelineConfig();
  const queryClient = useQueryClient();

  return useMutation<ReactionToggleResponse, Error, ToggleReactionVariables, ToggleReactionContext>(
    {
      mutationFn: ({ entryId, emoji }) =>
        toggleReaction(config.client, config.basePath, entryId, emoji),

      onMutate: async (vars) => {
        const prefix = streamPrefix(config, vars);
        await queryClient.cancelQueries({ queryKey: prefix });

        const previousQueries = queryClient.getQueriesData({ queryKey: prefix });

        queryClient.setQueriesData<unknown>({ queryKey: prefix }, (old: unknown) =>
          patchEntries(old, vars.entryId, (reactions) => toggleReactionMap(reactions, vars.emoji))
        );

        return { previousQueries };
      },

      onError: (_error, _vars, context) => {
        if (!context) return;
        for (const [key, snapshot] of context.previousQueries) {
          queryClient.setQueryData(key, snapshot);
        }
      },

      onSuccess: (result, vars) => {
        const prefix = streamPrefix(config, vars);
        queryClient.setQueriesData<unknown>({ queryKey: prefix }, (old: unknown) =>
          patchEntries(old, vars.entryId, (reactions) => applyToggleResult(reactions, result))
        );
        queryClient.invalidateQueries({ queryKey: prefix });
      },
    }
  );
}

function streamPrefix(
  config: ReturnType<typeof useTimelineConfig>,
  vars: ToggleReactionVariables
): readonly unknown[] {
  return buildTimelineQueryKey(config, vars.entityType, vars.entityId);
}

/**
 * Patch every cached entry matching `entryId` by replacing its
 * `reactions` map with `mutate(entry.reactions)`. Walks the two known
 * cache shapes (`TimelineEntryPage` + bare `TimelineStreamEntryResponse`); other
 * shapes pass through unchanged.
 */
function patchEntries(
  old: unknown,
  entryId: TimelineEntryId,
  mutate: (reactions: ReactionMap | null | undefined) => ReactionMap | undefined
): unknown {
  if (isTimelineEntryPage(old)) {
    return {
      ...old,
      items: old.items.map((entry) =>
        entry.id === entryId ? { ...entry, reactions: mutate(entry.reactions) } : entry
      ),
    };
  }
  if (isTimelineEntry(old) && old.id === entryId) {
    return { ...old, reactions: mutate(old.reactions) };
  }
  return old;
}

/**
 * Pure optimistic toggle of one emoji on a {@link ReactionMap}.
 * Internal utility — used by {@link useToggleReaction}'s `onMutate`.
 * The server's authoritative count is applied later via
 * {@link applyToggleResult}.
 *
 * @internal Not part of the public API; exported only for unit tests.
 */
export function toggleReactionMap(
  reactions: ReactionMap | null | undefined,
  emoji: ReactionEmoji
): ReactionMap | undefined {
  const map = reactions ?? undefined;
  const current = map?.[emoji];
  if (!current) {
    // New emoji — use the glyph itself as displayEmoji (first reactor's choice).
    return { ...map, [emoji]: { count: 1, byCurrentUser: true, displayEmoji: emoji } };
  }
  if (current.byCurrentUser) {
    const nextCount = current.count - 1;
    if (nextCount <= 0) {
      const rest: ReactionMap = Object.fromEntries(
        Object.entries(map ?? {}).filter(([key]) => key !== emoji)
      );
      return Object.keys(rest).length === 0 ? undefined : rest;
    }
    return {
      ...map,
      [emoji]: { count: nextCount, byCurrentUser: false, displayEmoji: current.displayEmoji },
    };
  }
  return {
    ...map,
    [emoji]: { count: current.count + 1, byCurrentUser: true, displayEmoji: current.displayEmoji },
  };
}

/**
 * Apply the backend's authoritative `(emoji, count, byCurrentUser)` to a
 * {@link ReactionMap}. Exported so host apps that manage entry state outside
 * React Query (e.g. via `useTimeline.patchEntry`) can stay in sync without
 * duplicating the merge logic.
 *
 * When `result.count > 0` the existing `displayEmoji` is preserved if the
 * aggregate was already in the map; otherwise `result.emoji` is used as the
 * display form. The backend streams the authoritative `displayEmoji` on the
 * next full page fetch; this fallback only fires between the toggle and the
 * next refresh.
 */
export function applyToggleResult(
  reactions: ReactionMap | null | undefined,
  result: ReactionToggleResponse
): ReactionMap | undefined {
  const map = reactions ?? undefined;
  if (result.count <= 0) {
    if (!map) return undefined;
    const rest: ReactionMap = Object.fromEntries(
      Object.entries(map).filter(([key]) => key !== result.emoji)
    );
    return Object.keys(rest).length === 0 ? undefined : rest;
  }
  return {
    ...map,
    [result.emoji]: {
      count: result.count,
      byCurrentUser: result.currentUserHasReacted,
      displayEmoji: map?.[result.emoji]?.displayEmoji ?? result.emoji,
    },
  };
}

function isTimelineEntryPage(value: unknown): value is TimelineEntryPage {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { items?: unknown }).items)
  );
}

function isTimelineEntry(value: unknown): value is TimelineStreamEntryResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { entryType?: unknown }).entryType === 'string'
  );
}
