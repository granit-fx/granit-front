// ---------------------------------------------------------------------------
// AuditEntityChangesProvider — wires the QueryEngine endpoint for the
// `MapGranitQuery<AuditEntityChangeResponse>()` group of Granit.Auditing.Endpoints
// (cross-cutting entity-change analysis, mounted at `{basePath}/audit-entity-changes`).
// ---------------------------------------------------------------------------

import { QueryProvider } from '@granit/react-query-engine';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface AuditEntityChangesProviderProps {
  /**
   * Axios client. Optional when a `GranitClientProvider` from
   * `@granit/react-api-client` sits higher in the tree — the query-engine
   * resolves the client from context.
   */
  readonly client?: AxiosInstance;
  /** Base path of the audit module. Defaults to `/api/v1/auditing`. */
  readonly basePath?: string;
  readonly children: ReactNode;
}

/**
 * Provides the audit entity-changes query surface to
 * {@link useAuditEntityChanges} / `useAuditEntityChangesMeta`.
 *
 * ```tsx
 * <AuditEntityChangesProvider>
 *   <AuditEntityChangesTable />
 * </AuditEntityChangesProvider>
 * ```
 */
export function AuditEntityChangesProvider({
  client,
  basePath,
  children,
}: Readonly<AuditEntityChangesProviderProps>) {
  return (
    <QueryProvider
      config={{ client, basePath: `${basePath ?? DEFAULT_BASE_PATH}/audit-entity-changes` }}
    >
      {children}
    </QueryProvider>
  );
}
