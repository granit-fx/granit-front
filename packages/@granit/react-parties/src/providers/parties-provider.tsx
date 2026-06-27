import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the parties provider. */
export interface PartiesConfig extends GranitProviderConfig {
  /** Base path for parties endpoints (default: `/api/v1/parties`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * PartiesConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedPartiesConfig = ResolvedGranitProviderConfig<PartiesConfig>;

export type PartiesProviderProps = GranitProviderProps<PartiesConfig>;

const { Provider, useConfig } = createConfigProvider<PartiesConfig>({
  name: 'Parties',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides parties configuration to child components and hooks. */
export const PartiesProvider = Provider;

/** Returns the parties configuration from the nearest `PartiesProvider`. */
export const usePartiesConfig = useConfig;

/** Builds a consistent React Query key for parties operations. */
export function buildPartiesQueryKey(
  config: PartiesConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['parties'];
  return [...prefix, ...segments];
}
