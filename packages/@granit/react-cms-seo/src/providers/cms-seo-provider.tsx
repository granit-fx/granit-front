import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

export interface CmsSeoConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsSeoConfig extends CmsSeoConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export type CmsSeoProviderProps = GranitProviderProps<CmsSeoConfig>;

const { Provider, useConfig } = createConfigProvider<CmsSeoConfig, ResolvedCmsSeoConfig>({
  name: 'CmsSeo',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
  }),
});

export const CmsSeoProvider = Provider;

export const useCmsSeoConfig = useConfig;
