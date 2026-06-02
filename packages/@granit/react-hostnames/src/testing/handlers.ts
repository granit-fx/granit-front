import { paginate } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockHostnames } from './data';

import type { CreateManagedHostnameRequest, ManagedHostnameResponse } from '@granit/hostnames';

/**
 * Create MSW handlers for the hostnames API endpoints.
 *
 * @param baseUrl - API base path (default: `/api/hostnames`)
 */
export function createHostnamesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  // In-memory store — starts from the seeded fixtures, mutable per-session.
  const store: ManagedHostnameResponse[] = [...mockHostnames];

  return [
    http.get(`${baseUrl}/check-availability`, ({ request }) => {
      const host = new URL(request.url).searchParams.get('host') ?? '';
      const isAvailable = !store.some((h) => h.host === host);
      return HttpResponse.json({ isAvailable });
    }),

    http.get(`${baseUrl}`, ({ request }) => {
      const url = new URL(request.url);
      const ownerType = url.searchParams.get('ownerType');
      const ownerId = url.searchParams.get('ownerId');
      const status = url.searchParams.get('status');

      let filtered = [...store];
      if (ownerType) filtered = filtered.filter((h) => h.ownerType === ownerType);
      if (ownerId) filtered = filtered.filter((h) => h.ownerId === ownerId);
      if (status) filtered = filtered.filter((h) => h.status === status);

      return HttpResponse.json(paginate(filtered, url));
    }),

    http.post<never, CreateManagedHostnameRequest>(`${baseUrl}`, async ({ request }) => {
      const body = await request.json();
      const now = new Date().toISOString();
      const created: ManagedHostnameResponse = {
        id: randomId(),
        host: body.host,
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        tenantId: null,
        isPrimary: body.isPrimary ?? false,
        status: 'Pending',
        verificationToken: `tok_${randomId().slice(0, 12)}`,
        expectedDnsRecords: [
          {
            type: 'Txt',
            name: `_granit-verify.${body.host}`,
            value: `granit-verify=tok_${randomId().slice(0, 12)}`,
          },
        ],
        lastCheckedAt: null,
        conflicts: [],
        failedCheckCount: 0,
        nextCheckAt: now,
        certificateStatus: 'Unprovisioned',
        certExpiresAt: null,
        createdAt: now,
        updatedAt: now,
        concurrencyStamp: randomId(),
      };
      store.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const hostname = store.find((h) => h.id === params.id);
      if (!hostname) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(hostname);
    }),

    http.patch<{ id: string }>(`${baseUrl}/:id`, async ({ params, request }) => {
      const idx = store.findIndex((h) => h.id === params.id);
      if (idx === -1) return new HttpResponse(null, { status: 404 });
      const body = (await request.json()) as { isPrimary: boolean };
      const updated: ManagedHostnameResponse = {
        ...store[idx]!,
        isPrimary: body.isPrimary,
        updatedAt: new Date().toISOString(),
      };
      store[idx] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const idx = store.findIndex((h) => h.id === params.id);
      if (idx === -1) return new HttpResponse(null, { status: 404 });
      store.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }),

    http.post(`${baseUrl}/:id/verify-now`, ({ params }) => {
      const hostname = store.find((h) => h.id === params.id);
      if (!hostname) return new HttpResponse(null, { status: 404 });
      return new HttpResponse(null, { status: 204 });
    }),

    http.post(`${baseUrl}/:id/certificate-status`, () => {
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function randomId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 18);
}
