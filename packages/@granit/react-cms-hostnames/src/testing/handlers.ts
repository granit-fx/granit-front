// ---------------------------------------------------------------------------
// @granit/react-cms-hostnames/testing — MSW handler factory
// ---------------------------------------------------------------------------

import { http, HttpResponse, type RequestHandler } from 'msw';

import { mockHostnames } from './data';

import type { ManagedHostnameResponse } from '@granit/cms-hostnames';

type AddHostnameBody = { readonly host: string; readonly isPrimary?: boolean };

/**
 * MSW handlers for the site-scoped managed-hostnames API
 * (`{baseUrl}/sites/{siteId}/hostnames`). The list endpoint returns a BARE
 * ARRAY; mutations cover add/remove/set-primary/verify.
 *
 * @param baseUrl - CMS API base (default `/api/cms`).
 */
export function createCmsHostnamesHandlers(baseUrl = '/api/cms'): RequestHandler[] {
  const collection = `${baseUrl}/sites/:siteId/hostnames`;
  const hostnames: ManagedHostnameResponse[] = mockHostnames.map((hostname) => ({ ...hostname }));

  return [
    http.get(collection, ({ params }) => {
      const siteId = params.siteId as string;
      return HttpResponse.json(hostnames.filter((hostname) => hostname.ownerId === siteId));
    }),

    http.post(collection, async ({ params, request }) => {
      const siteId = params.siteId as string;
      const dto = (await request.json()) as AddHostnameBody;
      const hostname: ManagedHostnameResponse = {
        id: crypto.randomUUID(),
        host: dto.host,
        ownerType: 'cms.site',
        ownerId: siteId,
        tenantId: null,
        isPrimary: dto.isPrimary ?? false,
        status: 'Pending',
        verificationToken: `granit-verify-${crypto.randomUUID().slice(0, 8)}`,
        expectedDnsRecords: [
          {
            recordType: 'Cname',
            name: dto.host.split('.')[0] ?? dto.host,
            value: 'edge.granit.app',
          },
        ],
        lastCheckedAt: null,
        conflicts: [],
        failedCheckCount: 0,
        nextCheckAt: null,
        certificateStatus: 'Unprovisioned',
        certExpiresAt: null,
        createdAt: '2026-06-04T00:00:00Z',
        createdBy: 'marie.dupont',
        modifiedAt: null,
        modifiedBy: null,
        concurrencyStamp: crypto.randomUUID(),
      };
      hostnames.push(hostname);
      return HttpResponse.json(hostname, { status: 201 });
    }),

    http.post(`${collection}/:hostnameId/primary`, ({ params }) => {
      const target = hostnames.find((hostname) => hostname.id === params.hostnameId);
      if (!target) {
        return new HttpResponse(null, { status: 404 });
      }
      hostnames.forEach((hostname, i) => {
        if (hostname.ownerId === target.ownerId) {
          hostnames[i] = { ...hostname, isPrimary: hostname.id === target.id };
        }
      });
      return new HttpResponse(null, { status: 204 });
    }),

    http.post(`${collection}/:hostnameId/verify-now`, ({ params }) => {
      const existing = hostnames.find((hostname) => hostname.id === params.hostnameId);
      if (!existing) {
        return new HttpResponse(null, { status: 404 });
      }
      const updated: ManagedHostnameResponse = {
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
