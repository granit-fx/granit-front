'use client';

import { getPageEditingPresence, leavePageEditing, sendPageEditingHeartbeat } from '@granit/cms';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { PageEditingPresenceResponse } from '@granit/cms';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Lists the editors currently in a page's editing room
 * (`GET /api/cms/pages/{id}/editing`). Poll via `refetchInterval` from the
 * caller if live awareness is needed. Requires `Cms.Pages.Read`.
 */
export function usePageEditingPresence(
  siteId: string,
  id: string,
  options?: { readonly enabled?: boolean; readonly refetchInterval?: number }
): UseQueryResult<PageEditingPresenceResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.pages.editing(queryKeyPrefix, id),
    queryFn: () => getPageEditingPresence(client, basePath, siteId, id),
    enabled: (options?.enabled ?? true) && siteId.length > 0 && id.length > 0,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Sends a presence heartbeat (`POST /api/cms/pages/{id}/editing/heartbeat`).
 * Returns the active editors and seeds the presence query cache.
 * Requires `Cms.Pages.Manage`.
 */
export function usePageEditingHeartbeat(): UseMutationResult<
  PageEditingPresenceResponse,
  Error,
  { siteId: string; id: string }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, id }) => sendPageEditingHeartbeat(client, basePath, siteId, id),
    onSuccess: (data, { id }) => {
      qc.setQueryData(cmsKeys.pages.editing(queryKeyPrefix, id), data);
    },
  });
}

/**
 * Leaves a page's editing room (`DELETE /api/cms/pages/{id}/editing`).
 * Requires `Cms.Pages.Manage`.
 */
export function useLeavePageEditing(): UseMutationResult<
  void,
  Error,
  { siteId: string; id: string }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, id }) => leavePageEditing(client, basePath, siteId, id),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.editing(queryKeyPrefix, id) });
    },
  });
}
