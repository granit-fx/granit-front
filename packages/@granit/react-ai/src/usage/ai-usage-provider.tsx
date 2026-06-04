// ---------------------------------------------------------------------------
// AI usage provider — wires the @granit/query-engine endpoint for the
// `MapGranitQuery<AIUsageRecord>()` group exposed by Granit.AI.Endpoints.
//
// Opt-in subpath (`@granit/react-ai/usage`): only consumers that render the
// usage view pull in the @granit/query-engine peer dependency.
// ---------------------------------------------------------------------------

import { QueryProvider } from '@granit/react-query-engine';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface AIUsageProviderProps {
  /**
   * Axios client. Optional when a `GranitClientProvider` from
   * `@granit/react-api-client` sits higher in the tree — the query-engine
   * resolves the client from context.
   */
  readonly client?: AxiosInstance;
  /**
   * Base path of the AI usage query group. Defaults to
   * `` `${DEFAULT_BASE_PATH}/usage` `` (`/api/v1/ai/usage`).
   */
  readonly basePath?: string;
  readonly children: ReactNode;
}

/**
 * Provides the AI usage query surface to {@link useAIUsage} / {@link useAIUsageMeta}.
 * Wrap the usage view in this provider:
 *
 * ```tsx
 * <AIUsageProvider>
 *   <AIUsageTable />
 * </AIUsageProvider>
 * ```
 */
export function AIUsageProvider({ client, basePath, children }: Readonly<AIUsageProviderProps>) {
  return (
    <QueryProvider config={{ client, basePath: basePath ?? `${DEFAULT_BASE_PATH}/usage` }}>
      {children}
    </QueryProvider>
  );
}
