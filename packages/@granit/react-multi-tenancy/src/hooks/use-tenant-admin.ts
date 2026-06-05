import {
  activateTenant,
  createTenant,
  deactivateTenant,
  getTenant,
  updateTenant,
} from '@granit/multi-tenancy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildTenantAdminQueryKey, useTenantAdminConfig } from '../providers/tenant-admin-provider';

import type { AdminTenant, CreateTenantRequest, UpdateTenantRequest } from '@granit/multi-tenancy';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single tenant by ID. Disabled when id is empty. */
export function useTenantDetail(id: string): UseQueryResult<AdminTenant> {
  const config = useTenantAdminConfig();

  return useQuery({
    queryKey: [...buildTenantAdminQueryKey(config, 'tenants'), id],
    queryFn: () => getTenant(config.client, config.basePath!, id),
    enabled: id.length > 0,
  });
}

/** Creates a new tenant. Invalidates tenant list on success. */
export function useCreateTenant(): UseMutationResult<AdminTenant, Error, CreateTenantRequest> {
  const config = useTenantAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTenantRequest) =>
      createTenant(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildTenantAdminQueryKey(config, 'tenants'),
      });
    },
  });
}

/** Updates a tenant. Invalidates tenant list on success. */
export function useUpdateTenant(): UseMutationResult<
  void,
  Error,
  { id: string; request: UpdateTenantRequest }
> {
  const config = useTenantAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => updateTenant(config.client, config.basePath!, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildTenantAdminQueryKey(config, 'tenants'),
      });
    },
  });
}

/** Activates a tenant. Invalidates tenant list on success. */
export function useActivateTenant(): UseMutationResult<void, Error, string> {
  const config = useTenantAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateTenant(config.client, config.basePath!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildTenantAdminQueryKey(config, 'tenants'),
      });
    },
  });
}

/** Deactivates a tenant. Invalidates tenant list on success. */
export function useDeactivateTenant(): UseMutationResult<void, Error, string> {
  const config = useTenantAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateTenant(config.client, config.basePath!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildTenantAdminQueryKey(config, 'tenants'),
      });
    },
  });
}
