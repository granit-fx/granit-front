import {
  addSiteHostname,
  clearSiteHostnamePrimary,
  removeSiteHostname,
  setSiteHostnamePrimary,
  verifySiteHostname,
} from '@granit/cms-hostnames';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsHostnamesConfig } from '../providers/cms-hostnames-provider';

import { cmsHostnamesKeys } from './query-keys';

import type { CreateManagedHostnameRequest, ManagedHostnameResponse } from '@granit/hostnames';
import type { UseMutationResult } from '@tanstack/react-query';

export function useAddSiteHostname(
  siteId: string
): UseMutationResult<
  ManagedHostnameResponse,
  Error,
  Pick<CreateManagedHostnameRequest, 'host' | 'isPrimary'>
> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => addSiteHostname(client, basePath, siteId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}

export function useRemoveSiteHostname(siteId: string): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hostnameId) => removeSiteHostname(client, basePath, siteId, hostnameId),
    onSuccess: (_data, hostnameId) => {
      qc.removeQueries({ queryKey: cmsHostnamesKeys.detail(queryKeyPrefix, siteId, hostnameId) });
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}

export function useSetSiteHostnamePrimary(siteId: string): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hostnameId) => setSiteHostnamePrimary(client, basePath, siteId, hostnameId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}

export function useClearSiteHostnamePrimary(
  siteId: string
): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hostnameId) => clearSiteHostnamePrimary(client, basePath, siteId, hostnameId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}

export function useVerifySiteHostname(
  siteId: string
): UseMutationResult<ManagedHostnameResponse, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsHostnamesConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hostnameId) => verifySiteHostname(client, basePath, siteId, hostnameId),
    onSuccess: (data) => {
      qc.setQueryData(cmsHostnamesKeys.detail(queryKeyPrefix, siteId, data.id), data);
      qc.invalidateQueries({ queryKey: cmsHostnamesKeys.list(queryKeyPrefix, siteId) });
    },
  });
}
