import { toggleReaction } from '@granit/timeline';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { buildTimelineQueryKey, useTimelineConfig } from '../providers/timeline-provider.js';

import type {
  Reaction,
  ReactionEmoji,
  TimelineEntry,
  TimelineEntryId,
  TimelineEntryPage,
} from '@granit/timeline';

/**
 * Mutation arguments for {@link useToggleReaction}. Apps pass the
 * surrounding stream's `(entityType, entityId)` so the hook scopes
 * cache patches + invalidation to that stream's query keys —
 * unrelated streams' caches survive untouched.
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
 * - `onSuccess` writes server truth (the refreshed `TimelineEntry`)
 *   over any matching entries, then invalidates the prefix so any
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
  TimelineEntry,
  Error,
  ToggleReactionVariables,
  ToggleReactionContext
> {
  const config = useTimelineConfig();
  const queryClient = useQueryClient();

  return useMutation<TimelineEntry, Error, ToggleReactionVariables, ToggleReactionContext>({
    mutationFn: ({ entryId, emoji }) =>
      toggleReaction(config.client, config.basePath, entryId, emoji),

    onMutate: async (vars) => {
      const prefix = streamPrefix(config, vars);
      await queryClient.cancelQueries({ queryKey: prefix });

      const previousQueries = queryClient.getQueriesData({ queryKey: prefix });

      queryClient.setQueriesData<unknown>({ queryKey: prefix }, (old: unknown) =>
        patchOptimistic(old, vars.entryId, vars.emoji)
      );

      return { previousQueries };
    },

    onError: (_error, _vars, context) => {
      if (!context) return;
      for (const [key, snapshot] of context.previousQueries) {
        queryClient.setQueryData(key, snapshot);
      }
    },

    onSuccess: (refreshed, vars) => {
      const prefix = streamPrefix(config, vars);
      queryClient.setQueriesData<unknown>({ queryKey: prefix }, (old: unknown) =>
        replaceServerTruth(old, refreshed)
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
 * Patch every cached entry matching `entryId` with the optimistic
 * reaction toggle. Walks the two known cache shapes:
 *   - `TimelineEntryPage` (paginated stream slot)
 *   - single `TimelineEntry` (per-entry cache)
 * Other shapes pass through unchanged so apps with custom caches
 * aren't affected.
 */
function patchOptimistic(old: unknown, entryId: TimelineEntryId, emoji: ReactionEmoji): unknown {
  if (isTimelineEntryPage(old)) {
    return {
      ...old,
      items: old.items.map((entry) =>
        entry.id === entryId ? toggleEntryReaction(entry, emoji) : entry
      ),
    };
  }
  if (isTimelineEntry(old) && old.id === entryId) {
    return toggleEntryReaction(old, emoji);
  }
  return old;
}

function replaceServerTruth(old: unknown, refreshed: TimelineEntry): unknown {
  if (isTimelineEntryPage(old)) {
    return {
      ...old,
      items: old.items.map((entry) => (entry.id === refreshed.id ? refreshed : entry)),
    };
  }
  if (isTimelineEntry(old) && old.id === refreshed.id) {
    return refreshed;
  }
  return old;
}

function toggleEntryReaction(entry: TimelineEntry, emoji: ReactionEmoji): TimelineEntry {
  return { ...entry, reactions: toggleReactionList(entry.reactions, emoji) };
}

/**
 * Pure toggle of one emoji on a reactions list — exported so apps
 * doing optimistic UI outside the React Query cache (e.g. against
 * `useTimeline`'s internal state) can reuse the same logic.
 */
export function toggleReactionList(
  reactions: readonly Reaction[] | undefined,
  emoji: ReactionEmoji
): readonly Reaction[] {
  const list = reactions ?? [];
  const existing = list.find((r) => r.emoji === emoji);
  if (!existing) {
    return [...list, { emoji, count: 1, hasReacted: true }];
  }
  if (existing.hasReacted) {
    const next: Reaction = { emoji, count: existing.count - 1, hasReacted: false };
    return next.count <= 0
      ? list.filter((r) => r.emoji !== emoji)
      : list.map((r) => (r.emoji === emoji ? next : r));
  }
  return list.map((r) => (r.emoji === emoji ? { emoji, count: r.count + 1, hasReacted: true } : r));
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
