import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the scheduling provider. */
export interface SchedulingConfig extends GranitProviderConfig {
  /** Base path for scheduling endpoints (default: `/api/v1/scheduling`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SchedulingConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedSchedulingConfig = ResolvedGranitProviderConfig<SchedulingConfig>;

export type SchedulingProviderProps = GranitProviderProps<SchedulingConfig>;

const { Provider, useConfig } = createConfigProvider<SchedulingConfig>({
  name: 'Scheduling',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides scheduling configuration to child components and hooks. */
export const SchedulingProvider = Provider;

/** Returns the scheduling configuration from the nearest `SchedulingProvider`. */
export const useSchedulingConfig = useConfig;
