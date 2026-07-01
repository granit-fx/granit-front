import { getEntityActivityFeed } from '@granit/notifications';
import { useInfiniteScroll as usePaginatedFetch } from '@granit/react-query-engine';
import { useCallback } from 'react';

import { API_BASE_PATH } from '../constants';
import { useNotificationConfig } from '../providers/notifications-provider';

import type { UserNotification, UserNotificationPage } from '@granit/notifications';

export interface UseEntityActivityFeedOptions {
  entityType: string;
  entityId: string;
  pageSize?: number;
}

export interface UseEntityActivityFeedReturn {
  entries: readonly UserNotification[];
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
 * Per-entity activity feed — returns the same `UserNotification` shape as the inbox.
 * Render title/body from `entry.data` (e.g. `(entry.data as { title?: string }).title`).
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
  } = usePaginatedFetch<UserNotification, UserNotificationPage>({
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
