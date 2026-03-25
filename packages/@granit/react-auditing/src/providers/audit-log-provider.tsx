import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the audit log provider. */
export interface AuditLogConfig {
  readonly client: AxiosInstance;
  /** Base path prefix (default: `/audit-log`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface AuditLogProviderProps {
  readonly config: AuditLogConfig;
  readonly children: ReactNode;
}

const AuditLogConfigContext = createContext<AuditLogConfig | null>(null);

const DEFAULT_BASE_PATH = '/audit-log';
const DEFAULT_QUERY_KEY_PREFIX = ['audit-log'] as const;

/** Provides audit log configuration to child components and hooks. */
export function AuditLogProvider({ config, children }: Readonly<AuditLogProviderProps>) {
  const value = useMemo(() => config, [config]);
  return <AuditLogConfigContext value={value}>{children}</AuditLogConfigContext>;
}

/** Returns the audit log configuration from the nearest `AuditLogProvider`. */
export function useAuditLogConfig(): AuditLogConfig {
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

export { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX };
