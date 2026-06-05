// ---------------------------------------------------------------------------
// @granit/react-cms/testing — mock fixtures
// ---------------------------------------------------------------------------

import type {
  MenuResponse,
  PageTreeNodeResponse,
  ReleaseResponse,
  SiteResponse,
} from '@granit/cms';

/** Site id of the seeded "corporate" site, shared across the CMS fixtures. */
export const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';

/**
 * Mock CMS sites. `displayNames` always carries the `defaultCulture` key so a
 * label can be resolved via `displayNames[defaultCulture] ?? slug`.
 */
export const mockSites: SiteResponse[] = [
  {
    id: CORPORATE_SITE_ID,
    slug: 'corporate',
    defaultCulture: 'en-GB',
    allowedCultures: ['en-GB', 'fr-FR', 'nl-BE'],
    domains: [],
    defaultTheme: 'granit',
    activated: true,
    tenantId: null,
    displayNames: {
      'en-GB': 'Corporate Website',
      'fr-FR': 'Site corporatif',
      'nl-BE': 'Bedrijfswebsite',
    },
  },
  {
    id: 'c2e1d4b5-2e3f-4a6b-9c7d-2b3c4d5e6f70',
    slug: 'support',
    defaultCulture: 'en-GB',
    allowedCultures: ['en-GB', 'fr-FR'],
    domains: [],
    defaultTheme: 'granit',
    activated: true,
    tenantId: null,
    displayNames: {
      'en-GB': 'Support Portal',
      'fr-FR': 'Portail de support',
    },
  },
  {
    id: 'd3f2e5c6-3f40-4b7c-ad8e-3c4d5e6f7081',
    slug: 'campaign-2026',
    defaultCulture: 'fr-FR',
    allowedCultures: ['fr-FR'],
    domains: [],
    defaultTheme: 'granit',
    activated: false,
    tenantId: null,
    displayNames: {
      'fr-FR': 'Campagne 2026',
    },
  },
];

/**
 * Flat, tree-ordered page nodes for the corporate site. `usePageTree` returns a
 * bare array (NOT a paged envelope).
 */
export const mockPageTree: PageTreeNodeResponse[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    parentId: null,
    slugSegment: '',
    structurePath: '/',
    depth: 0,
    isSiteRoot: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    parentId: '10000000-0000-4000-8000-000000000001',
    slugSegment: 'about',
    structurePath: '/about',
    depth: 1,
    isSiteRoot: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    parentId: '10000000-0000-4000-8000-000000000002',
    slugSegment: 'team',
    structurePath: '/about/team',
    depth: 2,
    isSiteRoot: false,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    parentId: '10000000-0000-4000-8000-000000000001',
    slugSegment: 'contact',
    structurePath: '/contact',
    depth: 1,
    isSiteRoot: false,
  },
];

/** Mock menus for the corporate site. */
export const mockMenus: MenuResponse[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    siteId: CORPORATE_SITE_ID,
    key: 'main',
    title: 'Main navigation',
    items: [
      {
        label: 'Home',
        kind: 'Page',
        pageId: '10000000-0000-4000-8000-000000000001',
        url: null,
        anchor: null,
        isVisible: true,
        icon: null,
        cssClass: null,
        children: [],
      },
      {
        label: 'About',
        kind: 'Page',
        pageId: '10000000-0000-4000-8000-000000000002',
        url: null,
        anchor: null,
        isVisible: true,
        icon: null,
        cssClass: null,
        children: [],
      },
    ],
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    siteId: CORPORATE_SITE_ID,
    key: 'footer',
    title: 'Footer links',
    items: [
      {
        label: 'Privacy',
        kind: 'ExternalUrl',
        pageId: null,
        url: 'https://example.com/privacy',
        anchor: null,
        isVisible: true,
        icon: null,
        cssClass: null,
        children: [],
      },
    ],
  },
];

/** Mock releases for the corporate site (one draft, one scheduled). */
export const mockReleases: ReleaseResponse[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    siteId: CORPORATE_SITE_ID,
    name: 'Spring relaunch',
    status: 'Draft',
    schedule: null,
    tenantId: null,
    actions: [
      {
        id: '31000000-0000-4000-8000-000000000001',
        contentType: 'cms.page',
        contentId: '10000000-0000-4000-8000-000000000002',
        culture: 'en-GB',
        type: 'Publish',
        status: 'Pending',
        error: null,
      },
    ],
    concurrencyStamp: 'stamp-release-1',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    siteId: CORPORATE_SITE_ID,
    name: 'Q1 scheduled push',
    status: 'Ready',
    schedule: {
      localDateTime: '2026-07-01T09:00:00',
      timeZoneId: 'Europe/Brussels',
      scheduledAtUtc: '2026-07-01T07:00:00Z',
    },
    tenantId: null,
    actions: [
      {
        id: '31000000-0000-4000-8000-000000000002',
        contentType: 'cms.page',
        contentId: '10000000-0000-4000-8000-000000000004',
        culture: null,
        type: 'Publish',
        status: 'Pending',
        error: null,
      },
    ],
    concurrencyStamp: 'stamp-release-2',
  },
];
