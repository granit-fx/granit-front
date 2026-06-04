// ---------------------------------------------------------------------------
// @granit/react-cms-seo/testing — mock fixtures
// ---------------------------------------------------------------------------

import type {
  SeoAiSuggestionResponse,
  SeoAuditIssueResponse,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';

const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';

/** Default SEO settings keyed by site id, returned by `useSeoDefaults`. */
export const mockSeoDefaults: Record<string, SiteSeoDefaultsResponse> = {
  [CORPORATE_SITE_ID]: {
    siteId: CORPORATE_SITE_ID,
    titleTemplate: '%s | Granit Corporate',
    siteName: 'Granit Corporate',
    robots: { index: true, follow: true },
    canonicalHost: 'www.example.com',
    enableAutomaticSeoGeneration: true,
    sitemapMaxItems: 5000,
    robotsTxtRules: 'User-agent: *\nAllow: /',
  },
};

/** Audit issues returned by `useSeoAuditIssues`. */
export const mockSeoAuditIssues: SeoAuditIssueResponse[] = [
  {
    contentType: 'cms.page',
    contentId: '10000000-0000-4000-8000-000000000002',
    culture: 'en-GB',
    issueType: 'MissingDescription',
    detail: 'Page "/about" has no meta description.',
  },
  {
    contentType: 'cms.page',
    contentId: '10000000-0000-4000-8000-000000000004',
    culture: 'en-GB',
    issueType: 'TitleTooLong',
    detail: 'Title exceeds 60 characters.',
  },
];

/** AI suggestions inbox returned by `useSeoSuggestions`. */
export const mockSeoSuggestions: SeoAiSuggestionResponse[] = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    contentType: 'cms.page',
    contentId: '10000000-0000-4000-8000-000000000002',
    culture: 'en-GB',
    status: 'Ready',
    suggestion: {
      title: 'About Granit — Our team and mission',
      description: 'Meet the people behind Granit and learn what drives us.',
    },
    diff: {
      description: {
        current: null,
        proposed: 'Meet the people behind Granit and learn what drives us.',
      },
    },
  },
];
