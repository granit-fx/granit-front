import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

export interface PrivacyConfig {
  readonly client: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface PrivacyProviderProps {
  readonly config: PrivacyConfig;
  readonly children: ReactNode;
}

const DEFAULT_KEY_PREFIX = ['privacy'] as const;

const PrivacyContext = createContext<PrivacyConfig | null>(null);

export function usePrivacyConfig(): PrivacyConfig {
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
  const value = useMemo<PrivacyConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
    }),
    [config]
  );

  return <PrivacyContext value={value}>{children}</PrivacyContext>;
}
