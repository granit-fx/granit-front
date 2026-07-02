import { getEntity, toPascalCaseKeys } from '@granit/entities';
import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export { entityRowQueryKey } from './query-keys';
import { entityRowQueryKey } from './query-keys';

export interface UseEntityOptions {
  /**
   * Base path the row hangs off — the entity's `links.list` from the
   * discovery payload (e.g. `/api/v1/parties`) or `/api/v1/{entityName}`
   * for the action-overlay reads. Required: when absent the query stays
   * disabled.
   */
  readonly basePath: string | null | undefined;
  /**
   * Return the row keyed PascalCase (manifest convention) instead of the
   * raw camelCase wire keys. Renderers (`<EntityDetail>` / `<EntityForm>`)
   * address values PascalCase, so detail / form / overlay reads set this;
   * consumers that want the wire shape leave it `false` (default).
   */
  readonly pascalCase?: boolean;
  /** Force-disable the query even when `basePath` + `id` are present. */
  readonly enabled?: boolean;
}

/**
 * `GET {basePath}/{id}` — read one manifest-driven entity row. Shared by
 * the detail page, the form-edit page, and the action modal / drawer
 * overlays so the single-row read, cache key, and PascalCase remap live
 * in one place instead of being hand-rolled in each UI component.
 *
 * The query is keyed by `(entityName, id)` (see {@link entityRowQueryKey})
 * — stable across the two URL schemes the call-sites use — and stays
 * disabled until both `basePath` and `id` resolve.
 */
export function useEntity(
  entityName: string,
  id: string | null | undefined,
  options: UseEntityOptions
): UseQueryResult<Record<string, unknown>> {
  const client = useGranitClient();
  const { basePath, pascalCase = false, enabled = true } = options;

  return useQuery({
    queryKey: entityRowQueryKey(entityName, id ?? ''),
    queryFn: async ({ signal }) => {
      if (!basePath || !id) throw new Error('Missing base path or id');
      const row = await getEntity(client, basePath, id, { signal });
      return pascalCase ? toPascalCaseKeys(row) : { ...row };
    },
    enabled: enabled && Boolean(basePath) && Boolean(id),
  });
}

export type { EntityRow } from '@granit/entities';
