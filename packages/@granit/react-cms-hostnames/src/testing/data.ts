import { toISODateString } from '@granit/types';
// ---------------------------------------------------------------------------
// @granit/react-cms-hostnames/testing — mock fixtures
// ---------------------------------------------------------------------------

import type { SiteHostnameResponse } from '@granit/cms-hostnames';

export const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';

/**
 * Mock site hostnames. The list endpoint is keyed by route site id, so these
 * are returned for any site; `useSiteHostnames` returns a BARE ARRAY (not a
 * paged envelope).
 */
export const mockHostnames: SiteHostnameResponse[] = [
  {
    id: '60000000-0000-4000-8000-000000000001',
    host: 'www.example.com',
    status: 'Active',
    isPrimary: true,
    expectedDnsRecords: [{ recordType: 'Cname', name: 'www', value: 'edge.granit.app' }],
    lastCheckedAt: toISODateString('2026-06-01T08:00:00Z'),
    certificateStatus: 'Secured',
  },
  {
    id: '60000000-0000-4000-8000-000000000002',
    host: 'promo.example.com',
    status: 'Pending',
    isPrimary: false,
    expectedDnsRecords: [
      { recordType: 'Txt', name: '_granit-challenge.promo', value: 'granit-verify-7f3a9c2e' },
      { recordType: 'Cname', name: 'promo', value: 'edge.granit.app' },
    ],
    lastCheckedAt: null,
    certificateStatus: 'Unprovisioned',
  },
];
