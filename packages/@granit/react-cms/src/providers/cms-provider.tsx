'use client';

import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

export interface CmsConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsConfig extends CmsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export type CmsProviderProps = GranitProviderProps<CmsConfig>;

const { Provider, useConfig } = createConfigProvider<CmsConfig, ResolvedCmsConfig>({
  name: 'Cms',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
  }),
});

export const CmsProvider = Provider;

export const useCmsConfig = useConfig;

export function buildCmsQueryKey(
  config: ResolvedCmsConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
