import type { CookieConsentConfigResponse } from '@granit/cookies';

/**
 * Mock cookie consent configuration mirroring `CookieConsentConfigResponse`
 * from `Granit.Http.Cookies.Endpoints`. Covers every CMP category so a
 * consent banner has representative content to render.
 */
export const mockCookieConsentConfig: CookieConsentConfigResponse = {
  cookies: [
    {
      name: 'cc_cookie',
      category: 'strictly_necessary',
      retentionDays: 182,
      purpose: 'Stores the cookie consent preferences.',
    },
    {
      name: '.AspNetCore.Antiforgery',
      category: 'strictly_necessary',
      retentionDays: 1,
      purpose: 'CSRF protection token.',
    },
    {
      name: 'theme',
      category: 'preferences',
      retentionDays: 365,
      purpose: 'Remembers the selected colour theme.',
    },
    {
      name: '_ga',
      category: 'analytics',
      retentionDays: 730,
      purpose: 'Distinguishes anonymous visitors (analytics).',
    },
    {
      name: '_fbp',
      category: 'marketing',
      retentionDays: 90,
      purpose: 'Delivers and measures advertising.',
    },
  ],
  services: [
    { name: 'theme', category: 'preferences', cookiePatterns: ['^theme$'] },
    { name: 'google-analytics', category: 'analytics', cookiePatterns: ['^_ga', '^_gid'] },
    { name: 'meta-pixel', category: 'marketing', cookiePatterns: ['^_fbp$'] },
  ],
};
