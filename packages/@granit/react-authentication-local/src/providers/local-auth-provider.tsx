import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

export interface LocalAuthConfig {
  /**
   * Axios instance for API calls.
   * Must have `withCredentials: true` — the login endpoint sets an
   * ASP.NET Core Identity session cookie (not a token).
   */
  readonly client: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface LocalAuthProviderProps {
  readonly config: LocalAuthConfig;
  readonly children: ReactNode;
}

const DEFAULT_BASE_PATH = '/api/account';
const DEFAULT_KEY_PREFIX = ['authentication-local'] as const;

const LocalAuthContext = createContext<LocalAuthConfig | null>(null);

export function useLocalAuthConfig(): LocalAuthConfig {
  const config = useContext(LocalAuthContext);
  if (!config) throw new Error('useLocalAuthConfig must be used within a LocalAuthProvider');
  return config;
}

export function buildLocalAuthQueryKey(
  config: LocalAuthConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}

export function LocalAuthProvider({ config, children }: LocalAuthProviderProps) {
  const value = useMemo<LocalAuthConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
    }),
    [config]
  );

  return <LocalAuthContext value={value}>{children}</LocalAuthContext>;
}
