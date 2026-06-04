// ---------------------------------------------------------------------------
// @granit/react-cms-seo/testing — MSW handler factory
// ---------------------------------------------------------------------------

import { http, HttpResponse, type RequestHandler } from 'msw';

import { mockSeoAuditIssues, mockSeoDefaults, mockSeoSuggestions } from './data';

import type {
  PagedResponse,
  SeoAiSuggestionResponse,
  SeoAuditIssueResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';

function paged<T>(items: readonly T[]): PagedResponse<T> {
  return { items, totalCount: items.length, page: 1, pageSize: items.length };
}

/**
 * MSW handlers for the CMS SEO API (`/api/cms/seo`). Covers site defaults
 * (single object), the audit issues list and the AI suggestions inbox (both
 * paged), plus apply/reject mutations.
 */
export function createCmsSeoHandlers(baseUrl = '/api/cms/seo'): RequestHandler[] {
  const defaultsBySite: Record<string, SiteSeoDefaultsResponse> = { ...mockSeoDefaults };
  const auditIssues: SeoAuditIssueResponse[] = mockSeoAuditIssues.map((issue) => ({ ...issue }));
  const suggestions: SeoAiSuggestionResponse[] = mockSeoSuggestions.map((item) => ({ ...item }));

  return [
    http.get(`${baseUrl}/sites/:siteId/defaults`, ({ params }) => {
      const siteId = params.siteId as string;
      const defaults = defaultsBySite[siteId] ?? { siteId, robots: { index: true, follow: true } };
      return HttpResponse.json(defaults);
    }),

    http.put(`${baseUrl}/sites/:siteId/defaults`, async ({ params, request }) => {
      const siteId = params.siteId as string;
      const dto = (await request.json()) as SiteSeoDefaultsRequest;
      const updated: SiteSeoDefaultsResponse = { ...dto, siteId };
      defaultsBySite[siteId] = updated;
      return HttpResponse.json(updated);
    }),

    http.get(`${baseUrl}/metadata`, () => HttpResponse.json(paged(auditIssues))),

    http.get(`${baseUrl}/ai/suggestions`, () => HttpResponse.json(paged(suggestions))),

    http.post(`${baseUrl}/ai/suggestions/:id/apply`, ({ params }) => {
      const existing = suggestions.find((item) => item.id === params.id);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const updated: SeoAiSuggestionResponse = { ...existing, status: 'Applied' };
      suggestions[suggestions.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.post(`${baseUrl}/ai/suggestions/:id/reject`, ({ params }) => {
      const existing = suggestions.find((item) => item.id === params.id);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const updated: SeoAiSuggestionResponse = { ...existing, status: 'Rejected' };
      suggestions[suggestions.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),
  ];
}
