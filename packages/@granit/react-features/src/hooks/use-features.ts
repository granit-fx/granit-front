import {
  deleteFeatureOverride,
  getAllFeatureValues,
  getFeatureDefinitions,
  getFeatureValue,
  setFeatureOverride,
} from '@granit/features';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildFeaturesQueryKey, useFeaturesConfig } from '../providers/features-provider.js';

import type {
  FeatureGroupResponse,
  FeatureValueResponse,
  SetFeatureOverrideRequest,
} from '@granit/features';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

const DEFAULT_BASE_PATH = '/api/granit/features';

/**
 * Fetch all feature definitions grouped by category.
 *
 * @example
 * ```tsx
 * const { data: groups } = useFeatureDefinitions();
 * ```
 */
export function useFeatureDefinitions(): UseQueryResult<readonly FeatureGroupResponse[]> {
  const config = useFeaturesConfig();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildFeaturesQueryKey(config, 'definitions'),
    queryFn: () => getFeatureDefinitions(config.client, basePath),
  });
}

/**
 * Fetch all resolved feature values for the current tenant.
 *
 * @example
 * ```tsx
 * const { data: values } = useFeatureValues();
 * ```
 */
export function useFeatureValues(): UseQueryResult<readonly FeatureValueResponse[]> {
  const config = useFeaturesConfig();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildFeaturesQueryKey(config, 'values'),
    queryFn: () => getAllFeatureValues(config.client, basePath),
  });
}

/**
 * Fetch the resolved value of a single feature flag.
 *
 * The query is automatically disabled when `name` is empty.
 *
 * @example
 * ```tsx
 * const { data: flag } = useFeatureValue('ui.dark-mode');
 * ```
 */
export function useFeatureValue(name: string): UseQueryResult<FeatureValueResponse> {
  const config = useFeaturesConfig();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useQuery({
    queryKey: buildFeaturesQueryKey(config, 'values', name),
    queryFn: () => getFeatureValue(config.client, basePath, name),
    enabled: name.length > 0,
  });
}

/** Variables for `useSetFeatureOverride` mutation. */
export type SetFeatureOverrideVariables = {
  readonly name: string;
  readonly request: SetFeatureOverrideRequest;
};

/**
 * Set a tenant-level override for a feature flag.
 * Invalidates definitions and values queries on success.
 *
 * @example
 * ```tsx
 * const setOverride = useSetFeatureOverride();
 * await setOverride.mutateAsync({ name: 'ui.dark-mode', request: { value: 'true' } });
 * ```
 */
export function useSetFeatureOverride(): UseMutationResult<
  void,
  Error,
  SetFeatureOverrideVariables
> {
  const config = useFeaturesConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useMutation({
    mutationFn: ({ name, request }: SetFeatureOverrideVariables) =>
      setFeatureOverride(config.client, basePath, name, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildFeaturesQueryKey(config, 'definitions'),
      });
      queryClient.invalidateQueries({
        queryKey: buildFeaturesQueryKey(config, 'values'),
      });
    },
  });
}

/**
 * Delete a tenant-level override, reverting to the default value.
 * Invalidates definitions and values queries on success.
 *
 * @example
 * ```tsx
 * const deleteOverride = useDeleteFeatureOverride();
 * await deleteOverride.mutateAsync('ui.dark-mode');
 * ```
 */
export function useDeleteFeatureOverride(): UseMutationResult<void, Error, string> {
  const config = useFeaturesConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath ?? DEFAULT_BASE_PATH;

  return useMutation({
    mutationFn: (name: string) => deleteFeatureOverride(config.client, basePath, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildFeaturesQueryKey(config, 'definitions'),
      });
      queryClient.invalidateQueries({
        queryKey: buildFeaturesQueryKey(config, 'values'),
      });
    },
  });
}
