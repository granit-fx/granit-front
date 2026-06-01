import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the background jobs provider. */
export interface BackgroundJobsConfig {
  readonly client?: AxiosInstance;
  /** Base path for background-jobs endpoints (default: `/api/v1/background-jobs`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * BackgroundJobsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedBackgroundJobsConfig extends BackgroundJobsConfig {
  readonly client: AxiosInstance;
}

export interface BackgroundJobsProviderProps {
  readonly config: BackgroundJobsConfig;
  readonly children: ReactNode;
}

const BackgroundJobsConfigContext = createContext<ResolvedBackgroundJobsConfig | null>(null);

/** Provides background jobs configuration to child components and hooks. */
export function BackgroundJobsProvider({
  config,
  children,
}: Readonly<BackgroundJobsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedBackgroundJobsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'BackgroundJobsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <BackgroundJobsConfigContext value={value}>{children}</BackgroundJobsConfigContext>;
}

/** Returns the background jobs configuration from the nearest `BackgroundJobsProvider`. */
export function useBackgroundJobsConfig(): ResolvedBackgroundJobsConfig {
  const ctx = useContext(BackgroundJobsConfigContext);
  if (!ctx) {
    throw new Error('useBackgroundJobsConfig must be used within a BackgroundJobsProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for background jobs operations. */
export function buildBackgroundJobsQueryKey(
  config: BackgroundJobsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['background-jobs'];
  return [...prefix, ...segments];
}
