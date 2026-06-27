import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the features provider. */
export interface FeaturesConfig extends GranitProviderConfig {
  /** Base path for features endpoints (default: `/api/v1/features`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * FeaturesConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedFeaturesConfig = ResolvedGranitProviderConfig<FeaturesConfig>;

export type FeaturesProviderProps = GranitProviderProps<FeaturesConfig>;

const { Provider, useConfig } = createConfigProvider<FeaturesConfig>({
  name: 'Features',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides features configuration to child components and hooks. */
export const FeaturesProvider = Provider;

/** Returns the features configuration from the nearest `FeaturesProvider`. */
export const useFeaturesConfig = useConfig;

/** Builds a consistent React Query key for features operations. */
export function buildFeaturesQueryKey(
  config: FeaturesConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['features'];
  return [...prefix, ...segments];
}
