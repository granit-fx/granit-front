// ---------------------------------------------------------------------------
// @granit/react-cms-redirects/testing — mock fixtures
// ---------------------------------------------------------------------------

import type { RedirectResponse } from '@granit/cms-redirects';

export const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';

/** Mock redirects for the corporate site. */
export const mockRedirects: RedirectResponse[] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    siteId: CORPORATE_SITE_ID,
    source: '/old-about',
    matchType: 'Exact',
    target: '/about',
    type: 'MovedPermanently',
    statusCode: 301,
    isActive: true,
    culture: null,
    origin: 'Manual',
    hitCount: 12,
    lastHitAt: '2026-05-01T09:30:00+00:00',
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    siteId: CORPORATE_SITE_ID,
    source: '/promo',
    matchType: 'Prefix',
    target: '/campaign-2026',
    type: 'Found',
    statusCode: 302,
    isActive: false,
    culture: 'en-GB',
    origin: 'Imported',
    hitCount: 0,
    lastHitAt: null,
  },
];
