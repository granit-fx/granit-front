// ---------------------------------------------------------------------------
// @granit/react-cms-hostnames/testing — MSW handler factory
// ---------------------------------------------------------------------------

import { created } from '@granit/testing/msw';
import { http, HttpResponse, type RequestHandler } from 'msw';

import { mockHostnames } from './data';

import type { SiteHostnameCreateRequest, SiteHostnameResponse } from '@granit/cms-hostnames';

/**
 * MSW handlers for the site-scoped CMS hostnames API
 * (`{baseUrl}/sites/{siteId}/hostnames`). The list endpoint returns a BARE
 * ARRAY of the narrow {@link SiteHostnameResponse} shape; mutations cover
 * add / remove / verify-now. There is NO `/primary` endpoint.
 *
 * @param baseUrl - CMS API base (default `/api/cms`).
 */
export function createCmsHostnamesHandlers(baseUrl = '/api/cms'): RequestHandler[] {
  const collection = `${baseUrl}/sites/:siteId/hostnames`;
  const hostnames: SiteHostnameResponse[] = mockHostnames.map((hostname) => ({ ...hostname }));

  return [
    http.get(`${collection}/availability`, ({ request }) => {
      const host = new URL(request.url).searchParams.get('host') ?? '';
      const taken = hostnames.some((hostname) => hostname.host === host);
      return HttpResponse.json({ host, available: !taken });
    }),

    http.get(collection, () => HttpResponse.json(hostnames)),

    http.post(collection, async ({ request }) => {
      const dto = (await request.json()) as SiteHostnameCreateRequest;
      const hostname: SiteHostnameResponse = {
        id: crypto.randomUUID(),
        host: dto.host,
        status: 'Pending',
        isPrimary: dto.isPrimary ?? false,
        expectedDnsRecords: [
          {
            recordType: 'Cname',
            name: dto.host.split('.')[0] ?? dto.host,
            value: 'edge.granit.app',
          },
        ],
        lastCheckedAt: null,
        certificateStatus: 'Unprovisioned',
      };
      hostnames.push(hostname);
      return created(hostname);
    }),

    http.post(`${collection}/:hostnameId/verify-now`, ({ params }) => {
      const existing = hostnames.find((hostname) => hostname.id === params.hostnameId);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const updated: SiteHostnameResponse = {
        ...existing,
        status: 'Verifying',
        lastCheckedAt: '2026-06-04T00:00:00Z',
      };
      hostnames[hostnames.indexOf(existing)] = updated;
      return HttpResponse.json(updated, { status: 202 });
    }),

    http.delete(`${collection}/:hostnameId`, ({ params }) => {
      const existing = hostnames.find((hostname) => hostname.id === params.hostnameId);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      hostnames.splice(hostnames.indexOf(existing), 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
