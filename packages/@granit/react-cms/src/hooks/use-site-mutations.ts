'use client';

import { createSite, deleteSite, updateSite } from '@granit/cms';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { CreateSiteRequest, SiteResponse, UpdateSiteRequest } from '@granit/cms';
import type { UseMutationResult } from '@tanstack/react-query';

export function useCreateSite(): UseMutationResult<SiteResponse, Error, CreateSiteRequest> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => createSite(client, basePath, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.sites.all(queryKeyPrefix) });
    },
  });
}

export function useUpdateSite(): UseMutationResult<
  SiteResponse,
  Error,
  { id: string; request: UpdateSiteRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updateSite(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.sites.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsKeys.sites.all(queryKeyPrefix) });
    },
  });
}

export function useDeleteSite(): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteSite(client, basePath, id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: cmsKeys.sites.detail(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: cmsKeys.sites.all(queryKeyPrefix) });
    },
  });
}
