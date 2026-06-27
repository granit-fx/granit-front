import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the bank accounts provider. */
export interface BankAccountsConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * BankAccountsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export type ResolvedBankAccountsConfig = ResolvedGranitProviderConfig<BankAccountsConfig>;

export type BankAccountsProviderProps = GranitProviderProps<BankAccountsConfig>;

const { Provider, useConfig } = createConfigProvider<BankAccountsConfig>({
  name: 'BankAccounts',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides bank accounts configuration to child components and hooks. */
export const BankAccountsProvider = Provider;

/** Returns the bank accounts configuration from the nearest `BankAccountsProvider`. */
export const useBankAccountsConfig = useConfig;

/** Builds a consistent React Query key for bank account operations. */
export function buildBankAccountsQueryKey(
  config: BankAccountsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['bank-accounts'];
  return [...prefix, ...segments];
}
