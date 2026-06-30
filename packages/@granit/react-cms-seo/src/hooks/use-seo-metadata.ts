import {
  getEffectiveSeo,
  getSeoDefaults,
  getSeoMetadata,
  getSeoMetadataMeta,
  getOgCardPreview,
  getJsonLdPreview,
  getSerpPreview,
  listSeoMetadata,
} from '@granit/cms-seo';
import { useQuery } from '@tanstack/react-query';

import { READ_MOSTLY_STALE_TIME_MS } from '../constants';
import { logger } from '../logger';
import { useCmsSeoConfig } from '../providers/cms-seo-provider';

import { cmsSeoKeys } from './query-keys';

import type { SeoContentKey } from './query-keys';
import type {
  EffectiveSeoResponse,
  ListSeoMetadataParams,
  OgPreviewResponse,
  PagedResult,
  QueryMetadata,
  SeoMetadataListItem,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';
import type { UseQueryResult } from '@tanstack/react-query';

function isCompleteKey(key: SeoContentKey): boolean {
  return (
    key.siteId.length > 0 &&
    key.contentType.length > 0 &&
    key.contentId.length > 0 &&
    key.culture.length > 0
  );
}

export function useSeoMetadata(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SeoMetadataResponse | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.metadata.detail(queryKeyPrefix, key),
    queryFn: () => getSeoMetadata(client, basePath, key),
    enabled: (options?.enabled ?? true) && isCompleteKey(key),
  });
}

export function useEffectiveSeo(
  key: SeoContentKey,
  seed?: { readonly contentTitle?: string; readonly contentDescription?: string },
  options?: { readonly enabled?: boolean }
): UseQueryResult<EffectiveSeoResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.metadata.effective(queryKeyPrefix, key),
    queryFn: () => getEffectiveSeo(client, basePath, { ...key, ...seed }),
    enabled: (options?.enabled ?? true) && isCompleteKey(key),
    staleTime: READ_MOSTLY_STALE_TIME_MS,
  });
}

export function useSeoDefaults(
  siteId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SiteSeoDefaultsResponse | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.defaults.detail(queryKeyPrefix, siteId),
    queryFn: () => getSeoDefaults(client, basePath, siteId),
    enabled: (options?.enabled ?? true) && siteId.length > 0,
    staleTime: READ_MOSTLY_STALE_TIME_MS,
  });
}

export function useSeoMetadataAudit(
  params?: ListSeoMetadataParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<SeoMetadataListItem>> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.audit.list(queryKeyPrefix, params),
    queryFn: ({ signal }) => {
      logger.debug('Fetching SEO audit page', {
        filterCount: params?.filters?.length ?? 0,
        quickFilters: params?.quickFilters,
      });
      return listSeoMetadata(client, basePath, params, { signal });
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Query metadata for the SEO audit grid (`GET {basePath}/metadata/meta`): the
 * filterable / sortable columns and the quick filters declared by
 * `SeoMetadataQueryDefinition`. The shape is static for a given backend build,
 * so it never goes stale within a session (`staleTime: Infinity`).
 */
export function useSeoMetadataMeta(options?: {
  readonly enabled?: boolean;
}): UseQueryResult<QueryMetadata> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.audit.meta(queryKeyPrefix),
    queryFn: () => getSeoMetadataMeta(client, basePath),
    enabled: options?.enabled ?? true,
    staleTime: Infinity,
  });
}

export function useSerpPreview(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SerpPreviewResponse | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.metadata.serp(queryKeyPrefix, key),
    queryFn: () => getSerpPreview(client, basePath, key),
    enabled: (options?.enabled ?? true) && isCompleteKey(key),
    staleTime: READ_MOSTLY_STALE_TIME_MS,
  });
}

export function useOgCardPreview(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<OgPreviewResponse | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.metadata.og(queryKeyPrefix, key),
    queryFn: () => getOgCardPreview(client, basePath, key),
    enabled: (options?.enabled ?? true) && isCompleteKey(key),
    staleTime: READ_MOSTLY_STALE_TIME_MS,
  });
}

export function useJsonLdPreview(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<string | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.metadata.jsonld(queryKeyPrefix, key),
    queryFn: () => getJsonLdPreview(client, basePath, key),
    enabled: (options?.enabled ?? true) && isCompleteKey(key),
    staleTime: READ_MOSTLY_STALE_TIME_MS,
  });
}
