'use client';

import { searchPages, searchPagesAdmin } from '@granit/cms';
import { useQuery } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type { PageSearchPageResponse, PageSearchParams } from '@granit/cms';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Admin page search (`GET /api/cms/pages/search`) across every site in the
 * tenant. Disabled until `q` is non-empty. Requires `Cms.Pages.Read`.
 */
export function useSearchPagesAdmin(
  params: PageSearchParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PageSearchPageResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.pages.search(queryKeyPrefix, params),
    queryFn: () => searchPagesAdmin(client, basePath, params),
    enabled: (options?.enabled ?? true) && params.q.length > 0 && params.culture.length > 0,
  });
}

/**
 * Public, site-scoped page search (`GET /api/cms/search`). Anonymous; the site
 * is sent via the `X-Granit-Site` header. Disabled until `q`/`culture` are set.
 */
export function useSearchPages(
  siteId: string,
  params: PageSearchParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PageSearchPageResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  return useQuery({
    queryKey: cmsKeys.search.public(queryKeyPrefix, siteId, params),
    queryFn: () => searchPages(client, basePath, siteId, params),
    enabled:
      (options?.enabled ?? true) &&
      siteId.length > 0 &&
      params.q.length > 0 &&
      params.culture.length > 0,
  });
}
