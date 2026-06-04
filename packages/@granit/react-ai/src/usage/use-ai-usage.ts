import { useQueryEndpoint } from '@granit/react-query-engine';

import type { AIUsageRecord } from '@granit/ai';
import type { UseQueryEndpointReturn } from '@granit/react-query-engine';

/**
 * Query-engine endpoint for AI usage records ({@link AIUsageRecord}), backed by
 * the `MapGranitQuery<AIUsageRecord>()` group of `Granit.AI.Endpoints`. Exposes
 * pagination / sort / group-by dispatchers and the paged (or grouped) result.
 *
 * Must be used within an {@link AIUsageProvider}.
 *
 * @example
 * ```tsx
 * const usage = useAIUsage();
 * usage.query.data?.items.map((r) => r.workspaceName);
 * ```
 */
export function useAIUsage(): UseQueryEndpointReturn<AIUsageRecord> {
  return useQueryEndpoint<AIUsageRecord>();
}

/** Query metadata (columns, group-by fields) for the AI usage surface. */
export { useQueryMeta as useAIUsageMeta } from '@granit/react-query-engine';
