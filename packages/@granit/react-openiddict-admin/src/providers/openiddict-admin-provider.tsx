import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

export interface OpenIddictAdminConfig extends GranitProviderConfig {
  /** Base path for authenticated (non-admin) OIDC endpoints, e.g. `/api/v1/oidc`. Used by the consent page. */
  readonly oidcBasePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * OpenIddictAdminConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export type ResolvedOpenIddictAdminConfig = ResolvedGranitProviderConfig<OpenIddictAdminConfig>;

export type OpenIddictAdminProviderProps = GranitProviderProps<OpenIddictAdminConfig>;

const DEFAULT_KEY_PREFIX = ['openiddict-admin'] as const;

const { Provider, useConfig } = createConfigProvider<OpenIddictAdminConfig>({
  name: 'OpenIddictAdmin',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
  }),
});

export const OpenIddictAdminProvider = Provider;
export const useAdminConfig = useConfig;

export function buildAdminQueryKey(
  config: OpenIddictAdminConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}
