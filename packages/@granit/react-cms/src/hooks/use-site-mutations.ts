'use client';

import {
  clearSiteHomePage,
  createSite,
  deleteSite,
  setSiteHomePage,
  updateSite,
} from '@granit/cms';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type {
  CreateSiteRequest,
  SetSiteHomePageRequest,
  SiteResponse,
  UpdateSiteRequest,
} from '@granit/cms';
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

export function useSetSiteHomePage(): UseMutationResult<
  SiteResponse,
  Error,
  { id: string; request: SetSiteHomePageRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => setSiteHomePage(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.sites.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsKeys.sites.all(queryKeyPrefix) });
    },
  });
}

export function useClearSiteHomePage(): UseMutationResult<SiteResponse, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => clearSiteHomePage(client, basePath, id),
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
