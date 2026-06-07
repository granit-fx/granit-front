import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface AuthorizationConfig {
  readonly client?: AxiosInstance;
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedAuthorizationConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface AuthorizationProviderProps {
  readonly config: AuthorizationConfig;
  readonly children: ReactNode;
}

const AuthorizationConfigContext = createContext<ResolvedAuthorizationConfig | null>(null);

export function AuthorizationProvider({ config, children }: Readonly<AuthorizationProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedAuthorizationConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'AuthorizationProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client, basePath: config.basePath ?? DEFAULT_BASE_PATH };
  }, [config, contextClient]);
  return <AuthorizationConfigContext value={value}>{children}</AuthorizationConfigContext>;
}

export function useAuthorizationConfig(): ResolvedAuthorizationConfig {
  const ctx = useContext(AuthorizationConfigContext);
  if (!ctx) {
    throw new Error('useAuthorizationConfig must be used within an <AuthorizationProvider>');
  }
  return ctx;
}

export function useOptionalAuthorizationConfig(): ResolvedAuthorizationConfig | null {
  return useContext(AuthorizationConfigContext);
}
