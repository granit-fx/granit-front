import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the scheduling provider. */
export interface SchedulingConfig {
  readonly client: AxiosInstance;
  /** Base path for scheduling endpoints (default: `/api/v1/scheduling`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface SchedulingProviderProps {
  readonly config: SchedulingConfig;
  readonly children: ReactNode;
}

const SchedulingConfigContext = createContext<SchedulingConfig | null>(null);

/** Provides scheduling configuration to child components and hooks. */
export function SchedulingProvider({ config, children }: Readonly<SchedulingProviderProps>) {
  const value = useMemo(() => ({
    ...config,
    basePath: config.basePath ?? DEFAULT_BASE_PATH,
  }), [config]);
  return <SchedulingConfigContext value={value}>{children}</SchedulingConfigContext>;
}

/** Returns the scheduling configuration from the nearest `SchedulingProvider`. */
export function useSchedulingConfig(): SchedulingConfig {
  const ctx = useContext(SchedulingConfigContext);
  if (!ctx) {
    throw new Error('useSchedulingConfig must be used within a SchedulingProvider');
  }
  return ctx;
}
