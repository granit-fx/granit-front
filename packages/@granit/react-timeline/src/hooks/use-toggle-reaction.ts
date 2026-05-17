import { toggleReaction } from '@granit/timeline';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { buildTimelineQueryKey, useTimelineConfig } from '../providers/timeline-provider.js';

import type {
  ReactionEmoji,
  ReactionMap,
  ReactionToggleResult,
  TimelineEntry,
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
 *   `ReactionToggleResult` for the toggled emoji) into the map of
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
  ReactionToggleResult,
  Error,
  ToggleReactionVariables,
  ToggleReactionContext
> {
  const config = useTimelineConfig();
  const queryClient = useQueryClient();

  return useMutation<ReactionToggleResult, Error, ToggleReactionVariables, ToggleReactionContext>({
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
  });
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
 * cache shapes (`TimelineEntryPage` + bare `TimelineEntry`); other
 * shapes pass through unchanged.
 */
function patchEntries(
  old: unknown,
  entryId: TimelineEntryId,
  mutate: (reactions: ReactionMap | undefined) => ReactionMap | undefined
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
 * Pure optimistic toggle of one emoji on a {@link ReactionMap} —
 * exported so apps doing optimistic UI outside the React Query cache
 * (e.g. against `useTimeline`'s internal state) can reuse the same
 * logic. The server's authoritative count is applied later via
 * {@link applyToggleResult}.
 */
export function toggleReactionMap(
  reactions: ReactionMap | undefined,
  emoji: ReactionEmoji
): ReactionMap | undefined {
  const current = reactions?.[emoji];
  if (!current) {
    return { ...(reactions ?? {}), [emoji]: { count: 1, byCurrentUser: true } };
  }
  if (current.byCurrentUser) {
    const nextCount = current.count - 1;
    if (nextCount <= 0) {
      const rest = Object.fromEntries(
        Object.entries(reactions ?? {}).filter(([key]) => key !== emoji)
      );
      return Object.keys(rest).length === 0 ? undefined : (rest as ReactionMap);
    }
    return { ...(reactions ?? {}), [emoji]: { count: nextCount, byCurrentUser: false } };
  }
  return {
    ...(reactions ?? {}),
    [emoji]: { count: current.count + 1, byCurrentUser: true },
  };
}

/**
 * Apply the backend's authoritative `(emoji, count, byCurrentUser)` to a
 * {@link ReactionMap}. Exported so apps using `useTimeline` (or any other
 * non-React-Query stream state) can merge the {@link ReactionToggleResult}
 * straight into their entry without a full refetch.
 */
export function applyToggleResult(
  reactions: ReactionMap | undefined,
  result: ReactionToggleResult
): ReactionMap | undefined {
  if (result.count <= 0) {
    if (!reactions) return undefined;
    const rest = Object.fromEntries(
      Object.entries(reactions).filter(([key]) => key !== result.emoji)
    );
    return Object.keys(rest).length === 0 ? undefined : (rest as ReactionMap);
  }
  return {
    ...(reactions ?? {}),
    [result.emoji]: { count: result.count, byCurrentUser: result.currentUserHasReacted },
  };
}

function isTimelineEntryPage(value: unknown): value is TimelineEntryPage {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { items?: unknown }).items)
  );
}

function isTimelineEntry(value: unknown): value is TimelineEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string' &&
    typeof (value as { entryType?: unknown }).entryType === 'number'
  );
}
