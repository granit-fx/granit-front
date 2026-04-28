import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface OpenIddictAdminConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * OpenIddictAdminConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedOpenIddictAdminConfig extends OpenIddictAdminConfig {
  readonly client: AxiosInstance;
}

export interface OpenIddictAdminProviderProps {
  readonly config: OpenIddictAdminConfig;
  readonly children: ReactNode;
}

const DEFAULT_KEY_PREFIX = ['openiddict-admin'] as const;

const AdminContext = createContext<ResolvedOpenIddictAdminConfig | null>(null);

export function useAdminConfig(): ResolvedOpenIddictAdminConfig {
  const config = useContext(AdminContext);
  if (!config) throw new Error('useAdminConfig must be used within an OpenIddictAdminProvider');
  return config;
}

export function buildAdminQueryKey(
  config: OpenIddictAdminConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}

export function OpenIddictAdminProvider({ config, children }: OpenIddictAdminProviderProps) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'OpenIddictAdminProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
      client,
    };
  }, [config, contextClient]);

  return <AdminContext value={value}>{children}</AdminContext>;
}
