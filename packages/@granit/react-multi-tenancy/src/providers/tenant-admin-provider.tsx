import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

export interface TenantAdminConfig {
  readonly client: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface TenantAdminProviderProps {
  readonly config: TenantAdminConfig;
  readonly children: ReactNode;
}

const DEFAULT_BASE_PATH = '/api/granit/admin';
const DEFAULT_KEY_PREFIX = ['tenant-admin'] as const;

const TenantAdminContext = createContext<TenantAdminConfig | null>(null);

export function useTenantAdminConfig(): TenantAdminConfig {
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
  const value = useMemo<TenantAdminConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
    }),
    [config]
  );

  return <TenantAdminContext value={value}>{children}</TenantAdminContext>;
}
