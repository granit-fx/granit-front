/**
 * SEO wire-contract types for the Granit CMS API.
 * Mirrors `Granit.Cms.Seo.*` .NET types.
 */

// ─── Shared ──────────────────────────────────────────────────────────────────

export type { PagedResponse } from '@granit/cms';

// ─── Public / renderer ───────────────────────────────────────────────────────

/** Crawler policy for a content item. Maps `Granit.Cms.Seo.Domain.RobotsDirective`. */
export interface RobotsDirective {
  readonly index: boolean;
  readonly follow: boolean;
  readonly noArchive: boolean;
  readonly noSnippet: boolean;
  readonly maxSnippet?: number | null;
  readonly maxImagePreview?: string | null;
}

/** Open Graph / Twitter-card image reference. Maps `Granit.Cms.Seo.Domain.OgImage`. */
export interface OgImage {
  readonly documentId?: string | null;
  readonly versionId?: string | null;
  readonly renditionId?: string | null;
  readonly publicLinkId?: string | null;
  readonly url?: string | null;
  readonly dimensions?: { readonly width: number; readonly height: number } | null;
  readonly mimeType?: string | null;
  readonly altText?: string | null;
}

/** `article:*` Open Graph fields. Maps `Granit.Cms.Seo.Domain.OpenGraphArticle`. */
export interface OpenGraphArticle {
  readonly publishedTime?: string | null;
  readonly modifiedTime?: string | null;
  readonly expirationTime?: string | null;
  readonly section?: string | null;
  readonly authors: readonly string[];
  readonly tags: readonly string[];
}

/** Open Graph protocol fields. Maps `Granit.Cms.Seo.Domain.OpenGraph`. */
export interface OpenGraph {
  readonly type: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly url?: string | null;
  readonly siteName?: string | null;
  readonly locale?: string | null;
  readonly alternateLocales: readonly string[];
  readonly image?: OgImage | null;
  readonly article?: OpenGraphArticle | null;
}

/** Twitter / X Card fields. Maps `Granit.Cms.Seo.Domain.TwitterCard`. */
export interface TwitterCard {
  readonly card: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly image?: OgImage | null;
  readonly site?: string | null;
  readonly creator?: string | null;
}

/** One `hreflang` alternate. */
export interface Hreflang {
  readonly culture: string;
  readonly href: string;
}

/**
 * Cascade-resolved, render-ready SEO for a content item.
 * Returned by `GET /api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}/effective`.
 */
export interface EffectiveSeoResponse {
  readonly title: string;
  readonly description?: string | null;
  readonly canonicalUrl?: string | null;
  readonly robots: RobotsDirective;
  readonly keywords: readonly string[];
  readonly openGraph: OpenGraph;
  readonly twitterCard: TwitterCard;
  readonly alternates: readonly Hreflang[];
}

// ─── Admin write ─────────────────────────────────────────────────────────────

/** Writable robots directive for a metadata upsert. */
export interface SeoRobotsRequest {
  readonly index: boolean;
  readonly follow: boolean;
  readonly noArchive?: boolean;
  readonly noSnippet?: boolean;
  readonly maxSnippet?: number;
  readonly maxImagePreview?: 'none' | 'standard' | 'large';
}

/** One `hreflang` alternate in a metadata upsert request. */
export interface SeoHreflangRequest {
  readonly culture: string;
  readonly href: string;
}

/**
 * Raw (per-level) SEO metadata request body for
 * `PUT /api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}`.
 */
export interface SeoMetadataRequest {
  readonly title?: string | null;
  readonly titleTemplate?: string | null;
  readonly description?: string | null;
  readonly keywords?: readonly string[];
  readonly canonicalUrl?: string | null;
  readonly robots?: SeoRobotsRequest;
  readonly openGraph?: Readonly<Record<string, unknown>>;
  readonly twitterCard?: Readonly<Record<string, unknown>>;
  readonly hreflang?: readonly SeoHreflangRequest[];
  readonly structuredData?: string | null;
}

/** Raw SEO metadata returned by `GET .../metadata/{contentType}/{contentId}/{culture}`. */
export type SeoMetadataResponse = SeoMetadataRequest & {
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string;
};

/** Site-level SEO defaults. */
export interface SiteSeoDefaultsRequest {
  readonly titleTemplate?: string | null;
  readonly siteName?: string | null;
  readonly robots?: SeoRobotsRequest;
  readonly canonicalHost?: string | null;
  readonly enableAutomaticSeoGeneration?: boolean;
  readonly sitemapMaxItems?: number;
  readonly robotsTxtRules?: string | null;
}

/** Site SEO defaults with siteId context. */
export type SiteSeoDefaultsResponse = SiteSeoDefaultsRequest & {
  readonly siteId: string;
};

/** Quick-filter type for the SEO audit grid. */
export type SeoAuditIssueType =
  | 'MissingDescription'
  | 'NoCanonical'
  | 'TitleTooLong'
  | 'MissingOgImage';

/** One SEO audit issue. */
export interface SeoAuditIssueResponse {
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string;
  readonly issueType: SeoAuditIssueType;
  readonly detail?: string | null;
}

/** SERP preview. */
export interface SerpPreviewResponse {
  readonly title: string;
  readonly url: string;
  readonly description: string;
}

/** OG-card preview. */
export interface OgCardPreviewResponse {
  readonly title: string;
  readonly description: string;
  readonly image?: string | null;
  readonly siteName: string;
}

// ─── SEO-AI ──────────────────────────────────────────────────────────────────

/** Lifecycle status of a SEO-AI suggestion. */
export type SeoAiSuggestionStatus = 'Pending' | 'Ready' | 'Applied' | 'Rejected';

/** Outcome of a `POST /api/cms/seo/ai/suggest` call. */
export type SeoAiSuggestOutcome = 'Success' | 'Reused' | 'Failed';

/** One AI-generated SEO suggestion. */
export interface SeoAiSuggestionResponse {
  readonly id: string;
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string;
  readonly status: SeoAiSuggestionStatus;
  readonly suggestion?: SeoMetadataRequest | null;
  readonly diff?: Readonly<
    Record<string, { readonly current: unknown; readonly proposed: unknown }>
  > | null;
}

/** Response from `POST /api/cms/seo/ai/suggest`. */
export interface SeoAiSuggestResponse {
  readonly outcome: SeoAiSuggestOutcome;
  readonly suggestion?: SeoAiSuggestionResponse | null;
}

/** Request body for `POST /api/cms/seo/ai/suggest`. */
export interface SeoAiSuggestRequest {
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string;
  readonly contentTitle: string;
  readonly contentDescription?: string | null;
}

/** Request body for `POST /api/cms/seo/ai/suggestions/{id}/apply`. */
export interface ApplySeoAiRequest {
  readonly fields: readonly string[];
}

/** Request body for `POST /api/cms/seo/ai/suggestions/{id}/reject`. */
export interface RejectSeoAiRequest {
  readonly reason?: string | null;
}

// ─── Query params ─────────────────────────────────────────────────────────────

/** Query params for the SEO audit grid (`GET /api/cms/seo/metadata`). */
export interface ListSeoMetadataParams {
  readonly siteId?: string;
  readonly contentType?: string;
  readonly issueType?: SeoAuditIssueType;
  readonly page?: number;
  readonly pageSize?: number;
}

/** Query params for the SEO-AI suggestions inbox (`GET /api/cms/seo/ai/suggestions`). */
export interface ListSeoSuggestionsParams {
  readonly siteId?: string;
  readonly contentType?: string;
  readonly status?: SeoAiSuggestionStatus;
  readonly page?: number;
  readonly pageSize?: number;
}
