import {
  getSeoDefaults,
  getSeoMetadata,
  getOgCardPreview,
  getJsonLdPreview,
  getSerpPreview,
  listSeoAuditIssues,
} from '@granit/cms-seo';
import { useQuery } from '@tanstack/react-query';

import { useCmsSeoConfig } from '../providers/cms-seo-provider';

import { cmsSeoKeys } from './query-keys';

import type { SeoContentKey } from './query-keys';
import type {
  ListSeoMetadataParams,
  OgCardPreviewResponse,
  PagedResponse,
  SeoAuditIssueResponse,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';
import type { UseQueryResult } from '@tanstack/react-query';

export function useSeoMetadata(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SeoMetadataResponse | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const enabled =
    (options?.enabled ?? true) &&
    key.siteId.length > 0 &&
    key.contentType.length > 0 &&
    key.contentId.length > 0 &&
    key.culture.length > 0;
  return useQuery({
    queryKey: cmsSeoKeys.metadata.detail(queryKeyPrefix, key),
    queryFn: () => getSeoMetadata(client, basePath, key),
    enabled,
  });
}

export function useSeoDefaults(
  siteId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SiteSeoDefaultsResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.defaults.detail(queryKeyPrefix, siteId),
    queryFn: () => getSeoDefaults(client, basePath, siteId),
    enabled: (options?.enabled ?? true) && siteId.length > 0,
  });
}

export function useSeoAuditIssues(
  params?: ListSeoMetadataParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResponse<SeoAuditIssueResponse>> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.audit.list(queryKeyPrefix, params),
    queryFn: () => listSeoAuditIssues(client, basePath, params),
    enabled: options?.enabled ?? true,
  });
}

export function useSerpPreview(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SerpPreviewResponse | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const enabled =
    (options?.enabled ?? true) &&
    key.siteId.length > 0 &&
    key.contentType.length > 0 &&
    key.contentId.length > 0 &&
    key.culture.length > 0;
  return useQuery({
    queryKey: cmsSeoKeys.metadata.serp(queryKeyPrefix, key),
    queryFn: () => getSerpPreview(client, basePath, key),
    enabled,
  });
}

export function useOgCardPreview(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<OgCardPreviewResponse | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const enabled =
    (options?.enabled ?? true) &&
    key.siteId.length > 0 &&
    key.contentType.length > 0 &&
    key.contentId.length > 0 &&
    key.culture.length > 0;
  return useQuery({
    queryKey: cmsSeoKeys.metadata.og(queryKeyPrefix, key),
    queryFn: () => getOgCardPreview(client, basePath, key),
    enabled,
  });
}

export function useJsonLdPreview(
  key: SeoContentKey,
  options?: { readonly enabled?: boolean }
): UseQueryResult<readonly unknown[] | null> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const enabled =
    (options?.enabled ?? true) &&
    key.siteId.length > 0 &&
    key.contentType.length > 0 &&
    key.contentId.length > 0 &&
    key.culture.length > 0;
  return useQuery({
    queryKey: cmsSeoKeys.metadata.jsonld(queryKeyPrefix, key),
    queryFn: () => getJsonLdPreview(client, basePath, key),
    enabled,
  });
}
