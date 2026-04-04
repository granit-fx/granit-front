import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the features provider. */
export interface FeaturesConfig {
  readonly client: AxiosInstance;
  /** Base path for features endpoints (default: `/api/granit/features`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface FeaturesProviderProps {
  readonly config: FeaturesConfig;
  readonly children: ReactNode;
}

const FeaturesConfigContext = createContext<FeaturesConfig | null>(null);

/** Provides features configuration to child components and hooks. */
export function FeaturesProvider({ config, children }: Readonly<FeaturesProviderProps>) {
  const value = useMemo(() => config, [config]);
  return <FeaturesConfigContext value={value}>{children}</FeaturesConfigContext>;
}

/** Returns the features configuration from the nearest `FeaturesProvider`. */
export function useFeaturesConfig(): FeaturesConfig {
  const ctx = useContext(FeaturesConfigContext);
  if (!ctx) {
    throw new Error('useFeaturesConfig must be used within a FeaturesProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for features operations. */
export function buildFeaturesQueryKey(
  config: FeaturesConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['features'];
  return [...prefix, ...segments];
}
