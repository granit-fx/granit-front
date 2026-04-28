import {
  deleteLocalizationOverride,
  listLanguages,
  setLocalizationOverride,
  updateLanguageStatus,
} from '@granit/localization';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AxiosInstance } from '@granit/api-client';
import type { AdminLanguage } from '@granit/localization';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export interface LocalizationAdminOptions {
  readonly client: AxiosInstance;
  readonly basePath?: string;
}

const LANGUAGES_KEY = ['localization', 'languages'] as const;
const OVERRIDES_KEY = ['localization', 'overrides'] as const;

/**
 * List all languages with admin enable/disable status.
 */
export function useLanguages(options: LocalizationAdminOptions): UseQueryResult<AdminLanguage[]> {
  const { client, basePath = '' } = options;

  return useQuery({
    queryKey: [...LANGUAGES_KEY],
    queryFn: () => listLanguages(client, basePath),
  });
}

export type ToggleLanguageVariables = {
  readonly cultureName: string;
  readonly isEnabled: boolean;
};

/**
 * Enable or disable a language.
 * Invalidates language queries on success.
 */
export function useToggleLanguage(
  options: LocalizationAdminOptions
): UseMutationResult<void, Error, ToggleLanguageVariables> {
  const { client, basePath = '' } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cultureName, isEnabled }: ToggleLanguageVariables) =>
      updateLanguageStatus(client, basePath, cultureName, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LANGUAGES_KEY] });
    },
  });
}

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
  const { client, basePath = '' } = options;
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
  const { client, basePath = '' } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resourceName, cultureName, key }: DeleteOverrideVariables) =>
      deleteLocalizationOverride(client, basePath, resourceName, cultureName, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...OVERRIDES_KEY] });
    },
  });
}
