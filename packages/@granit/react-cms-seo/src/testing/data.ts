import { toISODateString } from '@granit/types';
// ---------------------------------------------------------------------------
// @granit/react-cms-seo/testing — mock fixtures
// ---------------------------------------------------------------------------

import type {
  QueryMetadata,
  SeoSuggestionResponse,
  SeoMetadataListItem,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';

const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';
// Showcase seed site id (ShowcaseCmsIds.AcmeSiteId)
const ACME_SITE_ID = '30000000-0000-0000-0000-000000000001';

const defaultRobots = {
  index: true,
  follow: true,
  noArchive: false,
  noSnippet: false,
  maxSnippet: null,
  maxImagePreview: null,
} as const;

/** Default SEO settings keyed by site id, returned by `useSeoDefaults`. */
export const mockSeoDefaults: Record<string, SiteSeoDefaultsResponse> = {
  [ACME_SITE_ID]: {
    id: 'c0ffee00-0000-4000-8000-000000000002',
    siteId: ACME_SITE_ID,
    titleTemplate: '{title} | Acme',
    siteName: 'Acme',
    defaultDescription: null,
    defaultRobots,
    canonicalHost: null,
    sitemapMaxUrlsPerFile: 45000,
    inheritFromParentPage: false,
    defaultOpenGraph: null,
    defaultTwitterCard: null,
    defaultOgImage: null,
    robotsTxtRules: [],
    robotsTxtExtra: null,
    manifest: null,
    enableAutomaticSeoGeneration: false,
    concurrencyStamp: 'stamp-acme',
  },
  [CORPORATE_SITE_ID]: {
    id: 'c0ffee00-0000-4000-8000-000000000001',
    siteId: CORPORATE_SITE_ID,
    titleTemplate: '{title} | Granit Corporate',
    siteName: 'Granit Corporate',
    defaultDescription: 'Granit Corporate — official site.',
    defaultRobots,
    canonicalHost: 'https://www.example.com',
    sitemapMaxUrlsPerFile: 45000,
    inheritFromParentPage: false,
    defaultOpenGraph: null,
    defaultTwitterCard: null,
    defaultOgImage: null,
    robotsTxtRules: [{ userAgent: '*', allow: ['/'], disallow: [], crawlDelay: null }],
    robotsTxtExtra: null,
    manifest: null,
    enableAutomaticSeoGeneration: true,
    concurrencyStamp: 'stamp-1',
  },
};

/** Audit-grid rows returned by `useSeoMetadataAudit`. */
export const mockSeoMetadataAudit: SeoMetadataListItem[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    siteId: CORPORATE_SITE_ID,
    contentType: 'cms.page',
    contentId: '10000000-0000-4000-8000-000000000002',
    culture: 'en-GB',
    title: 'About Granit',
    description: null,
    canonicalUrl: null,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    siteId: CORPORATE_SITE_ID,
    contentType: 'cms.page',
    contentId: '10000000-0000-4000-8000-000000000004',
    culture: 'en-GB',
    title: 'Our very long page title that exceeds the SERP-safe sixty character limit',
    description: 'A description.',
    canonicalUrl: 'https://www.example.com/en/long',
  },
];

/**
 * Query metadata for the SEO audit grid, returned by `useSeoMetadataMeta`
 * (`GET {basePath}/metadata/meta`). Surfaces the `SeoMetadataQueryDefinition`
 * quick filters so the audit toolbar can render them server-driven.
 */
export const mockSeoMetadataMeta: QueryMetadata = {
  columns: [],
  filterableFields: [
    { name: 'siteId', type: 'Guid', operators: ['Eq'] },
    { name: 'contentType', type: 'String', operators: ['Eq', 'Contains'] },
  ],
  sortableFields: [{ name: 'contentType' }, { name: 'title' }],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'MissingDescription', label: 'Missing description', isDefault: false },
    { name: 'NoCanonical', label: 'No canonical', isDefault: false },
    { name: 'TitleTooLong', label: 'Title too long', isDefault: false },
    { name: 'MissingOgImage', label: 'Missing OG image', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10000,
    supportsCursor: false,
  },
};

/** AI suggestions inbox returned by `useSeoSuggestions`. */
export const mockSeoSuggestions: SeoSuggestionResponse[] = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    siteId: CORPORATE_SITE_ID,
    contentType: 'cms.page',
    contentId: '10000000-0000-4000-8000-000000000002',
    culture: 'en-GB',
    status: 'Pending',
    scope: 'Title, Description',
    appliedFields: 'None',
    title: 'About Granit — Our team and mission',
    description: 'Meet the people behind Granit and learn what drives us.',
    keywords: ['granit', 'about', 'team'],
    ogImageAltText: null,
    structuredDataJson: null,
    modelId: 'gpt-4o-mini',
    promptTemplateVersion: 'v1',
    createdAt: toISODateString('2026-06-01T10:00:00.000Z'),
    reviewedBy: null,
    reviewedAt: null,
    failureReason: null,
    rejectionReason: null,
  },
];
