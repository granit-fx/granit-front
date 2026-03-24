import { useInfiniteScroll } from '@granit/react-query-engine';
import { fetchStream } from '@granit/timeline';
import { useCallback } from 'react';

import { useTimelineConfig } from '../providers/timeline-provider.js';

import type { TimelineEntry } from '@granit/timeline';

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
  const { apiClient, basePath } = useTimelineConfig();

  const fetcher = useCallback(
    (page: number, ps: number) =>
      fetchStream(apiClient, basePath, entityType, entityId, { page, pageSize: ps }),
    [apiClient, basePath, entityType, entityId]
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
  };
}
