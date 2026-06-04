// ---------------------------------------------------------------------------
// @granit/react-cms-redirects/testing — mock fixtures
// ---------------------------------------------------------------------------

import type { RedirectResponse } from '@granit/cms-redirects';

const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';

/** Mock redirects for the corporate site. */
export const mockRedirects: RedirectResponse[] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    siteId: CORPORATE_SITE_ID,
    fromPath: '/old-about',
    toPath: '/about',
    culture: null,
    statusCode: 301,
    isEnabled: true,
  },
  {
    id: '50000000-0000-4000-8000-000000000002',
    siteId: CORPORATE_SITE_ID,
    fromPath: '/promo',
    toPath: '/campaign-2026',
    culture: 'en-GB',
    statusCode: 302,
    isEnabled: false,
  },
];
