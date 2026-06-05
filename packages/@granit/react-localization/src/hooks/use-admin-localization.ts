import { deleteLocalizationOverride, setLocalizationOverride } from '@granit/localization';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { UseMutationResult } from '@tanstack/react-query';

export interface LocalizationAdminOptions {
  readonly client: AxiosInstance;
  /** Localization module root. Default: `/api/v1/localization`. */
  readonly basePath?: string;
}

const OVERRIDES_KEY = ['localization', 'overrides'] as const;

export type SetOverrideVariables = {
  readonly resourceName: string;
  readonly cultureName: string;
  readonly key: string;
  readonly value: string;
};

/**
 * Create or update a localization override.
 * Invalidates override queries on success.
 */
export function useSetLocalizationOverride(
  options: LocalizationAdminOptions
): UseMutationResult<void, Error, SetOverrideVariables> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceName, cultureName, key, value }: SetOverrideVariables) =>
      setLocalizationOverride(client, basePath, resourceName, cultureName, key, value),
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
 * Delete a localization override.
 * Invalidates override queries on success.
 */
export function useDeleteLocalizationOverride(
  options: LocalizationAdminOptions
): UseMutationResult<void, Error, DeleteOverrideVariables> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceName, cultureName, key }: DeleteOverrideVariables) =>
      deleteLocalizationOverride(client, basePath, resourceName, cultureName, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...OVERRIDES_KEY] });
    },
  });
}
