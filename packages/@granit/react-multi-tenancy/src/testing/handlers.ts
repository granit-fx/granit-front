import {
  STRING_OPERATORS,
  ENUM_OPERATORS,
  BOOLEAN_OPERATORS,
  DATE_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { noContent, notFound, pagedResponse } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockTenants } from './data';

import type { TenantResponse } from '@granit/multi-tenancy';
import type { QueryMetadata } from '@granit/query-engine';

/** Mock /meta payload for the tenant resource. */
export const tenantQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'identifier',
      label: 'Identifier',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'contactEmail',
      label: 'Contact email',
      type: 'String',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'activated',
      label: 'Active',
      type: 'Boolean',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'jurisdiction',
      label: 'Jurisdiction',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'identifier', type: 'String', operators: STRING_OPERATORS },
    { name: 'contactEmail', type: 'String', operators: STRING_OPERATORS },
    { name: 'activated', type: 'Boolean', operators: BOOLEAN_OPERATORS },
    { name: 'jurisdiction', type: 'String', operators: ENUM_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'identifier' },
    { name: 'activated' },
    { name: 'createdAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'active', label: 'Active', isDefault: true },
    { name: 'inactive', label: 'Inactive', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

/**
 * Create stateful MSW handlers for tenant admin endpoints.
 * Handlers mutate the in-memory `mockTenants` array — create/update/activate/
 * deactivate calls update state that subsequent GET calls reflect.
 *
 * @param baseUrl - API base path (default: `/api/v1/multi-tenancy`)
 */
export function createTenantHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /tenants/meta — query metadata
    createQueryMetaHandler(`${baseUrl}/tenants`, tenantQueryMetadata),

    // GET /tenants — QueryEngine admin grid (paged). The backend serves the
    // tenant list through a Granit.QueryEngine endpoint returning PagedResult,
    // consumed via @granit/react-query-engine (`useQueryEndpoint`/`getPage`).
    http.get(`${baseUrl}/tenants`, () => pagedResponse(mockTenants)),

    // GET /tenants/:id — single tenant
    http.get(`${baseUrl}/tenants/:id`, ({ params }) => {
      const tenant = mockTenants.find((t) => t.id === params.id);
      if (!tenant) return notFound();
      return HttpResponse.json(tenant);
    }),

    // POST /tenants — create
    http.post(`${baseUrl}/tenants`, async ({ request }) => {
      const body = (await request.json()) as Partial<TenantResponse>;
      const newTenant: (typeof mockTenants)[number] = {
        id: `tnt_${Date.now()}` as TenantResponse['id'],
        name: body.name ?? 'New Tenant',
        identifier: body.identifier ?? `tenant-${Date.now()}`,
        contactEmail: body.contactEmail ?? null,
        activated: true,
        jurisdiction: body.jurisdiction ?? null,
        createdAt: new Date().toISOString(),
        concurrencyStamp: `stamp-${Date.now()}`,
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
      const body = (await request.json()) as Partial<TenantResponse>;
      if (body.name !== undefined) tenant.name = body.name;
      if (body.contactEmail !== undefined) tenant.contactEmail = body.contactEmail;
      if (body.jurisdiction !== undefined) tenant.jurisdiction = body.jurisdiction;
      // Rotate the concurrency stamp, as the real backend does on each write.
      tenant.concurrencyStamp = `stamp-${Date.now()}`;
      return noContent();
    }),

    // POST /tenants/:id/activate
    http.post(`${baseUrl}/tenants/:id/activate`, ({ params }) => {
      const tenant = mockTenants.find((t) => t.id === params.id);
      if (!tenant) return notFound();
      tenant.activated = true;
      return noContent();
    }),

    // POST /tenants/:id/deactivate
    http.post(`${baseUrl}/tenants/:id/deactivate`, ({ params }) => {
      const tenant = mockTenants.find((t) => t.id === params.id);
      if (!tenant) return notFound();
      tenant.activated = false;
      return noContent();
    }),
  ];
}
