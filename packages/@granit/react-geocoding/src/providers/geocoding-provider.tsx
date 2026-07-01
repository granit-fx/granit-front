import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the geocoding provider. */
export interface GeocodingConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * {@link GeocodingConfig} after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export type ResolvedGeocodingConfig = ResolvedGranitProviderConfig<GeocodingConfig>;

export type GeocodingProviderProps = GranitProviderProps<GeocodingConfig>;

const { Provider, useConfig, useOptionalConfig } = createConfigProvider<GeocodingConfig>({
  name: 'Geocoding',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides geocoding configuration to child components and hooks. */
export const GeocodingProvider = Provider;

/** Returns the geocoding configuration from the nearest `GeocodingProvider`. */
export const useGeocodingConfig = useConfig;

/**
 * Returns the geocoding configuration from the nearest `GeocodingProvider`, or
 * `null` when there is none — lets a component degrade gracefully (manual entry)
 * when geocoding is not wired up.
 */
export const useOptionalGeocodingConfig = useOptionalConfig;
