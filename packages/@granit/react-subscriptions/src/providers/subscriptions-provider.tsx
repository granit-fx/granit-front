import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the subscriptions provider. */
export interface SubscriptionsConfig {
  readonly client?: AxiosInstance;
  /** Base path for subscriptions endpoints (default: `/api/v1/subscriptions`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedSubscriptionsConfig extends SubscriptionsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface SubscriptionsProviderProps {
  readonly config: SubscriptionsConfig;
  readonly children: ReactNode;
}

const SubscriptionsConfigContext = createContext<ResolvedSubscriptionsConfig | null>(null);

/** Provides subscriptions configuration to child components and hooks. */
export function SubscriptionsProvider({ config, children }: Readonly<SubscriptionsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedSubscriptionsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'SubscriptionsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config.basePath ?? DEFAULT_BASE_PATH };
  }, [config, contextClient]);
  return <SubscriptionsConfigContext value={value}>{children}</SubscriptionsConfigContext>;
}

/** Returns the subscriptions configuration from the nearest `SubscriptionsProvider`. */
export function useSubscriptionsConfig(): ResolvedSubscriptionsConfig {
  const ctx = useContext(SubscriptionsConfigContext);
  if (!ctx) {
    throw new Error('useSubscriptionsConfig must be used within a SubscriptionsProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for subscriptions operations. */
export function buildSubscriptionsQueryKey(
  config: SubscriptionsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['subscriptions'];
  return [...prefix, ...segments];
}
