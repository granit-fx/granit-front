import { createMenu, deleteMenu, updateMenu } from '@granit/cms';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { CreateMenuRequest, MenuResponse, UpdateMenuRequest } from '@granit/cms';
import type { UseMutationResult } from '@tanstack/react-query';

export function useCreateMenu(): UseMutationResult<MenuResponse, Error, CreateMenuRequest> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => createMenu(client, basePath, req),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: cmsKeys.menus.list(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useUpdateMenu(): UseMutationResult<
  MenuResponse,
  Error,
  { id: string; request: UpdateMenuRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updateMenu(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.menus.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsKeys.menus.list(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useDeleteMenu(): UseMutationResult<void, Error, { id: string; siteId: string }> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteMenu(client, basePath, id),
    onSuccess: (_data, { id, siteId }) => {
      qc.removeQueries({ queryKey: cmsKeys.menus.detail(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: cmsKeys.menus.list(queryKeyPrefix, siteId) });
    },
  });
}
