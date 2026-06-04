import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface CmsSeoConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsSeoConfig extends CmsSeoConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface CmsSeoProviderProps {
  readonly config: CmsSeoConfig;
  readonly children: ReactNode;
}

const CmsSeoConfigContext = createContext<ResolvedCmsSeoConfig | null>(null);

export function CmsSeoProvider({ config, children }: Readonly<CmsSeoProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedCmsSeoConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'CmsSeoProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <CmsSeoConfigContext value={value}>{children}</CmsSeoConfigContext>;
}

export function useCmsSeoConfig(): ResolvedCmsSeoConfig {
  const ctx = useContext(CmsSeoConfigContext);
  if (!ctx) {
    throw new Error('useCmsSeoConfig must be used within a CmsSeoProvider');
  }
  return ctx;
}
