import {
  createReferenceDataEntry,
  deactivateReferenceDataEntry,
  getReferenceDataEntry,
  listReferenceData,
  listReferenceDataChildren,
  updateReferenceDataEntry,
} from '@granit/reference-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PagedResult } from '@granit/query-engine';
import type {
  ReferenceDataCreateRequest,
  ReferenceDataEntry,
  ReferenceDataQuery,
  ReferenceDataUpdateRequest,
} from '@granit/reference-data';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Public option types
// ---------------------------------------------------------------------------

/** Options for the factory function. */
export interface CreateReferenceDataHooksOptions {
  /** Override the default base path. Default: `/api/v1/reference-data/{entityName}` (entityName must be plural). */
  readonly defaultBasePath?: string;
}

/** Options for read hooks (list and entry). */
export interface ReferenceDataListHookOptions {
  /** Axios instance used for HTTP requests. */
  readonly client: AxiosInstance;
  /** Override the base path for this hook call. */
  readonly basePath?: string;
  /** Query parameters for filtering, sorting, and pagination. */
  readonly params?: ReferenceDataQuery;
  /** Whether the query is enabled. Default: true. */
  readonly enabled?: boolean;
}

/** Options for the single-entry hook. */
export interface ReferenceDataEntryHookOptions {
  /** Axios instance used for HTTP requests. */
  readonly client: AxiosInstance;
  /** Override the base path for this hook call. */
  readonly basePath?: string;
  /** Whether the query is enabled. Default: true. */
  readonly enabled?: boolean;
}

/** Options for the children hook (hierarchical types). */
export interface ReferenceDataChildrenHookOptions {
  /** Axios instance used for HTTP requests. */
  readonly client: AxiosInstance;
  /** Override the base path for this hook call. */
  readonly basePath?: string;
  /** Whether the query is enabled. Default: true. */
  readonly enabled?: boolean;
}

/** Options for mutation hooks. */
export interface ReferenceDataMutationHookOptions {
  /** Axios instance used for HTTP requests. */
  readonly client: AxiosInstance;
  /** Override the base path for this hook call. */
  readonly basePath?: string;
}

/** Variables for the update mutation. */
export interface ReferenceDataUpdateVariables {
  readonly code: string;
  readonly data: ReferenceDataUpdateRequest;
}

/** Query key factory for a reference data entity. */
export interface ReferenceDataKeys {
  readonly all: readonly string[];
  readonly lists: () => readonly unknown[];
  readonly list: (params?: ReferenceDataQuery) => readonly unknown[];
  readonly details: () => readonly unknown[];
  readonly detail: (code: string) => readonly unknown[];
  readonly children: (parentCode: string) => readonly unknown[];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a set of React Query hooks for a specific reference data entity type.
 *
 * Mirrors the .NET `MapReferenceDataEndpoints<T>()` pattern: one call per entity
 * type produces typed query/mutation hooks with isolated query keys.
 *
 * @example
 * ```tsx
 * import { createReferenceDataHooks } from '@granit/react-reference-data';
 * import type { ReferenceDataEntry } from '@granit/reference-data';
 *
 * interface Country extends ReferenceDataEntry {
 *   readonly alpha3: string;
 *   readonly region: string;
 * }
 *
 * const {
 *   keys: countryKeys,
 *   useList: useCountries,
 *   useEntry: useCountry,
 *   useCreate: useCreateCountry,
 *   useUpdate: useUpdateCountry,
 *   useDeactivate: useDeactivateCountry,
 * } = createReferenceDataHooks<Country>('countries');
 * ```
 */
export function createReferenceDataHooks<T extends ReferenceDataEntry>(
  /** Plural, kebab-cased entity name matching the backend route segment (e.g. `'countries'`, `'product-categories'`). */
  entityName: string,
  factoryOptions?: CreateReferenceDataHooksOptions
) {
  const defaultBasePath = factoryOptions?.defaultBasePath ?? `/api/v1/reference-data/${entityName}`;

  // -- Query keys -----------------------------------------------------------

  const keys: ReferenceDataKeys = {
    all: ['reference-data', entityName],
    lists: () => [...keys.all, 'list'],
    list: (params?: ReferenceDataQuery) => [...keys.lists(), params],
    details: () => [...keys.all, 'detail'],
    detail: (code: string) => [...keys.details(), code],
    children: (parentCode: string) => [...keys.all, 'children', parentCode],
  };

  // -- Query hooks ----------------------------------------------------------

  function useList(options: ReferenceDataListHookOptions): UseQueryResult<PagedResult<T>> {
    const { client, basePath = defaultBasePath, params, enabled = true } = options;

    return useQuery({
      queryKey: keys.list(params),
      queryFn: async () => listReferenceData<T>(client, basePath, params),
      enabled,
    });
  }

  function useEntry(code: string, options: ReferenceDataEntryHookOptions): UseQueryResult<T> {
    const { client, basePath = defaultBasePath, enabled = true } = options;

    return useQuery({
      queryKey: keys.detail(code),
      queryFn: async () => getReferenceDataEntry<T>(client, basePath, code),
      enabled: enabled && code.length > 0,
    });
  }

  function useChildren(
    parentCode: string,
    options: ReferenceDataChildrenHookOptions
  ): UseQueryResult<T[]> {
    const { client, basePath = defaultBasePath, enabled = true } = options;

    return useQuery({
      queryKey: keys.children(parentCode),
      queryFn: async () => listReferenceDataChildren<T>(client, basePath, parentCode),
      enabled: enabled && parentCode.length > 0,
    });
  }

  // -- Mutation hooks -------------------------------------------------------

  function useCreate(
    options: ReferenceDataMutationHookOptions
  ): UseMutationResult<void, Error, ReferenceDataCreateRequest> {
    const { client, basePath = defaultBasePath } = options;
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (payload: ReferenceDataCreateRequest) =>
        createReferenceDataEntry(client, basePath, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.lists() }).catch(() => undefined);
      },
    });
  }

  function useUpdate(
    options: ReferenceDataMutationHookOptions
  ): UseMutationResult<void, Error, ReferenceDataUpdateVariables> {
    const { client, basePath = defaultBasePath } = options;
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ code, data }: ReferenceDataUpdateVariables) =>
        updateReferenceDataEntry(client, basePath, code, data),
      onSuccess: (_data, { code }) => {
        queryClient.invalidateQueries({ queryKey: keys.lists() }).catch(() => undefined);
        queryClient.invalidateQueries({ queryKey: keys.detail(code) }).catch(() => undefined);
      },
    });
  }

  function useDeactivate(
    options: ReferenceDataMutationHookOptions
  ): UseMutationResult<void, Error, string> {
    const { client, basePath = defaultBasePath } = options;
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (code: string) => deactivateReferenceDataEntry(client, basePath, code),
      onSuccess: (_data, code) => {
        queryClient.invalidateQueries({ queryKey: keys.lists() }).catch(() => undefined);
        queryClient.invalidateQueries({ queryKey: keys.detail(code) }).catch(() => undefined);
      },
    });
  }

  return { keys, useList, useEntry, useChildren, useCreate, useUpdate, useDeactivate };
}
