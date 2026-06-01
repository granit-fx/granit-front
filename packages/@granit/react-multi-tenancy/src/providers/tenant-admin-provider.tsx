import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface TenantAdminConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * TenantAdminConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedTenantAdminConfig extends TenantAdminConfig {
  readonly client: AxiosInstance;
}

export interface TenantAdminProviderProps {
  readonly config: TenantAdminConfig;
  readonly children: ReactNode;
}

const DEFAULT_KEY_PREFIX = ['tenant-admin'] as const;

const TenantAdminContext = createContext<ResolvedTenantAdminConfig | null>(null);

export function useTenantAdminConfig(): ResolvedTenantAdminConfig {
  const config = useContext(TenantAdminContext);
  if (!config) throw new Error('useTenantAdminConfig must be used within a TenantAdminProvider');
  return config;
}

export function buildTenantAdminQueryKey(
  config: TenantAdminConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}

export function TenantAdminProvider({ config, children }: TenantAdminProviderProps) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'TenantAdminProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
      client,
    };
  }, [config, contextClient]);

  return <TenantAdminContext value={value}>{children}</TenantAdminContext>;
}
