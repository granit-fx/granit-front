import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_API_BASE, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/**
 * Configuration for the customization provider. `apiBase` is the API root
 * (without trailing slash) — e.g. `/api/v1`. The provider then composes
 * `${apiBase}/entities/...` and `${apiBase}/workspaces/...` itself, since
 * Layer 1 customization spans both surfaces.
 */
export interface CustomizationConfig {
  readonly client?: AxiosInstance;
  readonly apiBase?: string;
  readonly queryKeyPrefix?: readonly string[];
  /**
   * Optional invalidator hooks called after a successful customization PUT.
   * The customization editor lives "above" the entity manifest cache, so
   * apps wire these to React Query invalidators in the consuming module
   * (e.g. invalidate `['entities', 'manifest', name]` when a form layout
   * changes). Keeping it as a callback avoids a hard peer dependency on
   * `@granit/react-entities` / `@granit/react-workspaces`.
   */
  readonly onFormCustomizationChanged?: (entityName: string) => void;
  readonly onWorkspaceCustomizationChanged?: (workspaceName: string) => void;
}

export interface ResolvedCustomizationConfig extends CustomizationConfig {
  readonly client: AxiosInstance;
  readonly apiBase: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface CustomizationProviderProps {
  readonly config: CustomizationConfig;
  readonly children: ReactNode;
}

const CustomizationConfigContext = createContext<ResolvedCustomizationConfig | null>(null);

export function CustomizationProvider({ config, children }: Readonly<CustomizationProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedCustomizationConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'CustomizationProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      apiBase: config.apiBase ?? DEFAULT_API_BASE,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <CustomizationConfigContext value={value}>{children}</CustomizationConfigContext>;
}

export function useCustomizationConfig(): ResolvedCustomizationConfig {
  const ctx = useContext(CustomizationConfigContext);
  if (!ctx) {
    throw new Error('useCustomizationConfig must be used within a CustomizationProvider');
  }
  return ctx;
}

export function buildCustomizationQueryKey(
  config: ResolvedCustomizationConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
