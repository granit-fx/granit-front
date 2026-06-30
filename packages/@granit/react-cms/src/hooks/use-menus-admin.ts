'use client';

import { getMenu, getMenusMeta, listMenus } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { ListMenusParams, MenuResponse } from '@granit/cms';
import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

export function useMenus(
  params?: ListMenusParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<MenuResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.menus.list(queryKeyPrefix, params),
    queryFn: ({ signal }) => listMenus(client, basePath, params, { signal }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

/** Column / filter / preset metadata for the menus admin grid. Static per deployment. */
export function useMenusMeta(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<QueryMetadata> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.menus.meta(queryKeyPrefix),
    queryFn: ({ signal }) => getMenusMeta(client, basePath, { signal }),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
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
