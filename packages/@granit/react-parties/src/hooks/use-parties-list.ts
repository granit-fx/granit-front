import { useQueryEndpoint } from '@granit/react-query-engine';

import type { PartyListItemResponse } from '@granit/parties';
import type { UseQueryEndpointOptions, UseQueryEndpointReturn } from '@granit/react-query-engine';

/**
 * Query-engine binding for the parties list. `GET {basePath}` is a
 * `MapGranitQuery<Party>()` endpoint (it ships a `/meta`), so the grid is
 * driven by `useQueryEndpoint` — server-side pagination, sort, grouping and
 * filtering (e.g. the role flag via `setFilters([{ field: 'roles', … }])`).
 *
 * Must be called under a {@link PartiesListProvider}. Distinct from
 * {@link usePartiesQuery} (the plain `useQuery` kept for non-grid callers such
 * as the party picker) and from the duplicates-inbox endpoint.
 *
 * @example
 * ```tsx
 * const qe = usePartiesListQuery();
 * qe.setFilters([{ field: 'roles', operator: 'Eq', value: 'Customer' }]);
 * ```
 */
export function usePartiesListQuery(
  options?: UseQueryEndpointOptions
): UseQueryEndpointReturn<PartyListItemResponse> {
  return useQueryEndpoint<PartyListItemResponse>(options);
}
