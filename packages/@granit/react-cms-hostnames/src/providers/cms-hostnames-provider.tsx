import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const DEFAULT_BASE_PATH = '';
const DEFAULT_QUERY_KEY_PREFIX = ['cms-hostnames'] as const;

export interface CmsHostnamesConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsHostnamesConfig extends CmsHostnamesConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface CmsHostnamesProviderProps {
  readonly config: CmsHostnamesConfig;
  readonly children: ReactNode;
}

const CmsHostnamesConfigContext = createContext<ResolvedCmsHostnamesConfig | null>(null);

export function CmsHostnamesProvider({ config, children }: Readonly<CmsHostnamesProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedCmsHostnamesConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'CmsHostnamesProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <CmsHostnamesConfigContext value={value}>{children}</CmsHostnamesConfigContext>;
}

export function useCmsHostnamesConfig(): ResolvedCmsHostnamesConfig {
  const ctx = useContext(CmsHostnamesConfigContext);
  if (!ctx) {
    throw new Error('useCmsHostnamesConfig must be used within a CmsHostnamesProvider');
  }
  return ctx;
}
