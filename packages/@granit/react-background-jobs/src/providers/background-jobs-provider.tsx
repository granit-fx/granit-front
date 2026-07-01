import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';
import { DEFAULT_BACKGROUND_JOBS_KEY_PREFIX } from '../hooks/query-keys';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the background jobs provider. */
export interface BackgroundJobsConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * BackgroundJobsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`, and defaulted
 * `queryKeyPrefix`.
 */
export interface ResolvedBackgroundJobsConfig extends ResolvedGranitProviderConfig<BackgroundJobsConfig> {
  readonly queryKeyPrefix: readonly string[];
}

export type BackgroundJobsProviderProps = GranitProviderProps<BackgroundJobsConfig>;

const { Provider, useConfig } = createConfigProvider<
  BackgroundJobsConfig,
  ResolvedBackgroundJobsConfig
>({
  name: 'BackgroundJobs',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_BACKGROUND_JOBS_KEY_PREFIX,
  }),
});

/** Provides background jobs configuration to child components and hooks. */
export const BackgroundJobsProvider = Provider;

/** Returns the background jobs configuration from the nearest `BackgroundJobsProvider`. */
export const useBackgroundJobsConfig = useConfig;
