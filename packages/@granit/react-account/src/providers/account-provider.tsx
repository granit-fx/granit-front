import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface AccountConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * AccountConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedAccountConfig extends AccountConfig {
  readonly client: AxiosInstance;
}

export interface AccountProviderProps {
  readonly config: AccountConfig;
  readonly children: ReactNode;
}

const DEFAULT_KEY_PREFIX = ['account'] as const;

const AccountContext = createContext<ResolvedAccountConfig | null>(null);

export function useAccountConfig(): ResolvedAccountConfig {
  const config = useContext(AccountContext);
  if (!config) throw new Error('useAccountConfig must be used within an AccountProvider');
  return config;
}

export function buildAccountQueryKey(
  config: AccountConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}

export function AccountProvider({ config, children }: AccountProviderProps) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'AccountProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
      client,
    };
  }, [config, contextClient]);

  return <AccountContext value={value}>{children}</AccountContext>;
}
