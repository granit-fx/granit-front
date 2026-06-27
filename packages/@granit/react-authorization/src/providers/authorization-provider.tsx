import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

export interface AuthorizationConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

export type ResolvedAuthorizationConfig = ResolvedGranitProviderConfig<AuthorizationConfig>;

export type AuthorizationProviderProps = GranitProviderProps<AuthorizationConfig>;

const { Provider, useConfig, useOptionalConfig } = createConfigProvider<AuthorizationConfig>({
  name: 'Authorization',
  defaultBasePath: DEFAULT_BASE_PATH,
});

export const AuthorizationProvider = Provider;
export const useAuthorizationConfig = useConfig;
export const useOptionalAuthorizationConfig = useOptionalConfig;
