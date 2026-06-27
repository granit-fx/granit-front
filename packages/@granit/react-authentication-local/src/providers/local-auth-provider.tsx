import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

export type LocalAuthConfig = GranitProviderConfig;

/**
 * LocalAuthConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedLocalAuthConfig = ResolvedGranitProviderConfig<LocalAuthConfig>;

export type LocalAuthProviderProps = GranitProviderProps<LocalAuthConfig>;

const { Provider, useConfig } = createConfigProvider<LocalAuthConfig>({
  name: 'LocalAuth',
  defaultBasePath: DEFAULT_BASE_PATH,
});

export const LocalAuthProvider = Provider;
export const useLocalAuthConfig = useConfig;
