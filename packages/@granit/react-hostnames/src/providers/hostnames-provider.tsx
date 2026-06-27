import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the hostnames provider. */
export type HostnamesConfig = GranitProviderConfig;

/** Resolved configuration where `client` and `basePath` are guaranteed present. */
export type ResolvedHostnamesConfig = ResolvedGranitProviderConfig<HostnamesConfig>;

export type HostnamesProviderProps = GranitProviderProps<HostnamesConfig>;

const { Provider, useConfig } = createConfigProvider<HostnamesConfig>({
  name: 'Hostnames',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/** Provides hostnames configuration to child components and hooks. */
export const HostnamesProvider = Provider;

/** Returns the hostnames configuration from the nearest `HostnamesProvider`. */
export const useHostnamesConfig = useConfig;
