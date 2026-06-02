import type {
  OgCardPreviewResponse,
  PagedResponse,
  SeoAuditIssueResponse,
  SeoAuditIssueType,
  SeoMetadataRequest,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

export interface ListSeoMetadataParams {
  readonly siteId?: string;
  readonly contentType?: string;
  readonly issueType?: SeoAuditIssueType;
  readonly page?: number;
  readonly pageSize?: number;
}

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
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}`,
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
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}`,
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
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}`
  );
}

/** `GET /api/cms/seo/sites/{siteId}/defaults`. Requires `Cms.Seo.Read`. */
export async function getSeoDefaults(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<SiteSeoDefaultsResponse> {
  const res = await client.get<SiteSeoDefaultsResponse>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/defaults`
  );
  return res.data;
}

/** `PUT /api/cms/seo/sites/{siteId}/defaults`. Requires `Cms.Seo.Manage`. */
export async function updateSeoDefaults(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  request: SiteSeoDefaultsRequest
): Promise<SiteSeoDefaultsResponse> {
  const res = await client.put<SiteSeoDefaultsResponse>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/defaults`,
    request
  );
  return res.data;
}

/** `GET /api/cms/seo/metadata` — audit grid (paged, filterable). Requires `Cms.Seo.Read`. */
export async function listSeoAuditIssues(
  client: AxiosInstance,
  basePath: string,
  params?: ListSeoMetadataParams
): Promise<PagedResponse<SeoAuditIssueResponse>> {
  const res = await client.get<PagedResponse<SeoAuditIssueResponse>>(
    `${basePath}/api/cms/seo/metadata`,
    { params }
  );
  return res.data;
}

/** `POST /api/cms/seo/sites/{siteId}/sitemap/invalidate` — rebuild sitemap on next read. Requires `Cms.Seo.Manage`. */
export async function invalidateSitemap(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<void> {
  await client.post(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/sitemap/invalidate`
  );
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
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/preview/serp`,
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
): Promise<OgCardPreviewResponse | null> {
  const { siteId, contentType, contentId, culture } = params;
  const res = await client.get<OgCardPreviewResponse>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/preview/og`,
    { validateStatus: (s) => s === 200 || s === 204 }
  );
  return res.status === 204 ? null : res.data;
}

/** `GET .../metadata/{contentType}/{contentId}/{culture}/preview/jsonld`. Returns `@graph` array or `null` (204). Requires `Cms.Seo.Read`. */
export async function getJsonLdPreview(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
  }
): Promise<readonly unknown[] | null> {
  const { siteId, contentType, contentId, culture } = params;
  const res = await client.get<readonly unknown[]>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/preview/jsonld`,
    { validateStatus: (s) => s === 200 || s === 204 }
  );
  return res.status === 204 ? null : res.data;
}
