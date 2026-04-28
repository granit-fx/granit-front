import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface PrivacyConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * PrivacyConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedPrivacyConfig extends PrivacyConfig {
  readonly client: AxiosInstance;
}

export interface PrivacyProviderProps {
  readonly config: PrivacyConfig;
  readonly children: ReactNode;
}

const DEFAULT_KEY_PREFIX = ['privacy'] as const;

const PrivacyContext = createContext<ResolvedPrivacyConfig | null>(null);

export function usePrivacyConfig(): ResolvedPrivacyConfig {
  const config = useContext(PrivacyContext);
  if (!config) throw new Error('usePrivacyConfig must be used within a PrivacyProvider');
  return config;
}

export function buildPrivacyQueryKey(
  config: PrivacyConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX), ...segments];
}

export function PrivacyProvider({ config, children }: PrivacyProviderProps) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'PrivacyProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
      client,
    };
  }, [config, contextClient]);

  return <PrivacyContext value={value}>{children}</PrivacyContext>;
}
