import { getEntityActivityFeed } from '@granit/notifications';
import { useCallback } from 'react';

import { API_BASE_PATH } from '../constants.js';
import { useNotificationConfig } from '../providers/notification-provider.js';

import { usePaginatedFetch } from './use-paginated-fetch.js';

import type { ActivityFeedEntry, ActivityFeedPage } from '@granit/notifications';

export interface UseEntityActivityFeedOptions {
  entityType: string;
  entityId: string;
  pageSize?: number;
}

export interface UseEntityActivityFeedReturn {
  entries: readonly ActivityFeedEntry[];
  totalCount: number | null;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Per-entity activity feed.
 */
export function useEntityActivityFeed(
  options: UseEntityActivityFeedOptions
): UseEntityActivityFeedReturn {
  const { entityType, entityId, pageSize = DEFAULT_PAGE_SIZE } = options;
  const { config } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;

  const fetcher = useCallback(
    (page: number, ps: number) =>
      getEntityActivityFeed(config.apiClient, basePath, entityType, entityId, {
        page,
        pageSize: ps,
      }),
    [config.apiClient, basePath, entityType, entityId]
  );

  const {
    items: entries,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedFetch<ActivityFeedEntry, ActivityFeedPage>({
    fetcher,
    pageSize,
  });

  return {
    entries,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
