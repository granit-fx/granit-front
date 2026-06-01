import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the audit log provider. */
export interface AuditLogConfig {
  readonly client?: AxiosInstance;
  /** Base path prefix (default: `/api/v1/auditing`). */
  readonly basePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * AuditLogConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedAuditLogConfig extends AuditLogConfig {
  readonly client: AxiosInstance;
}

/** Props accepted by {@link AuditLogProvider}. `basePath` is optional — the default is applied by the provider. */
export interface AuditLogProviderProps {
  readonly config: Omit<AuditLogConfig, 'basePath'> & Partial<Pick<AuditLogConfig, 'basePath'>>;
  readonly children: ReactNode;
}

const AuditLogConfigContext = createContext<ResolvedAuditLogConfig | null>(null);

const DEFAULT_QUERY_KEY_PREFIX = ['audit-log'] as const;

/** Provides audit log configuration to child components and hooks. */
export function AuditLogProvider({ config, children }: Readonly<AuditLogProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'AuditLogProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <AuditLogConfigContext value={value}>{children}</AuditLogConfigContext>;
}

/** Returns the audit log configuration from the nearest `AuditLogProvider`. */
export function useAuditLogConfig(): ResolvedAuditLogConfig {
  const ctx = useContext(AuditLogConfigContext);
  if (!ctx) {
    throw new Error('useAuditLogConfig must be used within an AuditLogProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for audit log operations. */
export function buildAuditLogQueryKey(
  config: AuditLogConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX;
  return [...prefix, ...segments];
}

export { DEFAULT_QUERY_KEY_PREFIX };
