import { listNotifications, markAllAsRead, markAsRead } from '@granit/notifications';
import { useInfiniteScroll as usePaginatedFetch } from '@granit/react-query-engine';
import { toISODateString } from '@granit/types';
import { useCallback } from 'react';

import { API_BASE_PATH } from '../constants';
import { useNotificationConfig } from '../providers/notification-provider';

import type { UserNotification, UserNotificationPage } from '@granit/notifications';

export interface UseNotificationsOptions {
  pageSize?: number;
}

export interface UseNotificationsReturn {
  notifications: readonly UserNotification[];
  totalCount: number | null;
  loading: boolean;
  loadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Paginated inbox hook — fetches notifications with load-more support.
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { pageSize = DEFAULT_PAGE_SIZE } = options;
  const { config, setUnreadCount } = useNotificationConfig();
  const basePath = config.basePath ?? API_BASE_PATH;

  const fetcher = useCallback(
    (p: number, ps: number) =>
      listNotifications(config.apiClient, basePath, { page: p, pageSize: ps }),
    [config.apiClient, basePath]
  );

  const {
    items: notifications,
    setItems: setNotifications,
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

  const markRead = useCallback(
    async (id: string) => {
      await markAsRead(config.apiClient, basePath, id);
      setNotifications((prev: readonly UserNotification[]) =>
        prev.map((n: UserNotification) =>
          n.id === id
            ? { ...n, state: 'Read' as const, readAt: toISODateString(new Date().toISOString()) }
            : n
        )
      );
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    },
    [config.apiClient, basePath, setUnreadCount, setNotifications]
  );

  const markAllRead = useCallback(async () => {
    await markAllAsRead(config.apiClient, basePath);
    setNotifications((prev: readonly UserNotification[]) =>
      prev.map((n: UserNotification) => ({
        ...n,
        state: 'Read' as const,
        readAt: toISODateString(new Date().toISOString()),
      }))
    );
    setUnreadCount(0);
  }, [config.apiClient, basePath, setUnreadCount, setNotifications]);

  return {
    notifications,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    markRead,
    markAllRead,
  };
}
