'use client';

import {
  createRedirect,
  deleteRedirect,
  updateRedirect,
  updateRedirectSettings,
} from '@granit/cms-redirects';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsRedirectsConfig } from '../providers/cms-redirects-provider';

import { cmsRedirectsKeys } from './query-keys';

import type {
  RedirectCreateRequest,
  RedirectMutationResult,
  RedirectUpdateRequest,
  SiteRedirectSettingsRequest,
  SiteRedirectSettingsResponse,
} from '@granit/cms-redirects';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

/** Invalidates the per-site list and the grid after a redirect mutation. */
function invalidateSiteRedirects(qc: QueryClient, prefix: readonly string[], siteId: string): void {
  qc.invalidateQueries({ queryKey: cmsRedirectsKeys.list(prefix, siteId) });
  // Invalidate every grid query regardless of its QueryRequest params.
  qc.invalidateQueries({ queryKey: [...prefix, 'redirects', 'grid'] });
}

export function useCreateRedirect(): UseMutationResult<
  RedirectMutationResult,
  Error,
  { siteId: string; request: RedirectCreateRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, request }) => createRedirect(client, basePath, siteId, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsRedirectsKeys.detail(queryKeyPrefix, data.redirect.id), data.redirect);
      invalidateSiteRedirects(qc, queryKeyPrefix, data.redirect.siteId);
    },
  });
}

export function useUpdateRedirect(): UseMutationResult<
  RedirectMutationResult,
  Error,
  { id: string; request: RedirectUpdateRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updateRedirect(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsRedirectsKeys.detail(queryKeyPrefix, data.redirect.id), data.redirect);
      invalidateSiteRedirects(qc, queryKeyPrefix, data.redirect.siteId);
    },
  });
}

export function useDeleteRedirect(): UseMutationResult<
  void,
  Error,
  { id: string; siteId: string }
> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteRedirect(client, basePath, id),
    onSuccess: (_data, { id, siteId }) => {
      qc.removeQueries({ queryKey: cmsRedirectsKeys.detail(queryKeyPrefix, id) });
      invalidateSiteRedirects(qc, queryKeyPrefix, siteId);
    },
  });
}

export function useUpdateRedirectSettings(): UseMutationResult<
  SiteRedirectSettingsResponse,
  Error,
  { siteId: string; request: SiteRedirectSettingsRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, request }) => updateRedirectSettings(client, basePath, siteId, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsRedirectsKeys.settings(queryKeyPrefix, data.siteId), data);
    },
  });
}
