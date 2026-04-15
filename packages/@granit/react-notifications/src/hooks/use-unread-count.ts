import { getUnreadCount } from '@granit/notifications';
import { useCallback, useEffect, useRef } from 'react';

import { API_BASE_PATH } from '../constants.js';
import { useNotificationConfig } from '../providers/notification-provider.js';

export interface UseUnreadCountOptions {
  /** Polling interval in ms. Set to 0 to disable polling. Default: 60 000 */
  pollingInterval?: number;
}

export interface UseUnreadCountReturn {
  count: number;
  refresh: () => void;
}

/**
 * Returns the current unread notification count.
 *
 * Kept in sync via:
 * 1. Real-time transport push (increments automatically on ReceiveNotification)
 * 2. Periodic polling as a fallback (default 60 s)
 * 3. Manual `refresh()` call
 */
export function useUnreadCount(options: UseUnreadCountOptions = {}): UseUnreadCountReturn {
  const { pollingInterval = 60_000 } = options;
  const { config, unreadCount, setUnreadCount } = useNotificationConfig();
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const count = await getUnreadCount(config.apiClient, config.basePath ?? API_BASE_PATH);
      if (mountedRef.current) {
        setUnreadCount(count);
      }
    } catch {
      // Polling failures are non-critical — skip silently.
    }
  }, [config.apiClient, config.basePath, setUnreadCount]);

  // Initial fetch + polling
  useEffect(() => {
    mountedRef.current = true;
    refresh();

    if (pollingInterval <= 0) return;

    const id = setInterval(() => {
      refresh();
    }, pollingInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [refresh, pollingInterval]);

  return { count: unreadCount, refresh };
}
