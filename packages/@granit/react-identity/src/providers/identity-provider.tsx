import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import {
  DEFAULT_BASE_PATH,
  DEFAULT_PROVIDER_BASE_PATH,
  DEFAULT_SESSIONS_BASE_PATH,
} from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the identity provider. */
export interface IdentityConfig {
  readonly client?: AxiosInstance;
  /** Base path for user cache endpoints (default: `/api/v1/identity/users`). */
  readonly basePath: string;
  /** Base path for identity provider endpoints (default: `/api/v1/identity/provider`). */
  readonly providerBasePath: string;
  /**
   * Base path for the caller's own (self-service) session/device endpoints,
   * mounted at the API root (default: `/api/v1`, yielding `/api/v1/sessions`
   * and `/api/v1/devices`).
   */
  readonly sessionsBasePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * IdentityConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedIdentityConfig extends IdentityConfig {
  readonly client: AxiosInstance;
}

/** Props accepted by {@link IdentityProvider}. Paths are optional — defaults are applied by the provider. */
export interface IdentityProviderProps {
  readonly config: Omit<IdentityConfig, 'basePath' | 'providerBasePath' | 'sessionsBasePath'> &
    Partial<Pick<IdentityConfig, 'basePath' | 'providerBasePath' | 'sessionsBasePath'>>;
  readonly children: ReactNode;
}

const IdentityConfigContext = createContext<ResolvedIdentityConfig | null>(null);

/** Provides identity configuration to child components and hooks. */
export function IdentityProvider({ config, children }: Readonly<IdentityProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'IdentityProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      providerBasePath: config.providerBasePath ?? DEFAULT_PROVIDER_BASE_PATH,
      sessionsBasePath: config.sessionsBasePath ?? DEFAULT_SESSIONS_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <IdentityConfigContext value={value}>{children}</IdentityConfigContext>;
}

/** Returns the identity configuration from the nearest `IdentityProvider`. */
export function useIdentityConfig(): ResolvedIdentityConfig {
  const ctx = useContext(IdentityConfigContext);
  if (!ctx) {
    throw new Error('useIdentityConfig must be used within an IdentityProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for identity operations. */
export function buildIdentityQueryKey(
  config: IdentityConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['identity'];
  return [...prefix, ...segments];
}
