import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the background jobs provider. */
export type BackgroundJobsConfig = GranitProviderConfig;

/**
 * BackgroundJobsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedBackgroundJobsConfig = ResolvedGranitProviderConfig<BackgroundJobsConfig>;

export type BackgroundJobsProviderProps = GranitProviderProps<BackgroundJobsConfig>;

const { Provider, useConfig } = createConfigProvider<BackgroundJobsConfig>({
  name: 'BackgroundJobs',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides background jobs configuration to child components and hooks. */
export const BackgroundJobsProvider = Provider;

/** Returns the background jobs configuration from the nearest `BackgroundJobsProvider`. */
export const useBackgroundJobsConfig = useConfig;
