import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the parties provider. */
export interface PartiesConfig {
  readonly client: AxiosInstance;
  /** Base path for parties endpoints (default: `/api/v1/parties`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface PartiesProviderProps {
  readonly config: PartiesConfig;
  readonly children: ReactNode;
}

const PartiesConfigContext = createContext<PartiesConfig | null>(null);

/** Provides parties configuration to child components and hooks. */
export function PartiesProvider({ config, children }: Readonly<PartiesProviderProps>) {
  const value = useMemo(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
    }),
    [config]
  );
  return <PartiesConfigContext value={value}>{children}</PartiesConfigContext>;
}

/** Returns the parties configuration from the nearest `PartiesProvider`. */
export function usePartiesConfig(): PartiesConfig {
  const ctx = useContext(PartiesConfigContext);
  if (!ctx) {
    throw new Error('usePartiesConfig must be used within a PartiesProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for parties operations. */
export function buildPartiesQueryKey(
  config: PartiesConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['parties'];
  return [...prefix, ...segments];
}
