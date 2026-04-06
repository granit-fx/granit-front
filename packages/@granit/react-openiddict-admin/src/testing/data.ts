import type {
  AdminGroup,
  AdminOidcApplication,
  AdminOidcAuthorization,
  AdminOidcScope,
  AdminRole,
  AdminRoleMember,
  AdminUser,
} from '@granit/openiddict-admin';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const mockAdminUsers: Mutable<AdminUser>[] = [
  {
    userId: 'usr_01HZ9KQX0000000000001',
    username: 'alice.dupont',
    email: 'alice@granit-showcase.local',
    firstName: 'Alice',
    lastName: 'Dupont',
    enabled: true,
    extraProperties: {},
  },
  {
    userId: 'usr_01HZ9KQX0000000000002',
    username: 'bob.martin',
    email: 'bob@granit-showcase.local',
    firstName: 'Bob',
    lastName: 'Martin',
    enabled: true,
    extraProperties: {},
  },
  {
    userId: 'usr_01HZ9KQX0000000000003',
    username: null,
    email: 'charlie@granit-showcase.local',
    firstName: 'Charlie',
    lastName: 'Leblanc',
    enabled: false,
    extraProperties: { department: 'Engineering' },
  },
];

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const mockAdminRoles: Mutable<AdminRole>[] = [
  { name: 'admin', description: 'Full platform administrator' },
  { name: 'viewer', description: 'Read-only access' },
  { name: 'editor', description: 'Content management access' },
];

export const mockRoleMembers: Record<string, Mutable<AdminRoleMember>[]> = {
  admin: [
    {
      userId: 'usr_01HZ9KQX0000000000001',
      username: 'alice.dupont',
      email: 'alice@granit-showcase.local',
      firstName: 'Alice',
      lastName: 'Dupont',
    },
  ],
  viewer: [
    {
      userId: 'usr_01HZ9KQX0000000000002',
      username: 'bob.martin',
      email: 'bob@granit-showcase.local',
      firstName: 'Bob',
      lastName: 'Martin',
    },
  ],
  editor: [],
};

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export const mockAdminGroups: Mutable<AdminGroup>[] = [
  {
    id: 'grp_01HZ9KQX0000000000001',
    name: 'Platform Admins',
    description: 'Administrators with full access',
    tenantId: null,
  },
  {
    id: 'grp_01HZ9KQX0000000000002',
    name: 'Acme Users',
    description: 'Users belonging to the Acme tenant',
    tenantId: 'tnt_01HZ9KQX0000000000001',
  },
];

// ---------------------------------------------------------------------------
// OIDC Applications
// ---------------------------------------------------------------------------

export const mockOidcApplications: Mutable<AdminOidcApplication>[] = [
  {
    clientId: 'granit-showcase-admin',
    displayName: 'Granit Showcase Admin',
    type: 'public',
    tenantId: null,
  },
  {
    clientId: 'granit-api-m2m',
    displayName: 'Granit API (Machine-to-Machine)',
    type: 'confidential',
    tenantId: null,
  },
];

// ---------------------------------------------------------------------------
// OIDC Scopes
// ---------------------------------------------------------------------------

export const mockOidcScopes: Mutable<AdminOidcScope>[] = [
  { name: 'openid', displayName: 'OpenID', description: 'OpenID Connect identity scope' },
  { name: 'profile', displayName: 'Profile', description: 'User profile information' },
  { name: 'email', displayName: 'Email', description: 'User email address' },
  { name: 'granit:admin', displayName: 'Granit Admin', description: 'Platform administration' },
];

// ---------------------------------------------------------------------------
// OIDC Authorizations
// ---------------------------------------------------------------------------

export const mockOidcAuthorizations: Mutable<AdminOidcAuthorization>[] = [
  {
    id: 'auth_01HZ9KQX0000000000001',
    clientId: 'granit-showcase-admin',
    subject: 'usr_01HZ9KQX0000000000001',
    status: 'valid',
    type: 'permanent',
  },
  {
    id: 'auth_01HZ9KQX0000000000002',
    clientId: 'granit-api-m2m',
    subject: 'usr_01HZ9KQX0000000000002',
    status: 'valid',
    type: 'ad-hoc',
  },
  {
    id: 'auth_01HZ9KQX0000000000003',
    clientId: 'granit-showcase-admin',
    subject: 'usr_01HZ9KQX0000000000003',
    status: 'revoked',
    type: 'permanent',
  },
];
