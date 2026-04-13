import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

export interface AccountConfig {
  readonly client: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface AccountProviderProps {
  readonly config: AccountConfig;
  readonly children: ReactNode;
}

const DEFAULT_BASE_PATH = '/account';
const DEFAULT_KEY_PREFIX = ['account'] as const;

const AccountContext = createContext<AccountConfig | null>(null);

export function useAccountConfig(): AccountConfig {
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
  const value = useMemo<AccountConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
    }),
    [config]
  );

  return <AccountContext value={value}>{children}</AccountContext>;
}
