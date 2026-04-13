import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

/** Configuration for the subscriptions provider. */
export interface SubscriptionsConfig {
  readonly client: AxiosInstance;
  /** Base path for subscriptions endpoints (default: `/api/v1/subscriptions`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedSubscriptionsConfig extends SubscriptionsConfig {
  readonly basePath: string;
}

export interface SubscriptionsProviderProps {
  readonly config: SubscriptionsConfig;
  readonly children: ReactNode;
}

const SubscriptionsConfigContext = createContext<ResolvedSubscriptionsConfig | null>(null);

/** Provides subscriptions configuration to child components and hooks. */
export function SubscriptionsProvider({ config, children }: Readonly<SubscriptionsProviderProps>) {
  const value = useMemo<ResolvedSubscriptionsConfig>(
    () => ({ ...config, basePath: config.basePath ?? DEFAULT_BASE_PATH }),
    [config],
  );
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
