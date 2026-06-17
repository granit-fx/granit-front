import { PushNotifications } from '@capacitor/push-notifications';
import { createLogger } from '@granit/logger';
import { registerDeviceToken, unregisterDeviceToken } from '@granit/notifications-mobile-push';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useMobilePushConfig } from '../providers/mobile-push-provider';

import type { MobilePlatform } from '@granit/notifications-mobile-push';

const logger = createLogger('react-notifications-mobile-push');

/**
 * Returns a promise that resolves with the device token once Capacitor
 * fires the 'registration' event, or rejects on 'registrationError'.
 * Listeners are cleaned up automatically after the first event.
 */
function waitForRegistrationToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const regListener = PushNotifications.addListener('registration', (token) => {
      regListener.then((l) => l.remove());
      errListener.then((l) => l.remove());
      resolve(token.value);
    });

    const errListener = PushNotifications.addListener('registrationError', (err) => {
      regListener.then((l) => l.remove());
      errListener.then((l) => l.remove());
      reject(new Error(err.error));
    });
  });
}

export interface MobilePushHookOptions {
  readonly platform: MobilePlatform;
}

export interface UseMobilePushReturn {
  /** Whether the device token has been registered with the backend. */
  readonly isRegistered: boolean;
  /** Loading state during register/unregister. */
  readonly loading: boolean;
  /** Last error, if any. */
  readonly error: Error | null;
  /** Request permission and register the device token. */
  register: () => Promise<void>;
  /** Unregister the current device token. */
  unregister: () => Promise<void>;
}

/**
 * Manages FCM/APNs device token registration for Capacitor apps.
 *
 * Must be used within a {@link MobilePushProvider}.
 *
 * This hook handles:
 * - Requesting push notification permissions via Capacitor
 * - Capturing the FCM/APNs token from the native layer
 * - Registering/unregistering the token with the backend REST API
 * - Handling token refresh events
 *
 * Push payload display is handled by the native OS — the backend sends
 * wake-up only payloads (no PII in push payload, ISO 27001 compliant).
 */
export function useMobilePush(options: MobilePushHookOptions): UseMobilePushReturn {
  const { client: apiClient, basePath } = useMobilePushConfig();

  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const tokenRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for token refresh events while registered
  useEffect(() => {
    if (!isRegistered) return;

    const listener = PushNotifications.addListener('registration', async (token) => {
      const oldToken = tokenRef.current;
      tokenRef.current = token.value;

      try {
        if (oldToken) {
          await unregisterDeviceToken(apiClient, basePath, oldToken);
        }
        await registerDeviceToken(apiClient, basePath, {
          token: token.value,
          platform: options.platform,
        });
        logger.info('Mobile push device token refreshed', { platform: options.platform });
      } catch (err) {
        logger.error('Mobile push token refresh sync failed', err, {
          platform: options.platform,
        });
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [isRegistered, apiClient, basePath, options.platform]);

  const register = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      const tokenPromise = waitForRegistrationToken();
      await PushNotifications.register();
      const token = await tokenPromise;
      tokenRef.current = token;

      await registerDeviceToken(apiClient, basePath, {
        token,
        platform: options.platform,
      });

      logger.info('Mobile push device token registered', { platform: options.platform });
      if (mountedRef.current) {
        setIsRegistered(true);
      }
    } catch (err) {
      logger.error('Mobile push register failed', err, { platform: options.platform });
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiClient, basePath, options.platform]);

  const unregister = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (tokenRef.current) {
        await unregisterDeviceToken(apiClient, basePath, tokenRef.current);
        tokenRef.current = null;
        logger.info('Mobile push device token unregistered');
      }

      if (mountedRef.current) {
        setIsRegistered(false);
      }
    } catch (err) {
      logger.error('Mobile push unregister failed', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiClient, basePath]);

  return { isRegistered, loading, error, register, unregister };
}
