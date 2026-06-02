import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the hostnames provider. */
export interface HostnamesConfig {
  readonly client?: AxiosInstance;
  /** Base path for hostnames endpoints (default: `/api/hostnames`). */
  readonly basePath?: string;
}

/** Resolved configuration where all optional fields have defaults applied. */
export interface ResolvedHostnamesConfig extends HostnamesConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface HostnamesProviderProps {
  readonly config: HostnamesConfig;
  readonly children: ReactNode;
}

const HostnamesConfigContext = createContext<ResolvedHostnamesConfig | null>(null);

/** Provides hostnames configuration to child components and hooks. */
export function HostnamesProvider({ config, children }: Readonly<HostnamesProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedHostnamesConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'HostnamesProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config.basePath ?? DEFAULT_BASE_PATH };
  }, [config, contextClient]);
  return <HostnamesConfigContext value={value}>{children}</HostnamesConfigContext>;
}

/** Returns the hostnames configuration from the nearest `HostnamesProvider`. */
export function useHostnamesConfig(): ResolvedHostnamesConfig {
  const ctx = useContext(HostnamesConfigContext);
  if (!ctx) {
    throw new Error('useHostnamesConfig must be used within a <HostnamesProvider>');
  }
  return ctx;
}
