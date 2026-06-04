import { toEntityId, toISODateString } from '@granit/types';

import type { BffHostUser, BffSessionInfo, BffTenantUser } from '@granit/bff';

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

/**
 * Active BFF sessions for the current user. Session IDs are masked
 * server-side, mirroring `Granit.Bff` `MaskSessionId` output.
 */
export const mockBffSessions: BffSessionInfo[] = [
  {
    sessionId: toEntityId<'BffSession'>('ab12...cd34'),
    isCurrent: true,
    createdAt: toISODateString('2026-03-23T08:15:00Z'),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0',
  },
  {
    sessionId: toEntityId<'BffSession'>('ef56...gh78'),
    isCurrent: false,
    createdAt: toISODateString('2026-03-22T14:30:00Z'),
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0) Safari/605.1.15',
  },
  {
    sessionId: toEntityId<'BffSession'>('ij90...kl12'),
    isCurrent: false,
    createdAt: toISODateString('2026-03-20T09:45:00Z'),
    userAgent: null,
  },
];
