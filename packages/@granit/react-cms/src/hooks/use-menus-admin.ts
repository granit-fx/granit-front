'use client';

import { getMenu, listMenus } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { ListMenusParams, MenuResponse, PagedResponse } from '@granit/cms';
import type { UseQueryResult } from '@tanstack/react-query';

export function useMenus(
  params?: ListMenusParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResponse<MenuResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.menus.list(queryKeyPrefix, params?.siteId),
    queryFn: () => listMenus(client, basePath, params),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useMenu(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<MenuResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.menus.detail(queryKeyPrefix, id),
    queryFn: () => getMenu(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
