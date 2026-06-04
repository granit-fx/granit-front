// ---------------------------------------------------------------------------
// @granit/react-cms-redirects/testing — MSW handler factory
// ---------------------------------------------------------------------------

import { http, HttpResponse, type RequestHandler } from 'msw';

import { mockRedirects } from './data';

import type {
  CreateRedirectRequest,
  PagedResponse,
  RedirectResponse,
  UpdateRedirectRequest,
} from '@granit/cms-redirects';

/**
 * MSW handlers for the CMS redirects API (`/api/cms/redirects`). List returns a
 * `PagedResponse<RedirectResponse>`; create/update return a single redirect.
 */
export function createCmsRedirectsHandlers(baseUrl = '/api/cms/redirects'): RequestHandler[] {
  const redirects: RedirectResponse[] = mockRedirects.map((redirect) => ({ ...redirect }));

  return [
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const siteId = url.searchParams.get('siteId');
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
      const filtered = siteId
        ? redirects.filter((redirect) => redirect.siteId === siteId)
        : redirects;
      const start = (page - 1) * pageSize;
      const body: PagedResponse<RedirectResponse> = {
        items: filtered.slice(start, start + pageSize),
        totalCount: filtered.length,
        page,
        pageSize,
      };
      return HttpResponse.json(body);
    }),

    http.post(baseUrl, async ({ request }) => {
      const dto = (await request.json()) as CreateRedirectRequest;
      const redirect: RedirectResponse = {
        id: crypto.randomUUID(),
        siteId: dto.siteId,
        fromPath: dto.fromPath,
        toPath: dto.toPath,
        culture: dto.culture ?? null,
        statusCode: dto.statusCode ?? 301,
        isEnabled: true,
      };
      redirects.push(redirect);
      return HttpResponse.json(redirect, { status: 201 });
    }),

    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const existing = redirects.find((redirect) => redirect.id === params.id);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const dto = (await request.json()) as UpdateRedirectRequest;
      const updated: RedirectResponse = {
        ...existing,
        fromPath: dto.fromPath,
        toPath: dto.toPath,
        culture: dto.culture ?? null,
        statusCode: dto.statusCode ?? existing.statusCode,
        isEnabled: dto.isEnabled ?? existing.isEnabled,
      };
      redirects[redirects.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
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
