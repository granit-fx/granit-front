import type {
  AdminOidcApplication,
  AdminOidcAuthorization,
  AdminOidcScope,
  AdminUser,
} from '@granit/openiddict-admin';
import type { Mutable } from '@granit/testing';

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
    metadata: {},
  },
  {
    userId: 'usr_01HZ9KQX0000000000002',
    username: 'bob.martin',
    email: 'bob@granit-showcase.local',
    firstName: 'Bob',
    lastName: 'Martin',
    enabled: true,
    metadata: {},
  },
  {
    userId: 'usr_01HZ9KQX0000000000003',
    username: null,
    email: 'charlie@granit-showcase.local',
    firstName: 'Charlie',
    lastName: 'Leblanc',
    enabled: false,
    metadata: { department: 'Engineering' },
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
