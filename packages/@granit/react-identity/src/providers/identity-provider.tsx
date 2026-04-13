import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_PROVIDER_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the identity provider. */
export interface IdentityConfig {
  readonly client: AxiosInstance;
  /** Base path for user cache endpoints (default: `/api/v1/identity/users`). */
  readonly basePath: string;
  /** Base path for identity provider endpoints (default: `/api/v1/identity/provider`). */
  readonly providerBasePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

/** Props accepted by {@link IdentityProvider}. Paths are optional — defaults are applied by the provider. */
export interface IdentityProviderProps {
  readonly config: Omit<IdentityConfig, 'basePath' | 'providerBasePath'> &
    Partial<Pick<IdentityConfig, 'basePath' | 'providerBasePath'>>;
  readonly children: ReactNode;
}

const IdentityConfigContext = createContext<IdentityConfig | null>(null);

/** Provides identity configuration to child components and hooks. */
export function IdentityProvider({ config, children }: Readonly<IdentityProviderProps>) {
  const value = useMemo<IdentityConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      providerBasePath: config.providerBasePath ?? DEFAULT_PROVIDER_BASE_PATH,
    }),
    [config]
  );
  return <IdentityConfigContext value={value}>{children}</IdentityConfigContext>;
}

/** Returns the identity configuration from the nearest `IdentityProvider`. */
export function useIdentityConfig(): IdentityConfig {
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
