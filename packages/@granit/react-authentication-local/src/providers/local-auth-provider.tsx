import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface LocalAuthConfig {
  /**
   * Axios instance for API calls.
   * Must have `withCredentials: true` — the login endpoint sets an
   * ASP.NET Core Identity session cookie (not a token).
   */
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * LocalAuthConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedLocalAuthConfig extends LocalAuthConfig {
  readonly client: AxiosInstance;
}

export interface LocalAuthProviderProps {
  readonly config: LocalAuthConfig;
  readonly children: ReactNode;
}

const DEFAULT_KEY_PREFIX = ['authentication-local'] as const;

const LocalAuthContext = createContext<ResolvedLocalAuthConfig | null>(null);

export function useLocalAuthConfig(): ResolvedLocalAuthConfig {
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
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'LocalAuthProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
      client,
    };
  }, [config, contextClient]);

  return <LocalAuthContext value={value}>{children}</LocalAuthContext>;
}
