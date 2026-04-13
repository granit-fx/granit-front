import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { TemplatingConfig } from '@granit/templating';
import type { AxiosInstance } from 'axios';

const TemplatingConfigContext = createContext<TemplatingConfig | null>(null);

const DEFAULT_QUERY_KEY_PREFIX = ['templates'] as const;

export interface TemplatingProviderProps {
  client: AxiosInstance;
  basePath?: string;
  queryKeyPrefix?: readonly string[];
  children: React.ReactNode;
}

export function TemplatingProvider({
  client,
  basePath = DEFAULT_BASE_PATH,
  queryKeyPrefix = DEFAULT_QUERY_KEY_PREFIX,
  children,
}: Readonly<TemplatingProviderProps>) {
  const config = useMemo<TemplatingConfig>(
    () => ({ client, basePath, queryKeyPrefix }),
    [client, basePath, queryKeyPrefix]
  );

  return (
    <TemplatingConfigContext.Provider value={config}>{children}</TemplatingConfigContext.Provider>
  );
}

export function useTemplatingConfig(): TemplatingConfig {
  const config = useContext(TemplatingConfigContext);
  if (!config) {
    throw new Error('useTemplatingConfig must be used within a <TemplatingProvider>');
  }
  return config;
}
