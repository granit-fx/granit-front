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
  listSeoAuditIssues,
  updateSeoDefaults,
  upsertSeoMetadata,
} from '../api/seo-admin.js';

import type {
  OgCardPreviewResponse,
  PagedResponse,
  SeoAuditIssueResponse,
  SeoMetadataResponse,
  SerpPreviewResponse,
  SiteSeoDefaultsResponse,
} from '../types/index.js';

const BASE = 'https://cms.example.com';
const PARAMS = { siteId: 'site-1', contentType: 'page', contentId: 'page-1', culture: 'fr' };
const META_URL = `${BASE}/api/cms/seo/sites/site-1/metadata/page/page-1/fr`;

const metadata: SeoMetadataResponse = {
  contentType: 'page',
  contentId: 'page-1',
  culture: 'fr',
  title: 'Page title',
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

    await upsertSeoMetadata(client, BASE, PARAMS, { title: 'Page title' });

    expect(client.put).toHaveBeenCalledWith(META_URL, { title: 'Page title' });
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
  it('GET /api/cms/seo/sites/{siteId}/defaults', async () => {
    const client = createMockClient();
    const defaults: SiteSeoDefaultsResponse = { siteId: 'site-1', siteName: 'ACME' };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(defaults));

    const result = await getSeoDefaults(client, BASE, 'site-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/seo/sites/site-1/defaults`);
    expect(result).toEqual(defaults);
  });
});

describe('updateSeoDefaults', () => {
  it('PUT /api/cms/seo/sites/{siteId}/defaults', async () => {
    const client = createMockClient();
    const updated: SiteSeoDefaultsResponse = { siteId: 'site-1', siteName: 'Updated' };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    await updateSeoDefaults(client, BASE, 'site-1', { siteName: 'Updated' });

    expect(client.put).toHaveBeenCalledWith(
      `${BASE}/api/cms/seo/sites/site-1/defaults`,
      { siteName: 'Updated' }
    );
  });
});

describe('listSeoAuditIssues', () => {
  it('GET /api/cms/seo/metadata', async () => {
    const client = createMockClient();
    const response: PagedResponse<SeoAuditIssueResponse> = {
      items: [{ contentType: 'page', contentId: 'p-1', culture: 'fr', issueType: 'MissingDescription' }],
      totalCount: 1, page: 0, pageSize: 20,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listSeoAuditIssues(client, BASE, { issueType: 'MissingDescription' });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/seo/metadata`, {
      params: { issueType: 'MissingDescription' },
    });
    expect(result).toEqual(response);
  });
});

describe('invalidateSitemap', () => {
  it('POST /api/cms/seo/sites/{siteId}/sitemap/invalidate', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    await invalidateSitemap(client, BASE, 'site-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/seo/sites/site-1/sitemap/invalidate`);
  });
});

describe('getSerpPreview', () => {
  it('returns preview on 200', async () => {
    const client = createMockClient();
    const preview: SerpPreviewResponse = { title: 'T', url: 'https://example.com', description: 'D' };
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: preview });

    const result = await getSerpPreview(client, BASE, PARAMS);

    expect(client.get).toHaveBeenCalledWith(`${META_URL}/preview/serp`, expect.objectContaining({}));
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
    const preview: OgCardPreviewResponse = { title: 'T', description: 'D', siteName: 'S' };
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
  it('returns @graph array on 200', async () => {
    const client = createMockClient();
    const graph = [{ '@type': 'WebPage' }];
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: graph });

    const result = await getJsonLdPreview(client, BASE, PARAMS);

    expect(result).toEqual(graph);
  });

  it('returns null on 204', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 204, data: null });

    expect(await getJsonLdPreview(client, BASE, PARAMS)).toBeNull();
  });
});
