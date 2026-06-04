// ---------------------------------------------------------------------------
// @granit/react-cms-hostnames/testing — mock fixtures
// ---------------------------------------------------------------------------

import type { ManagedHostnameResponse } from '@granit/cms-hostnames';

export const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';

/**
 * Mock managed hostnames for the corporate site. `useSiteHostnames` returns a
 * BARE ARRAY (not a paged envelope).
 */
export const mockHostnames: ManagedHostnameResponse[] = [
  {
    id: '60000000-0000-4000-8000-000000000001',
    host: 'www.example.com',
    ownerType: 'cms.site',
    ownerId: CORPORATE_SITE_ID,
    tenantId: null,
    isPrimary: true,
    status: 'Active',
    verificationToken: null,
    expectedDnsRecords: [{ recordType: 'Cname', name: 'www', value: 'edge.granit.app' }],
    lastCheckedAt: '2026-06-01T08:00:00Z',
    conflicts: [],
    failedCheckCount: 0,
    nextCheckAt: null,
    certificateStatus: 'Secured',
    certExpiresAt: '2026-09-01T00:00:00Z',
    createdAt: '2026-05-01T10:00:00Z',
    createdBy: 'marie.dupont',
    modifiedAt: null,
    modifiedBy: null,
    concurrencyStamp: 'stamp-hostname-1',
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    host: 'promo.example.com',
    ownerType: 'cms.site',
    ownerId: CORPORATE_SITE_ID,
    tenantId: null,
    isPrimary: false,
    status: 'Pending',
    verificationToken: 'granit-verify-7f3a9c2e',
    expectedDnsRecords: [
      { recordType: 'Txt', name: '_granit-challenge.promo', value: 'granit-verify-7f3a9c2e' },
      { recordType: 'Cname', name: 'promo', value: 'edge.granit.app' },
    ],
    lastCheckedAt: null,
    conflicts: [],
    failedCheckCount: 0,
    nextCheckAt: '2026-06-04T12:00:00Z',
    certificateStatus: 'Unprovisioned',
    certExpiresAt: null,
    createdAt: '2026-06-03T14:30:00Z',
    createdBy: 'marie.dupont',
    modifiedAt: null,
    modifiedBy: null,
    concurrencyStamp: 'stamp-hostname-2',
  },
];
