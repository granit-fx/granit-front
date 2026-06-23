import {
  registerPushSubscription,
  unregisterPushSubscription,
  urlBase64ToUint8Array,
} from '@granit/notifications-web-push';
import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '../logger';
import { useWebPushConfig } from '../providers/web-push-provider';

export interface UseWebPushReturn {
  /** Whether the browser supports Web Push. */
  readonly isSupported: boolean;
  /** Current permission state: 'default' | 'granted' | 'denied'. */
  readonly permission: NotificationPermission;
  /** Whether the user has an active push subscription on this browser. */
  readonly isSubscribed: boolean;
  /** Loading state during subscribe/unsubscribe. */
  readonly loading: boolean;
  /** Last error, if any. */
  readonly error: Error | null;
  /** Request permission and subscribe to Web Push. */
  subscribe: () => Promise<void>;
  /** Unsubscribe from Web Push. */
  unsubscribe: () => Promise<void>;
}

function isWebPushSupported(): boolean {
  return (
    'serviceWorker' in navigator && 'PushManager' in globalThis && 'Notification' in globalThis
  );
}

/**
 * Manages Web Push VAPID subscription lifecycle.
 *
 * Must be used within a {@link WebPushProvider}.
 *
 * This hook handles:
 * - Requesting notification permission
 * - Registering/unregistering the service worker push subscription
 * - Syncing the subscription with the backend REST API
 *
 * The service worker itself (displaying notifications, handling clicks)
 * is app-level code — this hook only manages the subscription.
 */
export function useWebPush(): UseWebPushReturn {
  const config = useWebPushConfig();
  const basePath = config.basePath;
  const swPath = config.serviceWorkerPath;

  const [permission, setPermission] = useState<NotificationPermission>(
    isWebPushSupported() ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const isSupported = isWebPushSupported();

  // Check existing subscription on mount
  useEffect(() => {
    mountedRef.current = true;

    if (!isSupported) return;

    navigator.serviceWorker
      .getRegistration(swPath)
      .then((registration) => registration?.pushManager.getSubscription())
      .then((sub) => {
        if (mountedRef.current) {
          setIsSubscribed(sub !== null);
        }
      })
      .catch(() => {
        // Non-critical — subscription state defaults to false.
      });

    return () => {
      mountedRef.current = false;
    };
  }, [isSupported, swPath]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    setLoading(true);
    setError(null);

    try {
      const perm = await Notification.requestPermission();
      if (mountedRef.current) setPermission(perm);

      if (perm !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const registration = await navigator.serviceWorker.register(swPath);
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey).buffer as ArrayBuffer,
      });

      await registerPushSubscription(config.apiClient, basePath, subscription.toJSON());

      logger.info('Web push subscription registered');
      if (mountedRef.current) {
        setIsSubscribed(true);
      }
    } catch (err) {
      logger.error('Web push subscribe failed', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isSupported, swPath, config.vapidPublicKey, config.apiClient, basePath]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration(swPath);
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await unregisterPushSubscription(config.apiClient, basePath, subscription.endpoint);
        await subscription.unsubscribe();
        logger.info('Web push subscription unregistered');
      }

      if (mountedRef.current) {
        setIsSubscribed(false);
      }
    } catch (err) {
      logger.error('Web push unsubscribe failed', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isSupported, swPath, config.apiClient, basePath]);

  return { isSupported, permission, isSubscribed, loading, error, subscribe, unsubscribe };
}
