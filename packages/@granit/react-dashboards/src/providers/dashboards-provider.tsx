import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the dashboards provider. */
export interface DashboardsConfig extends GranitProviderConfig {
  /** Base path for dashboards endpoints (default: `/api/v1/dashboards`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Resolved configuration where all optional fields have defaults applied. */
export type ResolvedDashboardsConfig = ResolvedGranitProviderConfig<DashboardsConfig>;

export type DashboardsProviderProps = GranitProviderProps<DashboardsConfig>;

const { Provider, useConfig } = createConfigProvider<DashboardsConfig>({
  name: 'Dashboards',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides dashboards configuration to child components and hooks. */
export const DashboardsProvider = Provider;

/** Returns the dashboards configuration from the nearest `DashboardsProvider`. */
export const useDashboardsConfig = useConfig;
