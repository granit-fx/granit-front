import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockTenants } from './data.js';

import type { AdminTenant } from '@granit/multi-tenancy';

/**
 * Create stateful MSW handlers for tenant admin endpoints.
 * Handlers mutate the in-memory `mockTenants` array — create/update/activate/
 * deactivate calls update state that subsequent GET calls reflect.
 *
 * @param baseUrl - API base path (default: `/api/granit/admin`)
 */
export function createTenantHandlers(baseUrl = '/api/granit/admin') {
  return [
    // GET /tenants — list all
    http.get(`${baseUrl}/tenants`, () => HttpResponse.json(mockTenants)),

    // GET /tenants/:id — single tenant
    http.get(`${baseUrl}/tenants/:id`, ({ params }) => {
      const tenant = mockTenants.find((t) => t.id === params.id);
      if (!tenant) return notFound();
      return HttpResponse.json(tenant);
    }),

    // POST /tenants — create
    http.post(`${baseUrl}/tenants`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminTenant>;
      const newTenant: (typeof mockTenants)[number] = {
        id: `tnt_${Date.now()}` as AdminTenant['id'],
        name: body.name ?? 'New Tenant',
        identifier: body.identifier ?? `tenant-${Date.now()}`,
        contactEmail: body.contactEmail ?? null,
        isActive: true,
        jurisdiction: body.jurisdiction ?? null,
        createdAt: new Date().toISOString(),
      };
      mockTenants.push(newTenant);
      return HttpResponse.json(newTenant, { status: 201 });
    }),

    // PUT /tenants/:id — update
    http.put(`${baseUrl}/tenants/:id`, async ({ params, request }) => {
      const idx = mockTenants.findIndex((t) => t.id === params.id);
      if (idx === -1) return notFound();
      const tenant = mockTenants[idx];
      if (!tenant) return notFound();
      const body = (await request.json()) as Partial<AdminTenant>;
      if (body.name !== undefined) tenant.name = body.name;
      if (body.contactEmail !== undefined) tenant.contactEmail = body.contactEmail;
      if (body.jurisdiction !== undefined) tenant.jurisdiction = body.jurisdiction;
      return noContent();
    }),

    // POST /tenants/:id/activate
    http.post(`${baseUrl}/tenants/:id/activate`, ({ params }) => {
      const tenant = mockTenants.find((t) => t.id === params.id);
      if (!tenant) return notFound();
      tenant.isActive = true;
      return noContent();
    }),

    // POST /tenants/:id/deactivate
    http.post(`${baseUrl}/tenants/:id/deactivate`, ({ params }) => {
      const tenant = mockTenants.find((t) => t.id === params.id);
      if (!tenant) return notFound();
      tenant.isActive = false;
      return noContent();
    }),
  ];
}
