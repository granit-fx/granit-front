import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the scheduling provider. */
export interface SchedulingConfig {
  readonly client?: AxiosInstance;
  /** Base path for scheduling endpoints (default: `/api/v1/scheduling`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SchedulingConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedSchedulingConfig extends SchedulingConfig {
  readonly client: AxiosInstance;
}

export interface SchedulingProviderProps {
  readonly config: SchedulingConfig;
  readonly children: ReactNode;
}

const SchedulingConfigContext = createContext<ResolvedSchedulingConfig | null>(null);

/** Provides scheduling configuration to child components and hooks. */
export function SchedulingProvider({ config, children }: Readonly<SchedulingProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedSchedulingConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'SchedulingProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <SchedulingConfigContext value={value}>{children}</SchedulingConfigContext>;
}

/** Returns the scheduling configuration from the nearest `SchedulingProvider`. */
export function useSchedulingConfig(): ResolvedSchedulingConfig {
  const ctx = useContext(SchedulingConfigContext);
  if (!ctx) {
    throw new Error('useSchedulingConfig must be used within a SchedulingProvider');
  }
  return ctx;
}
