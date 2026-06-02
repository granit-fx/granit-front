import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const DEFAULT_BASE_PATH = '';
const DEFAULT_QUERY_KEY_PREFIX = ['cms-redirects'] as const;

export interface CmsRedirectsConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsRedirectsConfig extends CmsRedirectsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface CmsRedirectsProviderProps {
  readonly config: CmsRedirectsConfig;
  readonly children: ReactNode;
}

const CmsRedirectsConfigContext = createContext<ResolvedCmsRedirectsConfig | null>(null);

export function CmsRedirectsProvider({ config, children }: Readonly<CmsRedirectsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedCmsRedirectsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'CmsRedirectsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <CmsRedirectsConfigContext value={value}>{children}</CmsRedirectsConfigContext>;
}

export function useCmsRedirectsConfig(): ResolvedCmsRedirectsConfig {
  const ctx = useContext(CmsRedirectsConfigContext);
  if (!ctx) {
    throw new Error('useCmsRedirectsConfig must be used within a CmsRedirectsProvider');
  }
  return ctx;
}
