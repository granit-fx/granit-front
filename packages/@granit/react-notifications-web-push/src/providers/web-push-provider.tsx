import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Resolved configuration exposed by {@link useWebPushConfig}. */
export interface WebPushProviderConfig {
  /** VAPID public key (URL-safe Base64). */
  readonly vapidPublicKey: string;
  readonly apiClient: AxiosInstance;
  readonly basePath: string;
  /** Path to the service worker. Default: '/sw.js'. */
  readonly serviceWorkerPath: string;
}

/**
 * Props accepted by {@link WebPushProvider}. `apiClient`, `basePath`, and
 * `serviceWorkerPath` are optional — the provider falls back to the nearest
 * `<GranitClientProvider>` for `apiClient` and applies defaults otherwise.
 */
export interface WebPushProviderProps {
  readonly config: Omit<WebPushProviderConfig, 'apiClient' | 'basePath' | 'serviceWorkerPath'> &
    Partial<Pick<WebPushProviderConfig, 'apiClient' | 'basePath' | 'serviceWorkerPath'>>;
  readonly children: ReactNode;
}

const WebPushConfigContext = createContext<WebPushProviderConfig | null>(null);

const DEFAULT_SERVICE_WORKER_PATH = '/sw.js';

/** Provides web push configuration to child components and hooks. */
export function WebPushProvider({ config, children }: Readonly<WebPushProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<WebPushProviderConfig>(() => {
    const apiClient = config.apiClient ?? contextClient;
    if (!apiClient) {
      throw new Error(
        'WebPushProvider requires an Axios client. Provide it via config.apiClient or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      apiClient,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      serviceWorkerPath: config.serviceWorkerPath ?? DEFAULT_SERVICE_WORKER_PATH,
    };
  }, [config, contextClient]);
  return <WebPushConfigContext value={value}>{children}</WebPushConfigContext>;
}

/** Returns the web push configuration from the nearest {@link WebPushProvider}. */
export function useWebPushConfig(): WebPushProviderConfig {
  const ctx = useContext(WebPushConfigContext);
  if (!ctx) {
    throw new Error('useWebPushConfig must be used within a WebPushProvider');
  }
  return ctx;
}
