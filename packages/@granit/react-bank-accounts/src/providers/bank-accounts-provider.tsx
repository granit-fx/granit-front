import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the bank accounts provider. */
export interface BankAccountsConfig {
  readonly client?: AxiosInstance;
  /** Base path for bank account endpoints (default: `/api/v1/bank-accounts`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * BankAccountsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export interface ResolvedBankAccountsConfig extends BankAccountsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface BankAccountsProviderProps {
  readonly config: BankAccountsConfig;
  readonly children: ReactNode;
}

const BankAccountsConfigContext = createContext<ResolvedBankAccountsConfig | null>(null);

/** Provides bank accounts configuration to child components and hooks. */
export function BankAccountsProvider({ config, children }: Readonly<BankAccountsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedBankAccountsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'BankAccountsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <BankAccountsConfigContext value={value}>{children}</BankAccountsConfigContext>;
}

/** Returns the bank accounts configuration from the nearest `BankAccountsProvider`. */
export function useBankAccountsConfig(): ResolvedBankAccountsConfig {
  const ctx = useContext(BankAccountsConfigContext);
  if (!ctx) {
    throw new Error('useBankAccountsConfig must be used within a BankAccountsProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for bank account operations. */
export function buildBankAccountsQueryKey(
  config: BankAccountsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['bank-accounts'];
  return [...prefix, ...segments];
}
