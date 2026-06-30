import { serializeQueryRequest } from '@granit/query-engine';

import type {
  ListSeoMetadataParams,
  OgPreviewResponse,
  PagedResult,
  SeoMetadataListItem,
  SeoMetadataRequest,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { QueryMetadata } from '@granit/query-engine';

/**
 * `GET /api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}` — raw metadata.
 * Returns `null` on `404` (no explicit metadata at this level).
 * Requires `Cms.Seo.Read`.
 */
export async function getSeoMetadata(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
  }
): Promise<SeoMetadataResponse | null> {
  const { siteId, contentType, contentId, culture } = params;
  const res = await client.get<SeoMetadataResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}`,
    { validateStatus: (s) => s === 200 || s === 404 }
  );
  return res.status === 404 ? null : res.data;
}

/**
 * `PUT /api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}` — upsert.
 * Requires `Cms.Seo.Manage`.
 */
export async function upsertSeoMetadata(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
  },
  request: SeoMetadataRequest
): Promise<SeoMetadataResponse> {
  const { siteId, contentType, contentId, culture } = params;
  const res = await client.put<SeoMetadataResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}`,
    request
  );
  return res.data;
}

/**
 * `DELETE /api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}`.
 * Returns `204`. Requires `Cms.Seo.Manage`.
 */
export async function deleteSeoMetadata(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
  }
): Promise<void> {
  const { siteId, contentType, contentId, culture } = params;
  await client.delete(
    `${basePath}/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}`
  );
}

/**
 * `GET /api/cms/seo/sites/{siteId}/defaults`. Requires `Cms.Seo.Read`.
 * Returns `null` when no defaults row has been saved for the site yet (404).
 */
export async function getSeoDefaults(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<SiteSeoDefaultsResponse | null> {
  const res = await client.get<SiteSeoDefaultsResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/defaults`,
    { validateStatus: (s) => s === 200 || s === 404 }
  );
  return res.status === 404 ? null : res.data;
}

/** `PUT /api/cms/seo/sites/{siteId}/defaults`. Requires `Cms.Seo.Manage`. */
export async function updateSeoDefaults(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: SiteSeoDefaultsRequest
): Promise<SiteSeoDefaultsResponse> {
  const res = await client.put<SiteSeoDefaultsResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/defaults`,
    request
  );
  return res.data;
}

/**
 * `GET /api/cms/seo/metadata` — SEO audit grid (`MapGranitQuery<SeoMetadata>`):
 * paged / filterable / sortable, with the quick filters declared by
 * `SeoMetadataQueryDefinition`. Requires `Cms.Seo.Read`.
 */
export async function listSeoMetadata(
  client: AxiosInstance,
  basePath: string,
  params?: ListSeoMetadataParams,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<SeoMetadataListItem>> {
  const qs = params ? serializeQueryRequest(params) : '';
  const suffix = qs ? `?${qs}` : '';
  const url = `${basePath}/metadata${suffix}`;
  const res = await client.get<PagedResult<SeoMetadataListItem>>(url, options);
  return res.data;
}

/**
 * `GET /api/cms/seo/metadata/meta` — query metadata for the SEO audit grid
 * (`MapGranitQuery<SeoMetadata>`): the filterable / sortable columns and the
 * `SeoMetadataQueryDefinition` quick filters (`MissingDescription`,
 * `NoCanonical`, `TitleTooLong`, `MissingOgImage`) backing the toolbar.
 * Requires `Cms.Seo.Read`.
 */
export async function getSeoMetadataMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  const res = await client.get<QueryMetadata>(`${basePath}/metadata/meta`);
  return res.data;
}

/** `POST /api/cms/seo/sites/{siteId}/sitemap/invalidate` — rebuild sitemap on next read. Requires `Cms.Seo.Manage`. */
export async function invalidateSitemap(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<void> {
  await client.post(`${basePath}/sites/${encodeURIComponent(siteId)}/sitemap/invalidate`);
}

/** `GET .../metadata/{contentType}/{contentId}/{culture}/preview/serp`. Requires `Cms.Seo.Read`. */
export async function getSerpPreview(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
  }
): Promise<SerpPreviewResponse | null> {
  const { siteId, contentType, contentId, culture } = params;
  const res = await client.get<SerpPreviewResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/preview/serp`,
    { validateStatus: (s) => s === 200 || s === 204 }
  );
  return res.status === 204 ? null : res.data;
}

/** `GET .../metadata/{contentType}/{contentId}/{culture}/preview/og`. Requires `Cms.Seo.Read`. */
export async function getOgCardPreview(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
  }
): Promise<OgPreviewResponse | null> {
  const { siteId, contentType, contentId, culture } = params;
  const res = await client.get<OgPreviewResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/preview/og`,
    { validateStatus: (s) => s === 200 || s === 204 }
  );
  return res.status === 204 ? null : res.data;
}

/**
 * `GET .../metadata/{contentType}/{contentId}/{culture}/preview/jsonld`. Returns
 * the raw JSON-LD `@graph` document (`application/ld+json`) or `null` (204).
 * Requires `Cms.Seo.Read`.
 */
export async function getJsonLdPreview(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
  }
): Promise<string | null> {
  const { siteId, contentType, contentId, culture } = params;
  const res = await client.get<string>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/preview/jsonld`,
    { responseType: 'text', validateStatus: (s) => s === 200 || s === 204 }
  );
  return res.status === 204 ? null : res.data;
}
