import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the SEPA transfer provider. */
export interface SepaTransferConfig {
  readonly client?: AxiosInstance;
  /** Base path for SEPA transfer endpoints (default: `/api/v1/sepa-transfer`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SepaTransferConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export interface ResolvedSepaTransferConfig extends SepaTransferConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface SepaTransferProviderProps {
  readonly config: SepaTransferConfig;
  readonly children: ReactNode;
}

const SepaTransferConfigContext = createContext<ResolvedSepaTransferConfig | null>(null);

/** Provides SEPA transfer configuration to child components and hooks. */
export function SepaTransferProvider({ config, children }: Readonly<SepaTransferProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedSepaTransferConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'SepaTransferProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <SepaTransferConfigContext value={value}>{children}</SepaTransferConfigContext>;
}

/** Returns the SEPA transfer configuration from the nearest `SepaTransferProvider`. */
export function useSepaTransferConfig(): ResolvedSepaTransferConfig {
  const ctx = useContext(SepaTransferConfigContext);
  if (!ctx) {
    throw new Error('useSepaTransferConfig must be used within a SepaTransferProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for SEPA transfer operations. */
export function buildSepaTransferQueryKey(
  config: SepaTransferConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['sepa-transfer'];
  return [...prefix, ...segments];
}
