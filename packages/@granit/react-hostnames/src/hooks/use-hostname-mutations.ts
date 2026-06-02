import {
  createHostname,
  deleteHostname,
  updateHostname,
  verifyNow,
} from '@granit/hostnames';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useHostnamesConfig } from '../providers/hostnames-provider';

import { hostnamesKeys } from './query-keys';

import type {
  CreateManagedHostnameRequest,
  ManagedHostnameResponse,
  UpdateManagedHostnameRequest,
} from '@granit/hostnames';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Mutation hook to create a new managed hostname.
 *
 * Invalidates hostname list queries on success.
 *
 * @example
 * ```tsx
 * const { mutateAsync: create } = useCreateHostname();
 * const hostname = await create({ host: 'app.example.com', ownerType: 'cms.site', ownerId: 'owner-1' });
 * ```
 */
export function useCreateHostname(): UseMutationResult<
  ManagedHostnameResponse,
  Error,
  CreateManagedHostnameRequest
> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateManagedHostnameRequest) =>
      createHostname(client, basePath, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: hostnamesKeys.lists() });
    },
  });
}

/**
 * Mutation hook to update a managed hostname's `isPrimary` flag.
 *
 * Invalidates the affected hostname and list queries on success.
 *
 * @example
 * ```tsx
 * const { mutate: update } = useUpdateHostname();
 * update({ id: 'hostname-id', request: { isPrimary: true } });
 * ```
 */
export function useUpdateHostname(): UseMutationResult<
  ManagedHostnameResponse,
  Error,
  { id: string; request: UpdateManagedHostnameRequest }
> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => updateHostname(client, basePath, id, request),
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: hostnamesKeys.hostname(id) }),
        queryClient.invalidateQueries({ queryKey: hostnamesKeys.lists() }),
      ]);
    },
  });
}

/**
 * Mutation hook to delete a managed hostname.
 *
 * Invalidates hostname list queries on success.
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteHostname();
 * remove('hostname-id');
 * ```
 */
export function useDeleteHostname(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHostname(client, basePath, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: hostnamesKeys.lists() });
    },
  });
}

/**
 * Mutation hook to trigger an immediate DNS re-verification of a hostname.
 *
 * Invalidates the affected hostname query on success so the status refreshes.
 *
 * @example
 * ```tsx
 * const { mutate: trigger } = useVerifyNow();
 * trigger('hostname-id');
 * ```
 */
export function useVerifyNow(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => verifyNow(client, basePath, id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: hostnamesKeys.hostname(id) });
    },
  });
}
