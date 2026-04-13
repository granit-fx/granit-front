import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the metering provider. */
export interface MeteringConfig {
  readonly client: AxiosInstance;
  /** Base path for metering endpoints (default: `/api/v1/metering`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface MeteringProviderProps {
  readonly config: MeteringConfig;
  readonly children: ReactNode;
}

const MeteringConfigContext = createContext<MeteringConfig | null>(null);

/** Provides metering configuration to child components and hooks. */
export function MeteringProvider({ config, children }: Readonly<MeteringProviderProps>) {
  const value = useMemo(() => ({
    ...config,
    basePath: config.basePath ?? DEFAULT_BASE_PATH,
  }), [config]);
  return <MeteringConfigContext value={value}>{children}</MeteringConfigContext>;
}

/** Returns the metering configuration from the nearest `MeteringProvider`. */
export function useMeteringConfig(): MeteringConfig {
  const ctx = useContext(MeteringConfigContext);
  if (!ctx) {
    throw new Error('useMeteringConfig must be used within a MeteringProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for metering operations. */
export function buildMeteringQueryKey(
  config: MeteringConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['metering'];
  return [...prefix, ...segments];
}
