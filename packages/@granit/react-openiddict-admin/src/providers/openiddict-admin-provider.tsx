import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

export interface OpenIddictAdminConfig {
  readonly client: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface OpenIddictAdminProviderProps {
  readonly config: OpenIddictAdminConfig;
  readonly children: ReactNode;
}

const DEFAULT_BASE_PATH = '/api/admin';
const DEFAULT_KEY_PREFIX = ['openiddict-admin'] as const;

const AdminContext = createContext<OpenIddictAdminConfig | null>(null);

export function useAdminConfig(): OpenIddictAdminConfig {
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
  const value = useMemo<OpenIddictAdminConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
    }),
    [config]
  );

  return <AdminContext value={value}>{children}</AdminContext>;
}
