import { BOOLEAN_OPERATORS, ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { created, noContent, notFound, pagedResponse } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  mockAdminUsers,
  mockOidcApplications,
  mockOidcAuthorizations,
  mockOidcScopes,
} from './data';

import type {
  AdminOidcApplicationResponse,
  AdminOidcCreateApplicationRequest,
  AdminOidcCreateAuthorizationRequest,
  AdminOidcCreateScopeRequest,
  AdminOidcUpdateScopeRequest,
} from '@granit/openiddict-admin';
import type { QueryMetadata } from '@granit/query-engine';

const OIDC_APPLICATION_TYPES = ['web', 'native'];
const OIDC_AUTHORIZATION_STATUSES = ['valid', 'revoked', 'inactive'];
const OIDC_AUTHORIZATION_TYPES = ['permanent', 'ad-hoc'];

/**
 * Slice a fixture list into a `PagedResult` the way the admin OIDC endpoints do:
 * 1-based `page` (default 1) and `pageSize` (default 25, clamped to [1, 100]).
 */
function pageOf<T>(items: readonly T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 25)));
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return pagedResponse(slice, items.length, start + slice.length < items.length);
}

/** Mock /meta payload for the admin users resource. */
export const adminUserQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'userId',
      label: 'User ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'username',
      label: 'Username',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'firstName',
      label: 'First name',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastName',
      label: 'Last name',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'enabled',
      label: 'Enabled',
      type: 'Boolean',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'username', type: 'String', operators: STRING_OPERATORS },
    { name: 'email', type: 'String', operators: STRING_OPERATORS },
    { name: 'firstName', type: 'String', operators: STRING_OPERATORS },
    { name: 'lastName', type: 'String', operators: STRING_OPERATORS },
    { name: 'enabled', type: 'Boolean', operators: BOOLEAN_OPERATORS },
  ],
  sortableFields: [
    { name: 'username' },
    { name: 'email' },
    { name: 'firstName' },
    { name: 'lastName' },
    { name: 'enabled' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'enabled', label: 'Enabled', isDefault: true },
    { name: 'disabled', label: 'Disabled', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'username',
};

/** Mock /meta payload for the OIDC applications resource. */
export const oidcApplicationQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'clientId',
      label: 'Client ID',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'displayName',
      label: 'Display name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'clientId', type: 'String', operators: STRING_OPERATORS },
    { name: 'displayName', type: 'String', operators: STRING_OPERATORS },
    { name: 'type', type: 'String', operators: ENUM_OPERATORS, enumValues: OIDC_APPLICATION_TYPES },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
  ],
  sortableFields: [{ name: 'clientId' }, { name: 'displayName' }, { name: 'type' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [{ name: 'type', type: 'String' }],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'clientId',
};

/** Mock /meta payload for the OIDC scopes resource. */
export const oidcScopeQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'displayName',
      label: 'Display name',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'String',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'displayName', type: 'String', operators: STRING_OPERATORS },
    { name: 'description', type: 'String', operators: STRING_OPERATORS },
  ],
  sortableFields: [{ name: 'name' }, { name: 'displayName' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'name',
};

/** Mock /meta payload for the OIDC authorizations resource. */
export const oidcAuthorizationQueryMetadata: QueryMetadata = {
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
      name: 'subject',
      label: 'Subject',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'clientId',
      label: 'Client ID',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'subject', type: 'String', operators: STRING_OPERATORS },
    { name: 'clientId', type: 'String', operators: STRING_OPERATORS },
    {
      name: 'status',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: OIDC_AUTHORIZATION_STATUSES,
    },
    {
      name: 'type',
      type: 'String',
      operators: ENUM_OPERATORS,
      enumValues: OIDC_AUTHORIZATION_TYPES,
    },
  ],
  sortableFields: [{ name: 'subject' }, { name: 'clientId' }, { name: 'status' }, { name: 'type' }],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'valid', label: 'Valid', isDefault: true },
    { name: 'revoked', label: 'Revoked', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [
    { name: 'status', type: 'String' },
    { name: 'type', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'subject',
};

/**
 * Create stateful MSW handlers for OpenIddict admin endpoints.
 * Handlers mutate in-memory state — mutations are reflected by subsequent GETs.
 *
 * @param baseUrl - API base path (default: `/api/v1/admin`)
 * @param oidcBaseUrl - Base path for non-admin OIDC endpoints used by the consent page (default: `/api/v1/oidc`)
 */
export function createOpenIddictAdminHandlers(
  baseUrl = DEFAULT_BASE_PATH,
  oidcBaseUrl = '/api/v1/oidc'
) {
  return [
    // ── Consent (non-admin) ──────────────────────────────────────────────────

    http.get(`${oidcBaseUrl}/applications/:clientId`, ({ params }) => {
      const app = mockOidcApplications.find(
        (a) => a.clientId === decodeURIComponent(params.clientId as string)
      );
      return app
        ? HttpResponse.json({ clientId: app.clientId, displayName: app.displayName })
        : notFound();
    }),

    // ── Query metadata ───────────────────────────────────────────────────────

    createQueryMetaHandler(`${baseUrl}/users`, adminUserQueryMetadata),
    createQueryMetaHandler(`${baseUrl}/oidc/applications`, oidcApplicationQueryMetadata),
    createQueryMetaHandler(`${baseUrl}/oidc/scopes`, oidcScopeQueryMetadata),
    createQueryMetaHandler(`${baseUrl}/oidc/authorizations`, oidcAuthorizationQueryMetadata),

    // ── Users ────────────────────────────────────────────────────────────────

    http.get(`${baseUrl}/users`, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search')?.toLowerCase();
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

      let filtered = [...mockAdminUsers];
      if (search) {
        filtered = filtered.filter(
          (u) =>
            u.email?.toLowerCase().includes(search) ||
            u.username?.toLowerCase().includes(search) ||
            u.firstName?.toLowerCase().includes(search) ||
            u.lastName?.toLowerCase().includes(search)
        );
      }

      const start = (page - 1) * pageSize;
      return pagedResponse(filtered.slice(start, start + pageSize), filtered.length);
    }),

    http.post(`${baseUrl}/users/:id/impersonate`, ({ params }) => {
      const user = mockAdminUsers.find((u) => u.userId === params.id);
      if (!user) return notFound();
      return HttpResponse.json({
        accessToken: `mock-impersonation-token-${String(params.id).slice(0, 8)}`,
        refreshToken: `mock-impersonation-refresh-${String(params.id).slice(0, 8)}`,
        expiresIn: 900,
      });
    }),

    // ── OIDC Applications ─────────────────────────────────────────────────────

    http.get(`${baseUrl}/oidc/applications`, ({ request }) =>
      pageOf(mockOidcApplications, new URL(request.url))
    ),

    http.get(`${baseUrl}/oidc/applications/:clientId`, ({ params }) => {
      const app = mockOidcApplications.find(
        (a) => a.clientId === decodeURIComponent(params.clientId as string)
      );
      return app ? HttpResponse.json(app) : notFound();
    }),

    http.post(`${baseUrl}/oidc/applications`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminOidcCreateApplicationRequest>;
      const newApp: (typeof mockOidcApplications)[number] = {
        clientId: body.clientId ?? `client-${String(mockOidcApplications.length)}`,
        displayName: body.displayName ?? null,
        type: body.type ?? null,
        tenantId: body.tenantId ?? null,
        permissions: body.permissions ?? [],
        redirectUris: body.redirectUris ?? [],
        postLogoutRedirectUris: body.postLogoutRedirectUris ?? [],
        consentType: body.consentType ?? null,
        clientSide: body.clientSide ?? null,
        deviceKind: body.deviceKind ?? null,
        hasSigningKey: false,
      };
      mockOidcApplications.push(newApp);
      // The plaintext secret rides on the creation response only — it is never
      // stored on the fixture, mirroring the hashed-at-rest backend.
      return created(
        body.generateClientSecret
          ? { ...newApp, generatedClientSecret: 'mock-secret-generated' }
          : newApp
      );
    }),

    http.put(`${baseUrl}/oidc/applications/:clientId`, async ({ params, request }) => {
      const idx = mockOidcApplications.findIndex((a) => a.clientId === params.clientId);
      if (idx === -1) return notFound();
      const body = (await request.json()) as Partial<AdminOidcApplicationResponse>;
      const existing = mockOidcApplications[idx] as (typeof mockOidcApplications)[number];
      const updated: (typeof mockOidcApplications)[number] = {
        clientId: existing.clientId,
        tenantId: existing.tenantId,
        deviceKind: existing.deviceKind,
        hasSigningKey: existing.hasSigningKey,
        displayName: 'displayName' in body ? (body.displayName ?? null) : existing.displayName,
        type: 'type' in body ? (body.type ?? null) : existing.type,
        permissions: body.permissions ?? existing.permissions,
        redirectUris: body.redirectUris ?? existing.redirectUris,
        postLogoutRedirectUris: body.postLogoutRedirectUris ?? existing.postLogoutRedirectUris,
        consentType: 'consentType' in body ? (body.consentType ?? null) : existing.consentType,
        clientSide: 'clientSide' in body ? (body.clientSide ?? null) : existing.clientSide,
      };
      mockOidcApplications[idx] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/oidc/applications/:clientId`, ({ params }) => {
      const idx = mockOidcApplications.findIndex((a) => a.clientId === params.clientId);
      if (idx === -1) return notFound();
      mockOidcApplications.splice(idx, 1);
      return noContent();
    }),

    http.post(`${baseUrl}/oidc/applications/:clientId/rotate-secret`, ({ params }) => {
      const app = mockOidcApplications.find((a) => a.clientId === params.clientId);
      if (!app) return notFound();
      return HttpResponse.json({
        clientId: String(params.clientId),
        displayName: app.displayName,
        newClientSecret: 'mock-secret-rotated',
      });
    }),

    // ── OIDC Scopes ───────────────────────────────────────────────────────────

    http.get(`${baseUrl}/oidc/scopes`, ({ request }) =>
      pageOf(mockOidcScopes, new URL(request.url))
    ),

    http.post(`${baseUrl}/oidc/scopes`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminOidcCreateScopeRequest>;
      const newScope: (typeof mockOidcScopes)[number] = {
        name: body.name ?? `scope-${String(mockOidcScopes.length)}`,
        displayName: body.displayName ?? null,
        description: body.description ?? null,
        resources: body.resources ?? [],
        tenantId: body.tenantId ?? null,
      };
      mockOidcScopes.push(newScope);
      return created(newScope);
    }),

    http.put(`${baseUrl}/oidc/scopes/:name`, async ({ params, request }) => {
      const scope = mockOidcScopes.find((s) => s.name === params.name);
      if (!scope) return notFound();
      const body = (await request.json()) as AdminOidcUpdateScopeRequest;
      if (body.displayName !== undefined) scope.displayName = body.displayName;
      if (body.description !== undefined) scope.description = body.description;
      if (body.resources !== undefined) scope.resources = body.resources ?? [];
      return HttpResponse.json(scope);
    }),

    http.delete(`${baseUrl}/oidc/scopes/:name`, ({ params }) => {
      const idx = mockOidcScopes.findIndex((s) => s.name === params.name);
      if (idx === -1) return notFound();
      mockOidcScopes.splice(idx, 1);
      return noContent();
    }),

    // ── OIDC Authorizations ───────────────────────────────────────────────────

    http.post(`${baseUrl}/oidc/authorizations`, async ({ request }) => {
      const body = (await request.json()) as AdminOidcCreateAuthorizationRequest;
      const app = mockOidcApplications.find((a) => a.clientId === body.clientId);
      if (!app) return notFound();
      const newAuth = {
        id: `auth_new_${mockOidcAuthorizations.length + 1}`,
        clientId: body.clientId,
        subject: body.subject,
        status: 'valid',
        type: 'permanent',
        scopes: [...body.scopes],
      };
      mockOidcAuthorizations.push(newAuth);
      return created(newAuth);
    }),

    http.get(`${baseUrl}/oidc/authorizations`, ({ request }) => {
      const url = new URL(request.url);
      const subject = url.searchParams.get('subject');
      const clientId = url.searchParams.get('clientId');

      let filtered = [...mockOidcAuthorizations];
      if (subject) filtered = filtered.filter((a) => a.subject === subject);
      if (clientId) filtered = filtered.filter((a) => a.clientId === clientId);

      return pageOf(filtered, url);
    }),

    http.delete(`${baseUrl}/oidc/authorizations/:id`, ({ params }) => {
      const authorization = mockOidcAuthorizations.find((a) => a.id === params.id);
      if (!authorization) return notFound();
      authorization.status = 'revoked';
      return noContent();
    }),

    http.delete(`${baseUrl}/oidc/authorizations/user/:userId`, ({ params }) => {
      mockOidcAuthorizations
        .filter((a) => a.subject === params.userId)
        .forEach((a) => {
          a.status = 'revoked';
        });
      return noContent();
    }),
  ];
}
