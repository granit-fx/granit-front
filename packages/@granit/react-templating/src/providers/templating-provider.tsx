import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { TemplatingConfig as ResolvedTemplatingConfig } from '@granit/templating';
import type { ReactNode } from 'react';

export interface TemplatingConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface TemplatingProviderProps {
  readonly config: TemplatingConfig;
  readonly children: ReactNode;
}

const DEFAULT_QUERY_KEY_PREFIX = ['templates'] as const;

const TemplatingConfigContext = createContext<ResolvedTemplatingConfig | null>(null);

export function TemplatingProvider({ config, children }: TemplatingProviderProps) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedTemplatingConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'TemplatingProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
    };
  }, [config, contextClient]);

  return <TemplatingConfigContext value={value}>{children}</TemplatingConfigContext>;
}

export function useTemplatingConfig(): ResolvedTemplatingConfig {
  const config = useContext(TemplatingConfigContext);
  if (!config) {
    throw new Error('useTemplatingConfig must be used within a <TemplatingProvider>');
  }
  return config;
}
