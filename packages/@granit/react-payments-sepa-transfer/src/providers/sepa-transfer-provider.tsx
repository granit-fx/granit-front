import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the SEPA transfer provider. */
export interface SepaTransferConfig extends GranitProviderConfig {
  /** Base path for SEPA transfer endpoints (default: `/api/v1/sepa-transfer`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SepaTransferConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export type ResolvedSepaTransferConfig = ResolvedGranitProviderConfig<SepaTransferConfig>;

export type SepaTransferProviderProps = GranitProviderProps<SepaTransferConfig>;

const { Provider, useConfig } = createConfigProvider<SepaTransferConfig>({
  name: 'SepaTransfer',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides SEPA transfer configuration to child components and hooks. */
export const SepaTransferProvider = Provider;

/** Returns the SEPA transfer configuration from the nearest `SepaTransferProvider`. */
export const useSepaTransferConfig = useConfig;

/** Builds a consistent React Query key for SEPA transfer operations. */
export function buildSepaTransferQueryKey(
  config: SepaTransferConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['sepa-transfer'];
  return [...prefix, ...segments];
}
