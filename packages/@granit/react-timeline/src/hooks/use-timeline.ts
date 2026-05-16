import { useInfiniteScroll } from '@granit/react-query-engine';
import { getStream } from '@granit/timeline';
import { useCallback, useState } from 'react';

import { useTimelineConfig } from '../providers/timeline-provider.js';

import type { TimelineEntry, TimelineEntryPage, TimelineStreamPage } from '@granit/timeline';

const DEFAULT_PAGE_SIZE = 20;

export interface UseTimelineOptions {
  entityType: string;
  entityId: string;
  pageSize?: number;
}

export interface UseTimelineReturn {
  entries: readonly TimelineEntry[];
  totalCount: number | null;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  addOptimisticEntry: (entry: TimelineEntry) => void;
  removeOptimisticEntry: (entryId: string) => void;
  /**
   * Patch one entry in place. The `updater` receives the matching
   * entry and must return its replacement (return the input to skip).
   * Entries with non-matching ids pass through untouched. Useful for
   * surgical updates (reaction toggles, edits) that should not trigger
   * a full stream refresh.
   */
  patchEntry: (entryId: string, updater: (entry: TimelineEntry) => TimelineEntry) => void;
  /**
   * Source keys reported degraded by the latest stream fetch. Empty
   * unless one or more registered `ITimelineSource` contributors timed
   * out or threw under the `DegradeGracefully` policy on the backend.
   * Hosts typically render a "partial data" banner when this is
   * non-empty.
   */
  degradedSources: readonly string[];
}

/**
 * Infinite-scroll timeline hook.
 *
 * Composes {@link useInfiniteScroll} from `@granit/query-engine` with
 * domain-specific optimistic update helpers.
 */
export function useTimeline({
  entityType,
  entityId,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseTimelineOptions): UseTimelineReturn {
  const { client, basePath } = useTimelineConfig();
  const [degradedSources, setDegradedSources] = useState<readonly string[]>([]);

  const fetcher = useCallback(
    async (page: number, ps: number): Promise<TimelineEntryPage> => {
      const result: TimelineStreamPage = await getStream(client, basePath, entityType, entityId, {
        page,
        pageSize: ps,
      });
      // Latest call wins — degraded set reflects the most recent stream
      // response, not the union across pagination. Empty array reset on
      // a healthy page so the host can clear its banner.
      setDegradedSources(result.degradedSources);
      return result.page;
    },
    [client, basePath, entityType, entityId]
  );

  const {
    items: entries,
    setItems: setEntries,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteScroll<TimelineEntry>({ fetcher, pageSize });

  const addOptimisticEntry = useCallback(
    (entry: TimelineEntry) => {
      setEntries((prev) => [entry, ...prev]);
    },
    [setEntries]
  );

  const removeOptimisticEntry = useCallback(
    (entryId: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    },
    [setEntries]
  );

  const patchEntry = useCallback(
    (entryId: string, updater: (entry: TimelineEntry) => TimelineEntry) => {
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updater(e) : e)));
    },
    [setEntries]
  );

  return {
    entries,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    addOptimisticEntry,
    removeOptimisticEntry,
    patchEntry,
    degradedSources,
  };
}
