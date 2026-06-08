import {
  getEffectiveSeo,
  getSeoDefaults,
  getSeoMetadata,
  getOgCardPreview,
  getJsonLdPreview,
  getSerpPreview,
  listSeoMetadata,
} from '@granit/cms-seo';
import { useQuery } from '@tanstack/react-query';

import { useCmsSeoConfig } from '../providers/cms-seo-provider';

import { cmsSeoKeys } from './query-keys';

import type { SeoContentKey } from './query-keys';
import type {
  EffectiveSeoResponse,
  ListSeoMetadataParams,
  OgPreviewResponse,
  PagedResult,
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
  });
}

export function useSeoMetadataAudit(
  params?: ListSeoMetadataParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResult<SeoMetadataListItem>> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.audit.list(queryKeyPrefix, params),
    queryFn: ({ signal }) => listSeoMetadata(client, basePath, params, { signal }),
    enabled: options?.enabled ?? true,
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
  });
}
