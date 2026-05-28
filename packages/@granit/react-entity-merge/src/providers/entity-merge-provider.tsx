import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_QUERY_KEY_PREFIX } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/**
 * Configuration for the entity-merge provider. `basePath` is the mergeable
 * aggregate's collection root (e.g. `/api/v1/parties`) — the
 * `/{survivorId}/merge[/preview]` suffix is appended by the hooks.
 */
export interface EntityMergeConfig {
  readonly client?: AxiosInstance;
  /** Collection root of the mergeable aggregate, e.g. `/api/v1/parties`. */
  readonly basePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * {@link EntityMergeConfig} after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedEntityMergeConfig extends EntityMergeConfig {
  readonly client: AxiosInstance;
}

export interface EntityMergeProviderProps {
  readonly config: EntityMergeConfig;
  readonly children: ReactNode;
}

const EntityMergeConfigContext = createContext<ResolvedEntityMergeConfig | null>(null);

/** Provides entity-merge configuration to child hooks and components. */
export function EntityMergeProvider({ config, children }: Readonly<EntityMergeProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedEntityMergeConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'EntityMergeProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client };
  }, [config, contextClient]);
  return <EntityMergeConfigContext value={value}>{children}</EntityMergeConfigContext>;
}

/** Returns the entity-merge configuration from the nearest `EntityMergeProvider`. */
export function useEntityMergeConfig(): ResolvedEntityMergeConfig {
  const ctx = useContext(EntityMergeConfigContext);
  if (!ctx) {
    throw new Error('useEntityMergeConfig must be used within an EntityMergeProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for entity-merge operations. */
export function buildEntityMergeQueryKey(
  config: EntityMergeConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX;
  return [...prefix, ...segments];
}
