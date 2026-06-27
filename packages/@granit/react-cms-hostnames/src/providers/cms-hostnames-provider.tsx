import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

export interface CmsHostnamesConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsHostnamesConfig extends CmsHostnamesConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export type CmsHostnamesProviderProps = GranitProviderProps<CmsHostnamesConfig>;

const { Provider, useConfig } = createConfigProvider<
  CmsHostnamesConfig,
  ResolvedCmsHostnamesConfig
>({
  name: 'CmsHostnames',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
  }),
});

export const CmsHostnamesProvider = Provider;

export const useCmsHostnamesConfig = useConfig;
