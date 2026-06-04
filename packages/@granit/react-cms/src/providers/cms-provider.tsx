'use client';

import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface CmsConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedCmsConfig extends CmsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface CmsProviderProps {
  readonly config: CmsConfig;
  readonly children: ReactNode;
}

const CmsConfigContext = createContext<ResolvedCmsConfig | null>(null);

export function CmsProvider({ config, children }: Readonly<CmsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedCmsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'CmsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <CmsConfigContext value={value}>{children}</CmsConfigContext>;
}

export function useCmsConfig(): ResolvedCmsConfig {
  const ctx = useContext(CmsConfigContext);
  if (!ctx) {
    throw new Error('useCmsConfig must be used within a CmsProvider');
  }
  return ctx;
}

export function buildCmsQueryKey(
  config: ResolvedCmsConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
