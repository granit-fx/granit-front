import type {
  AdminOidcApplicationResponse,
  AdminOidcAuthorizationResponse,
  AdminOidcScopeResponse,
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

export const mockOidcApplications: Mutable<AdminOidcApplicationResponse>[] = [
  {
    clientId: 'granit-showcase-admin',
    displayName: 'Granit Showcase Admin',
    type: 'web',
    tenantId: null,
    permissions: ['ept:token', 'gt:authorization_code', 'gt:refresh_token', 'rst:identity'],
    redirectUris: ['https://showcase.granit-fx.dev/callback'],
    postLogoutRedirectUris: ['https://showcase.granit-fx.dev/signout-callback'],
    consentType: 'implicit',
    clientSide: 3,
    hasSigningKey: false,
  },
  {
    clientId: 'granit-api-m2m',
    displayName: 'Granit API (Machine-to-Machine)',
    type: 'native',
    tenantId: null,
    permissions: ['ept:token', 'gt:client_credentials'],
    redirectUris: [],
    postLogoutRedirectUris: [],
    consentType: null,
    clientSide: 1,
    hasSigningKey: false,
  },
];

// ---------------------------------------------------------------------------
// OIDC Scopes
// ---------------------------------------------------------------------------

export const mockOidcScopes: Mutable<AdminOidcScopeResponse>[] = [
  {
    name: 'openid',
    displayName: 'OpenID',
    description: 'OpenID Connect identity scope',
    resources: [],
  },
  {
    name: 'profile',
    displayName: 'Profile',
    description: 'User profile information',
    resources: [],
  },
  { name: 'email', displayName: 'Email', description: 'User email address', resources: [] },
  {
    name: 'granit:admin',
    displayName: 'Granit Admin',
    description: 'Platform administration',
    resources: ['api://granit-admin'],
  },
];

// ---------------------------------------------------------------------------
// OIDC Authorizations
// ---------------------------------------------------------------------------

export const mockOidcAuthorizations: Mutable<AdminOidcAuthorizationResponse>[] = [
  {
    id: 'auth_01HZ9KQX0000000000001',
    clientId: 'granit-showcase-admin',
    subject: 'usr_01HZ9KQX0000000000001',
    status: 'valid',
    type: 'permanent',
    scopes: ['openid', 'profile', 'email'],
  },
  {
    id: 'auth_01HZ9KQX0000000000002',
    clientId: 'granit-api-m2m',
    subject: 'usr_01HZ9KQX0000000000002',
    status: 'valid',
    type: 'ad-hoc',
    scopes: ['granit:admin'],
  },
  {
    id: 'auth_01HZ9KQX0000000000003',
    clientId: 'granit-showcase-admin',
    subject: 'usr_01HZ9KQX0000000000003',
    status: 'revoked',
    type: 'permanent',
    scopes: ['openid'],
  },
];
