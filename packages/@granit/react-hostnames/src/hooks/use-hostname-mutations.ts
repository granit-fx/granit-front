import {
  clearPrimary,
  createHostname,
  deleteHostname,
  reportCertificateStatus,
  setPrimary,
  verifyNow,
} from '@granit/hostnames';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useHostnamesConfig } from '../providers/hostnames-provider';

import { hostnamesKeys } from './query-keys';

import type {
  CertificateStatusReportRequest,
  CreateManagedHostnameRequest,
  ManagedHostnameResponse,
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
 * Mutation hook to mark a hostname as the owner's canonical (primary) hostname.
 *
 * Invalidates the affected hostname and list queries on success.
 *
 * @example
 * ```tsx
 * const { mutate: set } = useSetPrimary();
 * set('hostname-id');
 * ```
 */
export function useSetPrimary(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setPrimary(client, basePath, id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: hostnamesKeys.hostname(id) }),
        queryClient.invalidateQueries({ queryKey: hostnamesKeys.lists() }),
      ]);
    },
  });
}

/**
 * Mutation hook to clear the canonical (primary) flag from a hostname.
 *
 * Invalidates the affected hostname and list queries on success.
 *
 * @example
 * ```tsx
 * const { mutate: clear } = useClearPrimary();
 * clear('hostname-id');
 * ```
 */
export function useClearPrimary(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clearPrimary(client, basePath, id),
    onSuccess: async (_, id) => {
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
export function useVerifyNow(): UseMutationResult<ManagedHostnameResponse, Error, string> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => verifyNow(client, basePath, id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: hostnamesKeys.hostname(id) });
    },
  });
}

/**
 * Mutation hook to report a certificate status update from an external provider.
 *
 * Invalidates the affected hostname query on success.
 *
 * @example
 * ```tsx
 * const { mutate: report } = useReportCertificateStatus();
 * report({ id: 'hostname-id', request: { status: 'Secured', expiresAt: '2027-01-01T00:00:00Z' } });
 * ```
 */
export function useReportCertificateStatus(): UseMutationResult<
  void,
  Error,
  { id: string; request: CertificateStatusReportRequest }
> {
  const { client, basePath } = useHostnamesConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => reportCertificateStatus(client, basePath, id, request),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: hostnamesKeys.hostname(id) });
    },
  });
}
