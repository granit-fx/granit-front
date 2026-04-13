import { noContent, notFound, pagedResponse } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import {
  mockAdminGroups,
  mockAdminRoles,
  mockAdminUsers,
  mockOidcApplications,
  mockOidcAuthorizations,
  mockOidcScopes,
  mockRoleMembers,
} from './data.js';

import type {
  AdminGroup,
  AdminOidcApplication,
  AdminOidcScope,
  AdminRole,
  AdminUser,
} from '@granit/openiddict-admin';

/**
 * Create stateful MSW handlers for OpenIddict admin endpoints.
 * Handlers mutate in-memory state — mutations are reflected by subsequent GETs.
 *
 * @param baseUrl - API base path (default: `/admin`)
 */
export function createOpenIddictAdminHandlers(baseUrl = '/admin') {
  return [
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

    http.get(`${baseUrl}/users/:id`, ({ params }) => {
      const user = mockAdminUsers.find((u) => u.userId === params.id);
      if (!user) return notFound();
      return HttpResponse.json(user);
    }),

    http.post(`${baseUrl}/users`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminUser>;
      const newUser: (typeof mockAdminUsers)[number] = {
        userId: `usr_${Date.now()}`,
        username: null,
        email: body.email ?? null,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        enabled: true,
        extraProperties: {},
      };
      mockAdminUsers.push(newUser);
      return HttpResponse.json(newUser, { status: 201 });
    }),

    http.delete(`${baseUrl}/users/:id`, ({ params }) => {
      const idx = mockAdminUsers.findIndex((u) => u.userId === params.id);
      if (idx === -1) return notFound();
      mockAdminUsers.splice(idx, 1);
      return noContent();
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

    // ── Roles ─────────────────────────────────────────────────────────────────

    http.get(`${baseUrl}/roles`, () => HttpResponse.json(mockAdminRoles)),

    http.get(`${baseUrl}/roles/:name/members`, ({ params }) => {
      const members = mockRoleMembers[String(params.name)] ?? [];
      return HttpResponse.json(members);
    }),

    http.post(`${baseUrl}/roles`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminRole>;
      const newRole: (typeof mockAdminRoles)[number] = {
        name: body.name ?? 'new-role',
        description: body.description ?? null,
      };
      mockAdminRoles.push(newRole);
      return HttpResponse.json(newRole, { status: 201 });
    }),

    http.delete(`${baseUrl}/roles/:name`, ({ params }) => {
      const idx = mockAdminRoles.findIndex((r) => r.name === params.name);
      if (idx === -1) return notFound();
      mockAdminRoles.splice(idx, 1);
      return noContent();
    }),

    // ── Groups ────────────────────────────────────────────────────────────────

    http.get(`${baseUrl}/groups`, () => HttpResponse.json(mockAdminGroups)),

    http.post(`${baseUrl}/groups`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminGroup>;
      const newGroup: (typeof mockAdminGroups)[number] = {
        id: `grp_${Date.now()}`,
        name: body.name ?? 'New Group',
        description: body.description ?? null,
        tenantId: null,
      };
      mockAdminGroups.push(newGroup);
      return HttpResponse.json(newGroup, { status: 201 });
    }),

    http.delete(`${baseUrl}/groups/:id`, ({ params }) => {
      const idx = mockAdminGroups.findIndex((g) => g.id === params.id);
      if (idx === -1) return notFound();
      mockAdminGroups.splice(idx, 1);
      return noContent();
    }),

    http.post(`${baseUrl}/groups/:id/members`, async ({ params, request }) => {
      const group = mockAdminGroups.find((g) => g.id === params.id);
      if (!group) return notFound();
      await request.json(); // consume body
      return noContent();
    }),

    http.delete(`${baseUrl}/groups/:id/members/:userId`, ({ params }) => {
      const group = mockAdminGroups.find((g) => g.id === params.id);
      if (!group) return notFound();
      return noContent();
    }),

    // ── OIDC Applications ─────────────────────────────────────────────────────

    http.get(`${baseUrl}/oidc/applications`, () => HttpResponse.json(mockOidcApplications)),

    http.post(`${baseUrl}/oidc/applications`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminOidcApplication>;
      const newApp: (typeof mockOidcApplications)[number] = {
        clientId: body.clientId ?? `client-${Date.now()}`,
        displayName: body.displayName ?? null,
        type: 'public',
        tenantId: null,
      };
      mockOidcApplications.push(newApp);
      return HttpResponse.json(newApp, { status: 201 });
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
        newSecret: `mock-secret-${Date.now()}`,
      });
    }),

    // ── OIDC Scopes ───────────────────────────────────────────────────────────

    http.get(`${baseUrl}/oidc/scopes`, () => HttpResponse.json(mockOidcScopes)),

    http.post(`${baseUrl}/oidc/scopes`, async ({ request }) => {
      const body = (await request.json()) as Partial<AdminOidcScope>;
      const newScope: (typeof mockOidcScopes)[number] = {
        name: body.name ?? `scope-${Date.now()}`,
        displayName: body.displayName ?? null,
        description: body.description ?? null,
      };
      mockOidcScopes.push(newScope);
      return HttpResponse.json(newScope, { status: 201 });
    }),

    http.delete(`${baseUrl}/oidc/scopes/:name`, ({ params }) => {
      const idx = mockOidcScopes.findIndex((s) => s.name === params.name);
      if (idx === -1) return notFound();
      mockOidcScopes.splice(idx, 1);
      return noContent();
    }),

    // ── OIDC Authorizations ───────────────────────────────────────────────────

    http.get(`${baseUrl}/oidc/authorizations`, ({ request }) => {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      const clientId = url.searchParams.get('clientId');

      let filtered = [...mockOidcAuthorizations];
      if (userId) filtered = filtered.filter((a) => a.subject === userId);
      if (clientId) filtered = filtered.filter((a) => a.clientId === clientId);

      return HttpResponse.json(filtered);
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
