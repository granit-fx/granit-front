import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the background jobs provider. */
export interface BackgroundJobsConfig {
  readonly client: AxiosInstance;
  /** Base path for background-jobs endpoints (default: `/api/v1/background-jobs`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface BackgroundJobsProviderProps {
  readonly config: BackgroundJobsConfig;
  readonly children: ReactNode;
}

const BackgroundJobsConfigContext = createContext<BackgroundJobsConfig | null>(null);

/** Provides background jobs configuration to child components and hooks. */
export function BackgroundJobsProvider({ config, children }: Readonly<BackgroundJobsProviderProps>) {
  const value = useMemo(() => ({
    ...config,
    basePath: config.basePath ?? DEFAULT_BASE_PATH,
  }), [config]);
  return <BackgroundJobsConfigContext value={value}>{children}</BackgroundJobsConfigContext>;
}

/** Returns the background jobs configuration from the nearest `BackgroundJobsProvider`. */
export function useBackgroundJobsConfig(): BackgroundJobsConfig {
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
