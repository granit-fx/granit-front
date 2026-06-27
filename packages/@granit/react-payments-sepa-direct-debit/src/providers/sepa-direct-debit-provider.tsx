import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the SEPA Direct Debit provider. */
export interface SepaDirectDebitConfig extends GranitProviderConfig {
  /** Base path for SEPA Direct Debit endpoints (default: `/api/v1/sepa-direct-debit`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SepaDirectDebitConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export type ResolvedSepaDirectDebitConfig = ResolvedGranitProviderConfig<SepaDirectDebitConfig>;

export type SepaDirectDebitProviderProps = GranitProviderProps<SepaDirectDebitConfig>;

const { Provider, useConfig } = createConfigProvider<SepaDirectDebitConfig>({
  name: 'SepaDirectDebit',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides SEPA Direct Debit configuration to child components and hooks. */
export const SepaDirectDebitProvider = Provider;

/** Returns the SEPA Direct Debit configuration from the nearest `SepaDirectDebitProvider`. */
export const useSepaDirectDebitConfig = useConfig;

/** Builds a consistent React Query key for SEPA Direct Debit operations. */
export function buildSepaDirectDebitQueryKey(
  config: SepaDirectDebitConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['sepa-direct-debit'];
  return [...prefix, ...segments];
}
