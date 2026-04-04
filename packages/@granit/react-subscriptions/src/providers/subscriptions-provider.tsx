import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the subscriptions provider. */
export interface SubscriptionsConfig {
  readonly client: AxiosInstance;
  /** Base path for subscriptions endpoints (default: `/api/granit/subscriptions`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface SubscriptionsProviderProps {
  readonly config: SubscriptionsConfig;
  readonly children: ReactNode;
}

const SubscriptionsConfigContext = createContext<SubscriptionsConfig | null>(null);

/** Provides subscriptions configuration to child components and hooks. */
export function SubscriptionsProvider({ config, children }: Readonly<SubscriptionsProviderProps>) {
  const value = useMemo(() => config, [config]);
  return <SubscriptionsConfigContext value={value}>{children}</SubscriptionsConfigContext>;
}

/** Returns the subscriptions configuration from the nearest `SubscriptionsProvider`. */
export function useSubscriptionsConfig(): SubscriptionsConfig {
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
