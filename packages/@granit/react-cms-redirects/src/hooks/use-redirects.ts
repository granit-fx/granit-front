'use client';

import {
  getRedirect,
  getRedirectsGrid,
  getRedirectsGridMeta,
  getRedirectSettings,
  listRedirects,
  previewRedirect,
} from '@granit/cms-redirects';
import { useQuery } from '@tanstack/react-query';

import { logger } from '../logger';
import { useCmsRedirectsConfig } from '../providers/cms-redirects-provider';

import { cmsRedirectsKeys } from './query-keys';

import type {
  PagedResult,
  QueryMetadata,
  QueryRequest,
  RedirectPreviewResponse,
  RedirectResponse,
  SiteRedirectSettingsResponse,
} from '@granit/cms-redirects';
import type { UseQueryResult } from '@tanstack/react-query';

/** Flat list of a site's redirects (active and inactive). Requires a non-empty `siteId`. */
export function useRedirects(
  siteId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly RedirectResponse[]> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  return useQuery({
    queryKey: cmsRedirectsKeys.list(queryKeyPrefix, siteId),
    queryFn: async () => {
      logger.debug('Fetching redirects list', { siteId });
      const data = await listRedirects(client, basePath, siteId);
      logger.debug('Loaded redirects list', { siteId, count: data.length });
      return data;
    },
    enabled: (options?.enabled ?? true) && siteId.length > 0,
  });
}

/** A single redirect by id. */
export function useRedirect(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<RedirectResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  return useQuery({
    queryKey: cmsRedirectsKeys.detail(queryKeyPrefix, id),
    queryFn: () => {
      logger.debug('Fetching redirect', { id });
      return getRedirect(client, basePath, id);
    },
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

/** Paginated / filterable / sortable admin grid backed by QueryEngine. */
export function useRedirectsGrid(
  request: QueryRequest,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<RedirectResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  return useQuery({
    queryKey: cmsRedirectsKeys.grid(queryKeyPrefix, request),
    queryFn: async ({ signal }) => {
      logger.debug('Fetching redirects grid');
      const page = await getRedirectsGrid(client, basePath, request, { signal });
      logger.debug('Loaded redirects grid', { count: page.items.length, total: page.totalCount });
      return page;
    },
    enabled: options?.enabled ?? true,
  });
}

/** Column / filter / preset metadata for the admin grid. Static per deployment. */
export function useRedirectsGridMeta(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<QueryMetadata> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  return useQuery({
    queryKey: cmsRedirectsKeys.gridMeta(queryKeyPrefix),
    queryFn: ({ signal }) => getRedirectsGridMeta(client, basePath, { signal }),
    staleTime: Infinity,
    enabled: options?.enabled ?? true,
  });
}

/** A site's redirect settings (defaults when unsaved). Requires a non-empty `siteId`. */
export function useRedirectSettings(
  siteId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SiteRedirectSettingsResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  return useQuery({
    queryKey: cmsRedirectsKeys.settings(queryKeyPrefix, siteId),
    queryFn: () => {
      logger.debug('Fetching redirect settings', { siteId });
      return getRedirectSettings(client, basePath, siteId);
    },
    enabled: (options?.enabled ?? true) && siteId.length > 0,
  });
}

/** Admin preview: resolve a candidate path against the live redirect table. */
export function useRedirectPreview(
  siteId: string,
  params: { path: string; culture?: string },
  options?: { readonly enabled?: boolean }
): UseQueryResult<RedirectPreviewResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsRedirectsConfig();
  return useQuery({
    queryKey: cmsRedirectsKeys.preview(queryKeyPrefix, siteId, params.path, params.culture),
    queryFn: () => previewRedirect(client, basePath, siteId, params),
    enabled: (options?.enabled ?? true) && siteId.length > 0 && params.path.length > 0,
  });
}
