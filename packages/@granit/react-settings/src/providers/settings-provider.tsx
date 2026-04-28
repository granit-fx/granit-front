import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the settings provider. */
export interface SettingsConfig {
  readonly client?: AxiosInstance;
  /** Base path prefix before `/settings/...` (default: empty string). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SettingsConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedSettingsConfig extends SettingsConfig {
  readonly client: AxiosInstance;
}

export interface SettingsProviderProps {
  readonly config: SettingsConfig;
  readonly children: ReactNode;
}

const SettingsConfigContext = createContext<ResolvedSettingsConfig | null>(null);

/** Provides settings configuration to child components and hooks. */
export function SettingsProvider({ config, children }: Readonly<SettingsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedSettingsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'SettingsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client };
  }, [config, contextClient]);
  return <SettingsConfigContext value={value}>{children}</SettingsConfigContext>;
}

/** Returns the settings configuration from the nearest `SettingsProvider`. */
export function useSettingsConfig(): ResolvedSettingsConfig {
  const ctx = useContext(SettingsConfigContext);
  if (!ctx) {
    throw new Error('useSettingsConfig must be used within a SettingsProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for settings operations. */
export function buildSettingsQueryKey(
  config: SettingsConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['settings'];
  return [...prefix, ...segments];
}
