import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockHostnames } from './data';

import type { CreateManagedHostnameRequest, ManagedHostnameResponse } from '@granit/hostnames';

/** Options for {@link createHostnamesHandlers}. */
export type CreateHostnamesHandlersOptions = {
  /**
   * Initial fixtures the in-memory store is seeded with. Lets consumers inject
   * hostnames whose owners line up with their own mock tenants/sites instead of
   * the package defaults. Defaults to {@link mockHostnames}.
   */
  readonly seed?: readonly ManagedHostnameResponse[];
};

/**
 * Create MSW handlers for the hostnames API endpoints.
 *
 * @param baseUrl - API base path (default: `/api/hostnames`)
 * @param options - Optional overrides (e.g. a custom `seed`).
 */
export function createHostnamesHandlers(
  baseUrl = DEFAULT_BASE_PATH,
  options: CreateHostnamesHandlersOptions = {}
) {
  // In-memory store — starts from the seeded fixtures, mutable per-session.
  const store: ManagedHostnameResponse[] = [...(options.seed ?? mockHostnames)];

  return [
    http.get(`${baseUrl}/availability`, ({ request }) => {
      const host = new URL(request.url).searchParams.get('host') ?? '';
      const existing = store.find((h) => h.host === host);
      return HttpResponse.json({ host, isAvailable: existing === undefined });
    }),

    http.get(`${baseUrl}`, ({ request }) => {
      const url = new URL(request.url);
      const ownerType = url.searchParams.get('ownerType');
      const ownerId = url.searchParams.get('ownerId');
      const maxResults = Number(url.searchParams.get('maxResults') ?? 100);

      let filtered = [...store];
      if (ownerType) filtered = filtered.filter((h) => h.ownerType === ownerType);
      if (ownerId) filtered = filtered.filter((h) => h.ownerId === ownerId);

      return HttpResponse.json(filtered.slice(0, maxResults));
    }),

    http.post<never, CreateManagedHostnameRequest>(`${baseUrl}`, async ({ request }) => {
      const body = await request.json();
      const now = new Date().toISOString();
      const created: ManagedHostnameResponse = {
        id: randomId(),
        host: body.host,
        ownerType: body.ownerType,
        ownerId: body.ownerId,
        tenantId: body.tenantId ?? null,
        isPrimary: body.isPrimary ?? false,
        status: 'Pending',
        verificationToken: `tok_${randomId().slice(0, 12)}`,
        expectedDnsRecords: [
          {
            recordType: 'Txt',
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
        createdBy: 'mock-user',
        modifiedAt: null,
        modifiedBy: null,
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

    http.post(`${baseUrl}/:id/primary`, ({ params }) => {
      const idx = store.findIndex((h) => h.id === params.id);
      if (idx === -1) return new HttpResponse(null, { status: 404 });
      store[idx] = { ...store[idx]!, isPrimary: true, modifiedAt: new Date().toISOString() };
      return new HttpResponse(null, { status: 204 });
    }),

    http.delete(`${baseUrl}/:id/primary`, ({ params }) => {
      const idx = store.findIndex((h) => h.id === params.id);
      if (idx === -1) return new HttpResponse(null, { status: 404 });
      store[idx] = { ...store[idx]!, isPrimary: false, modifiedAt: new Date().toISOString() };
      return new HttpResponse(null, { status: 204 });
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
      const updated: ManagedHostnameResponse = {
        ...hostname,
        status: 'Verifying',
        modifiedAt: new Date().toISOString(),
      };
      return HttpResponse.json(updated, { status: 202 });
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
