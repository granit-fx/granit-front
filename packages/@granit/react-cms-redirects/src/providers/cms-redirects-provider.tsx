import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

export interface CmsRedirectsConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsRedirectsConfig extends CmsRedirectsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export type CmsRedirectsProviderProps = GranitProviderProps<CmsRedirectsConfig>;

const { Provider, useConfig } = createConfigProvider<
  CmsRedirectsConfig,
  ResolvedCmsRedirectsConfig
>({
  name: 'CmsRedirects',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
  }),
});

export const CmsRedirectsProvider = Provider;

export const useCmsRedirectsConfig = useConfig;
