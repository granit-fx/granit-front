import type { EffectiveSeoResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetches the cascade-resolved, render-ready SEO for a content item.
 * `GET {basePath}/api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}/effective`
 *
 * `contentTitle` and `contentDescription` seed the cascade when no explicit
 * title/description row exists for the content item.
 */
export async function getEffectiveSeo(
  client: AxiosInstance,
  basePath: string,
  params: {
    readonly siteId: string;
    readonly contentType: string;
    readonly contentId: string;
    readonly culture: string;
    readonly contentTitle?: string;
    readonly contentDescription?: string;
  }
): Promise<EffectiveSeoResponse> {
  const { siteId, contentType, contentId, culture, contentTitle, contentDescription } = params;
  const response = await client.get<EffectiveSeoResponse>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/effective`,
    { params: { contentTitle, contentDescription } }
  );
  return response.data;
}

/**
 * Public, anonymous sitemap document for a site (index or single urlset).
 * `GET {basePath}/api/cms/seo/sites/{siteId}/sitemap.xml` — returns raw XML.
 */
export async function getSitemap(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<string> {
  const res = await client.get<string>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/sitemap.xml`,
    { responseType: 'text' }
  );
  return res.data;
}

/**
 * A named child sitemap file referenced by the sitemap index.
 * `GET {basePath}/api/cms/seo/sites/{siteId}/sitemap/{file}` — returns raw XML
 * or `null` on `404`.
 */
export async function getSitemapFile(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  file: string
): Promise<string | null> {
  const res = await client.get<string>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/sitemap/${encodeURIComponent(file)}`,
    { responseType: 'text', validateStatus: (s) => s === 200 || s === 404 }
  );
  return res.status === 404 ? null : res.data;
}

/**
 * Public, anonymous `robots.txt` for a site.
 * `GET {basePath}/api/cms/seo/sites/{siteId}/robots.txt` — returns raw text.
 */
export async function getRobotsTxt(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<string> {
  const res = await client.get<string>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/robots.txt`,
    { responseType: 'text' }
  );
  return res.data;
}

/**
 * Public, anonymous PWA web app manifest for a site.
 * `GET {basePath}/api/cms/seo/sites/{siteId}/manifest.webmanifest` — returns the
 * raw `application/manifest+json` text, or `null` on `404` (no manifest set).
 */
export async function getManifest(
  client: AxiosInstance,
  basePath: string,
  siteId: string
): Promise<string | null> {
  const res = await client.get<string>(
    `${basePath}/api/cms/seo/sites/${encodeURIComponent(siteId)}/manifest.webmanifest`,
    { responseType: 'text', validateStatus: (s) => s === 200 || s === 404 }
  );
  return res.status === 404 ? null : res.data;
}
