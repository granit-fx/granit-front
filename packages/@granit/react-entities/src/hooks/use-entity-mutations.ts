import { createEntity, toCamelCaseKeys, updateEntity, type EntityRow } from '@granit/entities';
import { useGranitClient } from '@granit/react-api-client';
import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

import { entityRowsQueryKey } from './query-keys';

export interface UseCreateEntityOptions {
  /** Base path to POST to — the entity's `links.list` from discovery. */
  readonly basePath: string | null | undefined;
  /**
   * When the caller feeds manifest-keyed (PascalCase) form values, set
   * this so the hook flips them to the camelCase wire shape before POST.
   * Values already camelCase leave it `false` (default).
   */
  readonly fromPascalCase?: boolean;
}

/**
 * `POST {basePath}` — create one entity row and invalidate every cached
 * row for the entity. Mirrors the create half of the workspace form page's
 * submit mutation, lifted out of the UI so the URL, the case remap, and
 * the invalidation live in the hook layer.
 */
export function useCreateEntity(
  entityName: string,
  options: UseCreateEntityOptions
): UseMutationResult<EntityRow, unknown, EntityRow> {
  const client = useGranitClient();
  const queryClient = useQueryClient();
  const { basePath, fromPascalCase = false } = options;

  return useMutation({
    mutationFn: async (values: EntityRow) => {
      if (!basePath) throw new Error('Missing base path');
      const payload = fromPascalCase ? toCamelCaseKeys(values) : values;
      return createEntity(client, basePath, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityRowsQueryKey(entityName) });
    },
  });
}

/**
 * Optimistic list-cache patch for {@link useUpdateEntity}. Lets the kanban
 * board move a card between columns before the PATCH resolves: `listKey`
 * is the query-engine list cache to snapshot / roll back, `patchRow`
 * returns the next shape for each row (identity for untouched rows). The
 * hook cancels in-flight list fetches, applies `patchRow` to every cached
 * page's `items`, and restores the snapshot on error.
 */
export interface OptimisticListPatch {
  readonly listKey: QueryKey;
  readonly patchRow: (row: EntityRow) => EntityRow;
}

export interface UseUpdateEntityVariables {
  readonly id: string;
  readonly values: EntityRow;
  /** Optional per-call optimistic list patch (used by the kanban board). */
  readonly optimistic?: OptimisticListPatch;
}

export interface UseUpdateEntityOptions {
  /** Base path to PATCH against — the entity's `links.list` from discovery. */
  readonly basePath: string | null | undefined;
  /**
   * Flip manifest-keyed (PascalCase) values to camelCase before PATCH.
   * Defaults to `false` (values already on the wire shape).
   */
  readonly fromPascalCase?: boolean;
  /**
   * Extra query keys to invalidate on settle, on top of the per-entity
   * row prefix — e.g. the query-engine list key the kanban reads from.
   */
  readonly invalidateOnSettle?: readonly QueryKey[];
}

interface UpdateContext {
  readonly snapshot: readonly [QueryKey, unknown][];
}

/**
 * `PATCH {basePath}/{id}` — partial update of one entity row with optional
 * optimistic list patching. Folds in the kanban board's
 * snapshot / apply / rollback logic (previously inlined in
 * `entity-kanban-view.tsx`): when the caller passes `optimistic`, the
 * matching list-cache pages are patched before the request and restored if
 * it fails. On settle it invalidates the per-entity row prefix plus any
 * `invalidateOnSettle` keys.
 */
export function useUpdateEntity(
  entityName: string,
  options: UseUpdateEntityOptions
): UseMutationResult<EntityRow, unknown, UseUpdateEntityVariables, UpdateContext> {
  const client = useGranitClient();
  const queryClient = useQueryClient();
  const { basePath, fromPascalCase = false, invalidateOnSettle } = options;

  return useMutation<EntityRow, unknown, UseUpdateEntityVariables, UpdateContext>({
    mutationFn: async ({ id, values }) => {
      if (!basePath) throw new Error('Missing base path');
      const payload = fromPascalCase ? toCamelCaseKeys(values) : values;
      return updateEntity(client, basePath, id, payload);
    },
    onMutate: async ({ optimistic }) => {
      if (!optimistic) return { snapshot: [] };
      const { listKey, patchRow } = optimistic;
      await queryClient.cancelQueries({ queryKey: listKey });
      const snapshot = queryClient.getQueriesData({ queryKey: listKey });
      queryClient.setQueriesData({ queryKey: listKey }, (data: unknown) => {
        if (!data || typeof data !== 'object' || !('items' in data)) return data;
        const page = data as { items: readonly EntityRow[] };
        return { ...page, items: page.items.map(patchRow) };
      });
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, value] of context.snapshot) {
        queryClient.setQueryData(key, value);
      }
      // API errors surface via the global MutationCache.onError toast.
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: entityRowsQueryKey(entityName) });
      for (const key of invalidateOnSettle ?? []) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
