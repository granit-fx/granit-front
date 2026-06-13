import { toEntityId, toISODateString } from '@granit/types';

import type { BffHostUser, BffTenantUser } from '@granit/bff';

/** Canonical CSRF token returned by the mock `POST /bff/csrf-token` handler. */
export const mockBffCsrfToken = 'csrf-mock-token';

/** Authenticated tenant-scoped user (carries a `tenantId`, `isHost: false`). */
export const mockBffTenantUser: BffTenantUser = {
  authenticated: true,
  isHost: false,
  sub: 'user-123',
  name: 'Alice Tenant',
  email: 'alice@acme.test',
  roles: ['Admin'],
  sessionExpiresAt: toISODateString('2026-12-31T23:59:59Z'),
  tenantId: toEntityId<'Tenant'>('acme'),
};

/** Authenticated Host (cross-tenant) user — never carries a `tenantId`. */
export const mockBffHostUser: BffHostUser = {
  authenticated: true,
  isHost: true,
  sub: 'host-1',
  name: 'Henry Host',
  email: 'henry@host.test',
  roles: ['Host'],
  sessionExpiresAt: toISODateString('2026-12-31T23:59:59Z'),
};
