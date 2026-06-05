import { deleteLocalizationOverride, setLocalizationOverride } from '@granit/localization';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { UseMutationResult } from '@tanstack/react-query';

export interface LocalizationAdminOptions {
  readonly client: AxiosInstance;
  /** Localization module root. Default: `/api/v1/localization`. */
  readonly basePath?: string;
}

const OVERRIDES_KEY = ['localization', 'overrides'] as const;

/**
 * Mints ONE idempotency key per logical mutation and reuses it across every
 * retry of that operation. TanStack Query passes the same `variables` reference
 * on each retry, so keying by that reference yields a stable `Idempotency-Key`
 * — a retry after an ambiguous failure replays the original write instead of
 * re-applying it. A fresh `mutate()` call gets a new key.
 */
function useIdempotencyKeyFor<V extends object>(): (variables: V) => string {
  const mapRef = useRef<WeakMap<V, string> | null>(null);
  return (variables: V) => {
    const map = (mapRef.current ??= new WeakMap<V, string>());
    let key = map.get(variables);
    if (key === undefined) {
      key = crypto.randomUUID();
      map.set(variables, key);
    }
    return key;
  };
}

export type SetOverrideVariables = {
  readonly resourceName: string;
  readonly cultureName: string;
  readonly key: string;
  readonly value: string;
};

/**
 * Create or update a localization override (idempotent, retry-safe).
 * Invalidates override queries on success.
 */
export function useSetLocalizationOverride(
  options: LocalizationAdminOptions
): UseMutationResult<void, Error, SetOverrideVariables> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();
  const idempotencyKeyFor = useIdempotencyKeyFor<SetOverrideVariables>();

  return useMutation({
    mutationFn: (variables: SetOverrideVariables) =>
      setLocalizationOverride(
        client,
        basePath,
        variables.resourceName,
        variables.cultureName,
        variables.key,
        variables.value,
        idempotencyKeyFor(variables)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...OVERRIDES_KEY] });
    },
  });
}

export type DeleteOverrideVariables = {
  readonly resourceName: string;
  readonly cultureName: string;
  readonly key: string;
};

/**
 * Delete a localization override (idempotent, retry-safe).
 * Invalidates override queries on success.
 */
export function useDeleteLocalizationOverride(
  options: LocalizationAdminOptions
): UseMutationResult<void, Error, DeleteOverrideVariables> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();
  const idempotencyKeyFor = useIdempotencyKeyFor<DeleteOverrideVariables>();

  return useMutation({
    mutationFn: (variables: DeleteOverrideVariables) =>
      deleteLocalizationOverride(
        client,
        basePath,
        variables.resourceName,
        variables.cultureName,
        variables.key,
        idempotencyKeyFor(variables)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...OVERRIDES_KEY] });
    },
  });
}
