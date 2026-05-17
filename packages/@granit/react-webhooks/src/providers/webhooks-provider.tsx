import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_WEBHOOKS_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the webhooks provider. */
export interface WebhooksConfig {
  readonly client?: AxiosInstance;
  /**
   * Base path for webhooks endpoints (default: `/api/v1/webhooks`).
   *
   * The subscription resource lives at `${basePath}/subscriptions`; deliveries,
   * event types, config and stats live directly under `${basePath}`.
   */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedWebhooksConfig extends WebhooksConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface WebhooksProviderProps {
  readonly config: WebhooksConfig;
  readonly children: ReactNode;
}

const WebhooksConfigContext = createContext<ResolvedWebhooksConfig | null>(null);

/** Provides webhooks configuration to child components and hooks. */
export function WebhooksProvider({ config, children }: Readonly<WebhooksProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedWebhooksConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'WebhooksProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config.basePath ?? DEFAULT_WEBHOOKS_BASE_PATH };
  }, [config, contextClient]);
  return <WebhooksConfigContext value={value}>{children}</WebhooksConfigContext>;
}

/** Returns the webhooks configuration from the nearest `WebhooksProvider`. */
export function useWebhooksConfig(): ResolvedWebhooksConfig {
  const ctx = useContext(WebhooksConfigContext);
  if (!ctx) {
    throw new Error('useWebhooksConfig must be used within a <WebhooksProvider>');
  }
  return ctx;
}
