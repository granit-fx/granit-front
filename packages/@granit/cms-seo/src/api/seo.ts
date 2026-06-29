import type { EffectiveSeoResponse } from '../types/index';
import type { AxiosInstance, RequestFetchOptions } from '@granit/api-client';

/**
 * Fetches the cascade-resolved, render-ready SEO for a content item.
 * `GET {basePath}/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}/effective`
 *
 * `contentTitle` and `contentDescription` seed the cascade when no explicit
 * title/description row exists for the content item.
 *
 * `fetchOptions` is forwarded verbatim to the fetch adapter (SSR caching hints).
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
  },
  fetchOptions?: RequestFetchOptions
): Promise<EffectiveSeoResponse> {
  const { siteId, contentType, contentId, culture, contentTitle, contentDescription } = params;
  const response = await client.get<EffectiveSeoResponse>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/metadata/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/${encodeURIComponent(culture)}/effective`,
    { params: { contentTitle, contentDescription }, ...(fetchOptions ? { fetchOptions } : {}) }
  );
  return response.data;
}

/**
 * Raw document response for the public SEO documents (sitemap / robots / manifest).
 * Surfaces the upstream `status`, `ETag` and `Last-Modified` so a server route can
 * do faithful conditional-GET pass-through (`If-None-Match` → `304`) and re-emit
 * the correct `Content-Type`. `body` is `null` on `304` (not modified) and `404`.
 */
export interface RawDocumentResult {
  readonly status: number;
  readonly body: string | null;
  readonly contentType?: string;
  readonly etag?: string;
  readonly lastModified?: string;
}

/** Per-request options for the raw SEO document reads. */
export interface RawDocumentOptions {
  /** Forwarded as `If-None-Match`; a matching upstream `ETag` yields `304` + `body: null`. */
  readonly ifNoneMatch?: string;
  /** Forwarded verbatim to the fetch adapter (SSR caching hints). */
  readonly fetchOptions?: RequestFetchOptions;
}

function readHeader(headers: unknown, name: string): string | undefined {
  const h = headers as { get?: (n: string) => string | null; [k: string]: unknown } | null;
  const value = typeof h?.get === 'function' ? h.get(name) : h?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toRawDocumentResult(res: {
  status: number;
  data: string;
  headers: unknown;
}): RawDocumentResult {
  const noBody = res.status === 304 || res.status === 404;
  return {
    status: res.status,
    body: noBody ? null : res.data,
    contentType: readHeader(res.headers, 'content-type'),
    etag: readHeader(res.headers, 'etag'),
    lastModified: readHeader(res.headers, 'last-modified'),
  };
}

function rawDocumentConfig(opts: RawDocumentOptions | undefined, allow404: boolean) {
  return {
    responseType: 'text' as const,
    validateStatus: (s: number) => s === 200 || s === 304 || (allow404 && s === 404),
    ...(opts?.ifNoneMatch ? { headers: { 'If-None-Match': opts.ifNoneMatch } } : {}),
    ...(opts?.fetchOptions ? { fetchOptions: opts.fetchOptions } : {}),
  };
}

/**
 * Public, anonymous sitemap document for a site (index or single urlset).
 * `GET {basePath}/sites/{siteId}/sitemap.xml` — returns raw XML.
 *
 * Supports conditional GET: pass `opts.ifNoneMatch` to relay the upstream `ETag`
 * and short-circuit on `304`. See {@link RawDocumentResult}.
 */
export async function getSitemap(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  opts?: RawDocumentOptions
): Promise<RawDocumentResult> {
  const res = await client.get<string>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/sitemap.xml`,
    rawDocumentConfig(opts, false)
  );
  return toRawDocumentResult(res);
}

/**
 * A named child sitemap file referenced by the sitemap index.
 * `GET {basePath}/sites/{siteId}/sitemap/{file}` — returns raw XML,
 * `status: 404` (with `body: null`) when the file does not exist.
 *
 * Supports conditional GET via `opts.ifNoneMatch`. See {@link RawDocumentResult}.
 */
export async function getSitemapFile(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  file: string,
  opts?: RawDocumentOptions
): Promise<RawDocumentResult> {
  const res = await client.get<string>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/sitemap/${encodeURIComponent(file)}`,
    rawDocumentConfig(opts, true)
  );
  return toRawDocumentResult(res);
}

/**
 * Public, anonymous `robots.txt` for a site.
 * `GET {basePath}/sites/{siteId}/robots.txt` — returns raw text.
 *
 * Supports conditional GET via `opts.ifNoneMatch`. See {@link RawDocumentResult}.
 */
export async function getRobotsTxt(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  opts?: RawDocumentOptions
): Promise<RawDocumentResult> {
  const res = await client.get<string>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/robots.txt`,
    rawDocumentConfig(opts, false)
  );
  return toRawDocumentResult(res);
}

/**
 * Public, anonymous PWA web app manifest for a site.
 * `GET {basePath}/sites/{siteId}/manifest.webmanifest` — returns the
 * raw `application/manifest+json` text, `status: 404` (with `body: null`) when no
 * manifest is set.
 *
 * Supports conditional GET via `opts.ifNoneMatch`. See {@link RawDocumentResult}.
 */
export async function getManifest(
  client: AxiosInstance,
  basePath: string,
  siteId: string,
  opts?: RawDocumentOptions
): Promise<RawDocumentResult> {
  const res = await client.get<string>(
    `${basePath}/sites/${encodeURIComponent(siteId)}/manifest.webmanifest`,
    rawDocumentConfig(opts, true)
  );
  return toRawDocumentResult(res);
}
