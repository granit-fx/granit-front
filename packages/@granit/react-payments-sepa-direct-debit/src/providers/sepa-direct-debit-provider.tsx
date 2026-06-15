import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the SEPA Direct Debit provider. */
export interface SepaDirectDebitConfig {
  readonly client?: AxiosInstance;
  /** Base path for SEPA Direct Debit endpoints (default: `/api/v1/sepa-direct-debit`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * SepaDirectDebitConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and defaulted
 * `basePath`. Both are guaranteed present, so hooks read them without a
 * non-null assertion.
 */
export interface ResolvedSepaDirectDebitConfig extends SepaDirectDebitConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
}

export interface SepaDirectDebitProviderProps {
  readonly config: SepaDirectDebitConfig;
  readonly children: ReactNode;
}

const SepaDirectDebitConfigContext = createContext<ResolvedSepaDirectDebitConfig | null>(null);

/** Provides SEPA Direct Debit configuration to child components and hooks. */
export function SepaDirectDebitProvider({
  config,
  children,
}: Readonly<SepaDirectDebitProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedSepaDirectDebitConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'SepaDirectDebitProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <SepaDirectDebitConfigContext value={value}>{children}</SepaDirectDebitConfigContext>;
}

/** Returns the SEPA Direct Debit configuration from the nearest `SepaDirectDebitProvider`. */
export function useSepaDirectDebitConfig(): ResolvedSepaDirectDebitConfig {
  const ctx = useContext(SepaDirectDebitConfigContext);
  if (!ctx) {
    throw new Error('useSepaDirectDebitConfig must be used within a SepaDirectDebitProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for SEPA Direct Debit operations. */
export function buildSepaDirectDebitQueryKey(
  config: SepaDirectDebitConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['sepa-direct-debit'];
  return [...prefix, ...segments];
}
