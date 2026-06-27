import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';
import type { TemplatingConfig as ResolvedTemplatingConfig } from '@granit/templating';

export interface TemplatingConfig extends GranitProviderConfig {
  readonly queryKeyPrefix?: readonly string[];
}

export type TemplatingProviderProps = GranitProviderProps<TemplatingConfig>;

const DEFAULT_QUERY_KEY_PREFIX = ['templates'] as const;

const { Provider, useConfig } = createConfigProvider<TemplatingConfig, ResolvedTemplatingConfig>({
  name: 'Templating',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
  }),
});

export const TemplatingProvider = Provider;

export const useTemplatingConfig = useConfig;
