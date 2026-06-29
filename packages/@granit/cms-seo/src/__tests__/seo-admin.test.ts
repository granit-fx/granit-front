import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  deleteSeoMetadata,
  getJsonLdPreview,
  getOgCardPreview,
  getSeoDefaults,
  getSeoMetadata,
  getSerpPreview,
  invalidateSitemap,
  listSeoMetadata,
  updateSeoDefaults,
  upsertSeoMetadata,
} from '../api/seo-admin';

import type {
  OgPreviewResponse,
  PagedResult,
  RobotsDirective,
  SeoMetadataListItem,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsResponse,
} from '../types/index';

const BASE = 'https://cms.example.com';
const PARAMS = { siteId: 'site-1', contentType: 'page', contentId: 'page-1', culture: 'fr' };
const META_URL = `${BASE}/sites/site-1/metadata/page/page-1/fr`;

const robots: RobotsDirective = {
  index: true,
  follow: true,
  noArchive: false,
  noSnippet: false,
  maxSnippet: null,
  maxImagePreview: null,
};

const metadata: SeoMetadataResponse = {
  id: 'm-1',
  siteId: 'site-1',
  contentType: 'page',
  contentId: 'page-1',
  culture: 'fr',
  title: 'Page title',
  titleTemplate: null,
  description: null,
  keywords: [],
  canonicalUrl: null,
  robots,
  openGraph: null,
  twitterCard: null,
  structuredDataExtras: null,
  disableAutoJsonLd: false,
  alternateOverrides: [],
  xDefaultCulture: null,
  statusAtLastReview: 'NeedsReview',
  lastReviewedAt: null,
  concurrencyStamp: 'stamp-1',
};

const defaults: SiteSeoDefaultsResponse = {
  id: 'd-1',
  siteId: 'site-1',
  titleTemplate: null,
  siteName: 'ACME',
  defaultDescription: null,
  defaultRobots: robots,
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
  concurrencyStamp: 'stamp-1',
};

describe('getSeoMetadata', () => {
  it('returns metadata on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: metadata });

    const result = await getSeoMetadata(client, BASE, PARAMS);

    expect(client.get).toHaveBeenCalledWith(META_URL, expect.objectContaining({}));
    expect(result).toEqual(metadata);
  });

  it('returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 404, data: null });

    const result = await getSeoMetadata(client, BASE, PARAMS);

    expect(result).toBeNull();
  });
});

describe('upsertSeoMetadata', () => {
  it('PUT to metadata URL', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(metadata));

    await upsertSeoMetadata(client, BASE, PARAMS, {
      title: 'Page title',
      alternateOverrides: [{ culture: 'en', href: 'https://example.com/en' }],
      structuredDataExtras: null,
    });

    expect(client.put).toHaveBeenCalledWith(META_URL, {
      title: 'Page title',
      alternateOverrides: [{ culture: 'en', href: 'https://example.com/en' }],
      structuredDataExtras: null,
    });
  });
});

describe('deleteSeoMetadata', () => {
  it('DELETE metadata URL', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deleteSeoMetadata(client, BASE, PARAMS);

    expect(client.delete).toHaveBeenCalledWith(META_URL);
  });
});

describe('getSeoDefaults', () => {
  it('GET /api/cms/seo/sites/{siteId}/defaults returns response on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(defaults));

    const result = await getSeoDefaults(client, BASE, 'site-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/sites/site-1/defaults`, {
      validateStatus: expect.any(Function),
    });
    expect(result).toEqual(defaults);
  });

  it('GET /api/cms/seo/sites/{siteId}/defaults returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ ...axiosResponse(null), status: 404 });

    const result = await getSeoDefaults(client, BASE, 'site-1');

    expect(result).toBeNull();
  });
});

describe('updateSeoDefaults', () => {
  it('PUT /api/cms/seo/sites/{siteId}/defaults', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(defaults));

    await updateSeoDefaults(client, BASE, 'site-1', { siteName: 'Updated' });

    expect(client.put).toHaveBeenCalledWith(`${BASE}/sites/site-1/defaults`, {
      siteName: 'Updated',
    });
  });
});

describe('listSeoMetadata', () => {
  it('GET /api/cms/seo/metadata serializes the query request', async () => {
    const client = createMockClient();
    const response: PagedResult<SeoMetadataListItem> = {
      items: [
        {
          id: 'm-1',
          siteId: 'site-1',
          contentType: 'page',
          contentId: 'p-1',
          culture: 'fr',
          title: null,
          description: null,
          canonicalUrl: null,
        },
      ],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listSeoMetadata(client, BASE, { quickFilters: ['MissingDescription'] });

    expect(client.get).toHaveBeenCalledWith(
      `${BASE}/metadata?quickFilters=MissingDescription`,
      undefined
    );
    expect(result).toEqual(response);
  });

  it('omits the query string when no params are passed', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
    );

    await listSeoMetadata(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/metadata`, undefined);
  });
});

describe('invalidateSitemap', () => {
  it('POST /api/cms/seo/sites/{siteId}/sitemap/invalidate', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    await invalidateSitemap(client, BASE, 'site-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/sites/site-1/sitemap/invalidate`);
  });
});

describe('getSerpPreview', () => {
  it('returns preview on 200', async () => {
    const client = createMockClient();
    const preview: SerpPreviewResponse = {
      title: 'T',
      description: 'D',
      displayUrl: 'https://example.com',
    };
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: preview });

    const result = await getSerpPreview(client, BASE, PARAMS);

    expect(client.get).toHaveBeenCalledWith(
      `${META_URL}/preview/serp`,
      expect.objectContaining({})
    );
    expect(result).toEqual(preview);
  });

  it('returns null on 204', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 204, data: null });

    const result = await getSerpPreview(client, BASE, PARAMS);

    expect(result).toBeNull();
  });
});

describe('getOgCardPreview', () => {
  it('returns preview on 200', async () => {
    const client = createMockClient();
    const preview: OgPreviewResponse = {
      type: 'website',
      title: 'T',
      description: 'D',
      imageUrl: null,
      siteName: 'S',
    };
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: preview });

    const result = await getOgCardPreview(client, BASE, PARAMS);

    expect(result).toEqual(preview);
  });

  it('returns null on 204', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 204, data: null });

    expect(await getOgCardPreview(client, BASE, PARAMS)).toBeNull();
  });
});

describe('getJsonLdPreview', () => {
  it('returns the @graph document on 200', async () => {
    const client = createMockClient();
    const graph = '{"@graph":[{"@type":"WebPage"}]}';
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: graph });

    const result = await getJsonLdPreview(client, BASE, PARAMS);

    expect(result).toBe(graph);
  });

  it('returns null on 204', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 204, data: null });

    expect(await getJsonLdPreview(client, BASE, PARAMS)).toBeNull();
  });
});
