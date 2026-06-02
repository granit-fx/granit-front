import { createRedirect, deleteRedirect, updateRedirect } from '@granit/cms-redirects';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsRedirectsConfig } from '../providers/cms-redirects-provider';

import { cmsRedirectsKeys } from './query-keys';

import type {
  CreateRedirectRequest,
  RedirectResponse,
  UpdateRedirectRequest,
} from '@granit/cms-redirects';
import type { UseMutationResult } from '@tanstack/react-query';

export function useCreateRedirect(): UseMutationResult<
  RedirectResponse,
  Error,
  CreateRedirectRequest
> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => createRedirect(client, basePath, req),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: cmsRedirectsKeys.list(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useUpdateRedirect(): UseMutationResult<
  RedirectResponse,
  Error,
  { id: string; request: UpdateRedirectRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updateRedirect(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsRedirectsKeys.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsRedirectsKeys.list(queryKeyPrefix, data.siteId) });
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
      qc.invalidateQueries({ queryKey: cmsRedirectsKeys.list(queryKeyPrefix, siteId) });
    },
  });
}
