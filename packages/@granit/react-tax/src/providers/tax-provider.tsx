import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the tax provider. */
export interface TaxConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * TaxConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedTaxConfig = ResolvedGranitProviderConfig<TaxConfig>;

export type TaxProviderProps = GranitProviderProps<TaxConfig>;

const { Provider, useConfig } = createConfigProvider<TaxConfig>({
  name: 'Tax',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides tax configuration to child components and hooks. */
export const TaxProvider = Provider;

/** Returns the tax configuration from the nearest `TaxProvider`. */
export const useTaxConfig = useConfig;

/** Builds a consistent React Query key for tax operations. */
export function buildTaxQueryKey(
  config: TaxConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['tax'];
  return [...prefix, ...segments];
}
