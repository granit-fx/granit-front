// ---------------------------------------------------------------------------
// @granit/react-cms-redirects/testing — MSW handler factory
// ---------------------------------------------------------------------------

import { http, HttpResponse, type RequestHandler } from 'msw';

import { mockRedirects } from './data';

import type {
  PagedResult,
  RedirectCreateRequest,
  RedirectMutationResult,
  RedirectPreviewResponse,
  RedirectResponse,
  RedirectUpdateRequest,
  SiteRedirectSettingsRequest,
  SiteRedirectSettingsResponse,
} from '@granit/cms-redirects';

const STATUS_BY_TYPE = {
  MovedPermanently: 301,
  Found: 302,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
} as const;

/**
 * MSW handlers for the CMS redirects admin API (`/api/cms/redirects`).
 *
 * - `GET  /sites/:siteId/redirects` → flat `RedirectResponse[]`
 * - `POST /sites/:siteId/redirects` → `RedirectMutationResult` (201)
 * - `GET/PUT/DELETE /:id`
 * - `GET/PUT /sites/:siteId/settings`
 * - `GET  /sites/:siteId/preview`
 * - `GET  /grid` → `PagedResult<RedirectResponse>`
 */
export function createCmsRedirectsHandlers(baseUrl = '/api/cms/redirects'): RequestHandler[] {
  const redirects: RedirectResponse[] = mockRedirects.map((redirect) => ({ ...redirect }));
  const settings = new Map<string, boolean>();

  return [
    http.get(`${baseUrl}/grid`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '25');
      const start = (page - 1) * pageSize;
      const body: PagedResult<RedirectResponse> = {
        items: redirects.slice(start, start + pageSize),
        totalCount: redirects.length,
      };
      return HttpResponse.json(body);
    }),

    http.get(`${baseUrl}/sites/:siteId/redirects`, ({ params }) => {
      const body = redirects.filter((redirect) => redirect.siteId === params.siteId);
      return HttpResponse.json(body);
    }),

    http.post(`${baseUrl}/sites/:siteId/redirects`, async ({ params, request }) => {
      const dto = (await request.json()) as RedirectCreateRequest;
      const type = dto.type ?? 'MovedPermanently';
      const redirect: RedirectResponse = {
        id: crypto.randomUUID(),
        siteId: String(params.siteId),
        source: dto.source,
        matchType: dto.matchType ?? 'Exact',
        target: dto.target,
        type,
        statusCode: STATUS_BY_TYPE[type],
        isActive: dto.isActive ?? true,
        culture: dto.culture ?? null,
        origin: 'Manual',
        hitCount: 0,
        lastHitAt: null,
      };
      redirects.push(redirect);
      const body: RedirectMutationResult = { redirect, conflictWarning: null };
      return HttpResponse.json(body, { status: 201 });
    }),

    http.get(`${baseUrl}/sites/:siteId/settings`, ({ params }) => {
      const siteId = String(params.siteId);
      const body: SiteRedirectSettingsResponse = {
        siteId,
        autoRedirectOnMove: settings.get(siteId) ?? true,
      };
      return HttpResponse.json(body);
    }),

    http.put(`${baseUrl}/sites/:siteId/settings`, async ({ params, request }) => {
      const siteId = String(params.siteId);
      const dto = (await request.json()) as SiteRedirectSettingsRequest;
      settings.set(siteId, dto.autoRedirectOnMove);
      const body: SiteRedirectSettingsResponse = {
        siteId,
        autoRedirectOnMove: dto.autoRedirectOnMove,
      };
      return HttpResponse.json(body);
    }),

    http.get(`${baseUrl}/sites/:siteId/preview`, ({ params, request }) => {
      const url = new URL(request.url);
      const path = url.searchParams.get('path');
      const match = redirects.find(
        (redirect) => redirect.siteId === params.siteId && redirect.source === path
      );
      const body: RedirectPreviewResponse = match
        ? { matched: true, target: match.target, statusCode: match.statusCode }
        : { matched: false, target: null, statusCode: null };
      return HttpResponse.json(body);
    }),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const existing = redirects.find((redirect) => redirect.id === params.id);
      return existing ? HttpResponse.json(existing) : new HttpResponse(null, { status: 404 });
    }),

    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const existing = redirects.find((redirect) => redirect.id === params.id);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const dto = (await request.json()) as RedirectUpdateRequest;
      const type = dto.type ?? existing.type;
      const updated: RedirectResponse = {
        ...existing,
        target: dto.target,
        type,
        statusCode: STATUS_BY_TYPE[type],
        matchType: dto.matchType ?? existing.matchType,
        isActive: dto.isActive ?? existing.isActive,
      };
      redirects[redirects.indexOf(existing)] = updated;
      const body: RedirectMutationResult = { redirect: updated, conflictWarning: null };
      return HttpResponse.json(body);
    }),

    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const existing = redirects.find((redirect) => redirect.id === params.id);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      redirects.splice(redirects.indexOf(existing), 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
