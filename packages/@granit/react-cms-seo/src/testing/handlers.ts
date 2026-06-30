// ---------------------------------------------------------------------------
// @granit/react-cms-seo/testing — MSW handler factory
// ---------------------------------------------------------------------------

import { http, HttpResponse, type RequestHandler } from 'msw';

import {
  mockSeoDefaults,
  mockSeoMetadataAudit,
  mockSeoMetadataMeta,
  mockSeoSuggestions,
} from './data';

import type {
  PagedResult,
  SeoSuggestionResponse,
  SeoMetadataListItem,
  SeoSuggestionListResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';

function paged<T>(items: readonly T[]): PagedResult<T> {
  return { items, totalCount: items.length, hasMore: false, nextCursor: null };
}

function suggestionList(items: readonly SeoSuggestionResponse[]): SeoSuggestionListResponse {
  return { items, total: items.length };
}

/**
 * MSW handlers for the CMS SEO API (`/api/cms/seo`). Covers site defaults
 * (single object), the audit grid (`MapGranitQuery<SeoMetadata>` → `PagedResult`)
 * and the AI suggestions inbox (`SeoSuggestionListResponse`), plus apply/reject
 * mutations.
 */
export function createCmsSeoHandlers(baseUrl = '/api/cms/seo'): RequestHandler[] {
  const defaultsBySite: Record<string, SiteSeoDefaultsResponse> = { ...mockSeoDefaults };
  const auditRows: SeoMetadataListItem[] = mockSeoMetadataAudit.map((row) => ({ ...row }));
  const suggestions: SeoSuggestionResponse[] = mockSeoSuggestions.map((item) => ({ ...item }));

  return [
    http.get(`${baseUrl}/sites/:siteId/defaults`, ({ params }) => {
      const siteId = params.siteId as string;
      const defaults = defaultsBySite[siteId];
      return defaults ? HttpResponse.json(defaults) : new HttpResponse(null, { status: 404 });
    }),

    http.put(`${baseUrl}/sites/:siteId/defaults`, async ({ params, request }) => {
      const siteId = params.siteId as string;
      const dto = (await request.json()) as SiteSeoDefaultsRequest;
      const existing = defaultsBySite[siteId];
      const updated: SiteSeoDefaultsResponse = {
        id: existing?.id ?? `id-${siteId}`,
        siteId,
        titleTemplate: dto.titleTemplate ?? null,
        siteName: dto.siteName ?? null,
        defaultDescription: dto.defaultDescription ?? null,
        defaultRobots: dto.defaultRobots ?? {
          index: true,
          follow: true,
          noArchive: false,
          noSnippet: false,
          maxSnippet: null,
          maxImagePreview: null,
        },
        canonicalHost: dto.canonicalHost ?? null,
        sitemapMaxUrlsPerFile: dto.sitemapMaxUrlsPerFile ?? 45000,
        inheritFromParentPage: dto.inheritFromParentPage ?? false,
        defaultOpenGraph: dto.defaultOpenGraph ?? null,
        defaultTwitterCard: dto.defaultTwitterCard ?? null,
        defaultOgImage: dto.defaultOgImage ?? null,
        robotsTxtRules: dto.robotsTxtRules ?? [],
        robotsTxtExtra: dto.robotsTxtExtra ?? null,
        manifest: dto.manifest ?? null,
        enableAutomaticSeoGeneration: dto.enableAutomaticSeoGeneration ?? false,
        concurrencyStamp: 'stamp-updated',
      };
      defaultsBySite[siteId] = updated;
      return HttpResponse.json(updated);
    }),

    http.get(`${baseUrl}/metadata/meta`, () => HttpResponse.json(mockSeoMetadataMeta)),

    http.get(`${baseUrl}/metadata`, () => HttpResponse.json(paged(auditRows))),

    http.get(`${baseUrl}/ai/suggestions`, () => HttpResponse.json(suggestionList(suggestions))),

    http.post(`${baseUrl}/ai/suggestions/:id/apply`, ({ params }) => {
      const existing = suggestions.find((item) => item.id === params.id);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const updated: SeoSuggestionResponse = {
        ...existing,
        status: 'Accepted',
        appliedFields: existing.scope,
      };
      suggestions[suggestions.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.post(`${baseUrl}/ai/suggestions/:id/reject`, ({ params }) => {
      const existing = suggestions.find((item) => item.id === params.id);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const updated: SeoSuggestionResponse = {
        ...existing,
        status: 'Rejected',
        rejectionReason: 'Not relevant',
      };
      suggestions[suggestions.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),
  ];
}
