import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the dashboards provider. */
export interface DashboardsConfig {
  readonly client?: AxiosInstance;
  /** Base path for dashboards endpoints (default: `/api/v1/dashboards`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedDashboardsConfig extends DashboardsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface DashboardsProviderProps {
  readonly config: DashboardsConfig;
  readonly children: ReactNode;
}

const DashboardsConfigContext = createContext<ResolvedDashboardsConfig | null>(null);

/** Provides dashboards configuration to child components and hooks. */
export function DashboardsProvider({ config, children }: Readonly<DashboardsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedDashboardsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'DashboardsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config.basePath ?? DEFAULT_BASE_PATH };
  }, [config, contextClient]);
  return <DashboardsConfigContext value={value}>{children}</DashboardsConfigContext>;
}

/** Returns the dashboards configuration from the nearest `DashboardsProvider`. */
export function useDashboardsConfig(): ResolvedDashboardsConfig {
  const ctx = useContext(DashboardsConfigContext);
  if (!ctx) {
    throw new Error('useDashboardsConfig must be used within a <DashboardsProvider>');
  }
  return ctx;
}
