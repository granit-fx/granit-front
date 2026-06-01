import { BOOLEAN_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH, DEFAULT_PROVIDER_BASE_PATH } from '../constants';

import { mockDevices, mockPasswordChangedAt, mockSessions, mockUsers } from './data';

import type { IdentityProviderCapabilities, IdentityUser } from '@granit/identity';
import type { QueryMetadata } from '@granit/query-engine';

/** Mock /meta payload for the cached identity-users resource. */
export const identityUserQueryMetadata: QueryMetadata = {
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

// ---------------------------------------------------------------------------
// Mock role data
// ---------------------------------------------------------------------------

const mockRoles = [
  { id: 'role-admin', name: 'admin', description: 'Full administrator access' },
  { id: 'role-user', name: 'user', description: 'Standard user access' },
  { id: 'role-manager', name: 'manager', description: 'Team manager access' },
  { id: 'role-auditor', name: 'auditor', description: 'Read-only audit access' },
];

const mockRoleAssignments: Record<string, string[]> = {
  'd2c47314-4d08-4952-98b1-a1b8a6e22ef1': ['admin', 'user'],
  'user-002': ['user'],
  'user-003': ['user'],
  'user-004': ['user'],
  'user-005': ['admin', 'user'],
  'user-006': ['user'],
  'user-007': [],
  'user-008': ['user'],
  'user-009': ['user'],
  'user-010': ['admin'],
  'user-011': ['user'],
  'user-012': ['user'],
  'user-013': ['user'],
  'user-014': ['user'],
  'user-015': ['user'],
};

// ---------------------------------------------------------------------------
// Mock group data
// ---------------------------------------------------------------------------

interface MockGroup {
  id: string;
  name: string;
  path: string;
  subGroups: MockGroup[];
}

const mockGroups: MockGroup[] = [
  {
    id: 'grp-1',
    name: 'Administrators',
    path: '/administrators',
    subGroups: [],
  },
  {
    id: 'grp-2',
    name: 'Healthcare',
    path: '/healthcare',
    subGroups: [
      { id: 'grp-2-1', name: 'Doctors', path: '/healthcare/doctors', subGroups: [] },
      { id: 'grp-2-2', name: 'Nurses', path: '/healthcare/nurses', subGroups: [] },
    ],
  },
  { id: 'grp-3', name: 'Support', path: '/support', subGroups: [] },
];

const mockUserGroups: Record<string, string[]> = {
  'd2c47314-4d08-4952-98b1-a1b8a6e22ef1': ['grp-1'],
  'user-002': ['grp-2-1'],
  'user-005': ['grp-1', 'grp-2'],
  'user-010': ['grp-1'],
};

function flatGroups(): MockGroup[] {
  const result: MockGroup[] = [];
  function walk(groups: MockGroup[]) {
    for (const g of groups) {
      result.push(g);
      walk(g.subGroups);
    }
  }
  walk(mockGroups);
  return result;
}

function findGroupById(id: string): MockGroup | undefined {
  return flatGroups().find((g) => g.id === id);
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

const capabilities: IdentityProviderCapabilities = {
  providerName: 'Keycloak',
  supportsIndividualSessionTermination: true,
  supportsNativePasswordResetEmail: true,
  supportsGroupHierarchy: true,
  supportsCustomAttributes: true,
  maxCustomAttributes: 20,
  supportsCredentialVerification: true,
  supportsUserCreation: true,
  supportsGroupManagement: false,
};

// ---------------------------------------------------------------------------
// Helper: map IdentityUser to response shape with metadata
// ---------------------------------------------------------------------------

function toIdentityUser(u: IdentityUser) {
  return {
    userId: u.userId,
    username: u.username,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    enabled: u.enabled,
    metadata: { locale: 'fr', timezone: 'Europe/Brussels' },
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create stateful MSW handlers for identity provider and user cache endpoints.
 *
 * @param providerBase - Provider API base path (default: `/api/v1/identity/provider`)
 * @param cacheBase    - Cache API base path (default: `/api/v1/identity/users`)
 */
export function createIdentityHandlers(
  providerBase = DEFAULT_PROVIDER_BASE_PATH,
  cacheBase = DEFAULT_BASE_PATH
) {
  return [
    // ── Cache endpoints (/identity/users) ───────────────────────────────────

    // GET /identity/users/meta — query metadata
    createQueryMetaHandler(cacheBase, identityUserQueryMetadata),

    http.get(`${cacheBase}/capabilities`, () => {
      return HttpResponse.json(capabilities);
    }),

    http.get(`${cacheBase}/stats`, () => {
      return HttpResponse.json({
        totalEntries: mockUsers.length,
        staleEntries: 2,
        oldestSyncAt: '2026-03-01T08:00:00Z',
        newestSyncAt: '2026-03-20T09:00:00Z',
      });
    }),

    http.get(cacheBase, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

      let filtered = mockUsers.map(toIdentityUser);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q)
        );
      }
      const start = (page - 1) * pageSize;
      return HttpResponse.json({
        items: filtered.slice(start, start + pageSize),
        totalCount: filtered.length,
      });
    }),

    http.get(`${cacheBase}/:userId`, ({ params }) => {
      const user = mockUsers.find((u) => u.userId === params.userId);
      if (!user) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(toIdentityUser(user));
    }),

    http.post(`${cacheBase}/batch`, async ({ request }) => {
      const body = (await request.json()) as { userIds: string[] };
      const users = body.userIds
        .map((id) => mockUsers.find((u) => u.userId === id))
        .filter(Boolean)
        .map((u) => toIdentityUser(u!));
      return HttpResponse.json(users);
    }),

    http.post(`${cacheBase}/sync`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${cacheBase}/sync-all`, () => HttpResponse.json({ syncedCount: mockUsers.length })),
    http.post(`${cacheBase}/sync-stale`, () => HttpResponse.json({ refreshedCount: 2 })),

    http.delete(`${cacheBase}/:userId`, () => new HttpResponse(null, { status: 204 })),

    // ── Provider user endpoints (/identity/provider) ───────────────────────

    http.get(`${providerBase}/users`, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
      const max = Number(url.searchParams.get('max') ?? 50);

      let users = mockUsers.map(toIdentityUser);
      if (search) {
        const q = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q)
        );
      }
      return HttpResponse.json(users.slice(0, max));
    }),

    http.get(`${providerBase}/users/:userId`, ({ params }) => {
      const user = mockUsers.find((u) => u.userId === params.userId);
      if (!user) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(toIdentityUser(user));
    }),

    http.post(`${providerBase}/users`, async ({ request }) => {
      const body = (await request.json()) as {
        username: string;
        email: string;
        firstName?: string;
        lastName?: string;
        enabled: boolean;
      };
      const newUser = {
        userId: `user-new-${Date.now()}`,
        username: body.username,
        email: body.email,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        enabled: body.enabled,
        metadata: {},
      };
      return HttpResponse.json(newUser, { status: 201 });
    }),

    http.put(`${providerBase}/users/:userId`, async ({ params, request }) => {
      const body = (await request.json()) as {
        email?: string;
        firstName?: string;
        lastName?: string;
      };
      const idx = mockUsers.findIndex((u) => u.userId === params.userId);
      const existing = mockUsers[idx];
      if (idx === -1 || !existing) return new HttpResponse(null, { status: 404 });
      const updated: IdentityUser = {
        ...existing,
        ...(body.email !== undefined && { email: body.email }),
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
      };
      mockUsers[idx] = updated;
      return HttpResponse.json(toIdentityUser(updated));
    }),

    http.patch(`${providerBase}/users/:userId/enabled`, async ({ params, request }) => {
      const body = (await request.json()) as { enabled: boolean };
      const idx = mockUsers.findIndex((u) => u.userId === params.userId);
      const existing = mockUsers[idx];
      if (idx === -1 || !existing) return new HttpResponse(null, { status: 404 });
      mockUsers[idx] = { ...existing, enabled: body.enabled };
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Roles (/identity/provider/roles) ───────────────────────────────────

    http.get(`${providerBase}/roles`, () => {
      return HttpResponse.json(mockRoles);
    }),

    http.get(`${providerBase}/roles/:roleName/members`, ({ params }) => {
      const roleName = params.roleName as string;
      const memberIds = Object.entries(mockRoleAssignments)
        .filter(([, roles]) => roles.includes(roleName))
        .map(([userId]) => userId);
      const members = memberIds
        .map((id) => mockUsers.find((u) => u.userId === id))
        .filter(Boolean)
        .map((u) => toIdentityUser(u!));
      return HttpResponse.json(members);
    }),

    http.get(`${providerBase}/users/:userId/roles`, ({ params }) => {
      const roleNames = mockRoleAssignments[params.userId as string] ?? [];
      const roles = roleNames.map((name) => mockRoles.find((r) => r.name === name)).filter(Boolean);
      return HttpResponse.json(roles);
    }),

    http.put(`${providerBase}/users/:userId/roles/:roleName`, ({ params }) => {
      const userId = params.userId as string;
      const roleName = params.roleName as string;
      mockRoleAssignments[userId] ??= [];
      if (!mockRoleAssignments[userId].includes(roleName)) {
        mockRoleAssignments[userId].push(roleName);
      }
      return new HttpResponse(null, { status: 204 });
    }),

    http.delete(`${providerBase}/users/:userId/roles/:roleName`, ({ params }) => {
      const userId = params.userId as string;
      const roleName = params.roleName as string;
      if (mockRoleAssignments[userId]) {
        mockRoleAssignments[userId] = mockRoleAssignments[userId].filter((r) => r !== roleName);
      }
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Groups (/identity/provider/groups) ─────────────────────────────────

    http.get(`${providerBase}/groups`, () => {
      return HttpResponse.json(mockGroups);
    }),

    http.get(`${providerBase}/users/:userId/groups`, ({ params }) => {
      const groupIds = mockUserGroups[params.userId as string] ?? [];
      const groups = groupIds.map(findGroupById).filter(Boolean);
      return HttpResponse.json(groups);
    }),

    http.put(`${providerBase}/users/:userId/groups/:groupId`, ({ params }) => {
      const userId = params.userId as string;
      const groupId = params.groupId as string;
      mockUserGroups[userId] ??= [];
      if (!mockUserGroups[userId].includes(groupId)) {
        mockUserGroups[userId].push(groupId);
      }
      return new HttpResponse(null, { status: 204 });
    }),

    http.delete(`${providerBase}/users/:userId/groups/:groupId`, ({ params }) => {
      const userId = params.userId as string;
      const groupId = params.groupId as string;
      if (mockUserGroups[userId]) {
        mockUserGroups[userId] = mockUserGroups[userId].filter((g) => g !== groupId);
      }
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Sessions (/identity/provider/users/:userId/sessions) ──────────────

    http.get(`${providerBase}/users/:userId/sessions`, ({ params }) => {
      const user = mockUsers.find((u) => u.userId === params.userId);
      if (!user) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(user.enabled ? mockSessions : []);
    }),

    http.get(`${providerBase}/users/:userId/devices`, ({ params }) => {
      const user = mockUsers.find((u) => u.userId === params.userId);
      if (!user) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(user.enabled ? mockDevices : []);
    }),

    http.delete(`${providerBase}/users/:userId/sessions/:sessionId`, () => {
      return new HttpResponse(null, { status: 204 });
    }),

    http.delete(`${providerBase}/users/:userId/sessions`, () => {
      return new HttpResponse(null, { status: 204 });
    }),

    // ── Passwords (/identity/provider/users/:userId/password) ─────────────

    http.get(`${providerBase}/users/:userId/password/changed-at`, ({ params }) => {
      const changedAt = mockPasswordChangedAt[params.userId as string] ?? null;
      return HttpResponse.json({ changedAt });
    }),

    http.post(`${providerBase}/users/:userId/password/reset-email`, () => {
      return new HttpResponse(null, { status: 204 });
    }),

    http.post(`${providerBase}/users/:userId/password/temporary`, () => {
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
