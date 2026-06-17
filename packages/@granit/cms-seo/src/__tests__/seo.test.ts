import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getEffectiveSeo, getManifest, getRobotsTxt, getSitemap, getSitemapFile } from '../api/seo';

import type { EffectiveSeoResponse } from '../types/index';

const basePath = 'https://cms.example.com';

const sampleSeo: EffectiveSeoResponse = {
  title: 'Page Title | My Site',
  description: 'A short description.',
  canonicalUrl: 'https://example.com/fr/a-propos',
  robots: {
    index: true,
    follow: true,
    noArchive: false,
    noSnippet: false,
    maxSnippet: null,
    maxImagePreview: null,
  },
  keywords: ['granit', 'cms'],
  openGraph: {
    type: 'website',
    title: null,
    description: null,
    url: null,
    siteName: null,
    locale: null,
    alternateLocales: [],
    image: null,
    article: null,
  },
  twitterCard: {
    card: 'summary_large_image',
    title: null,
    description: null,
    image: null,
    site: null,
    creator: null,
  },
  alternates: [
    { culture: 'fr', href: 'https://example.com/fr/a-propos' },
    { culture: 'en', href: 'https://example.com/en/about' },
  ],
};

describe('getEffectiveSeo', () => {
  it('calls the effective endpoint with the correct path and query params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleSeo));

    const result = await getEffectiveSeo(client, basePath, {
      siteId: 'site-1',
      contentType: 'CmsPage',
      contentId: 'page-1',
      culture: 'fr',
      contentTitle: 'À propos',
    });

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/metadata/CmsPage/page-1/fr/effective`,
      { params: { contentTitle: 'À propos', contentDescription: undefined } }
    );
    expect(result).toEqual(sampleSeo);
  });
});

describe('getSitemap', () => {
  it('returns body + ETag/Last-Modified/Content-Type on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      status: 200,
      data: '<urlset/>',
      headers: {
        etag: '"v1"',
        'last-modified': 'Wed, 01 Jan 2026 00:00:00 GMT',
        'content-type': 'application/xml',
      },
    });

    const result = await getSitemap(client, basePath, 'site-1');

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/sitemap.xml`,
      expect.objectContaining({ responseType: 'text' })
    );
    expect(result).toEqual({
      status: 200,
      body: '<urlset/>',
      contentType: 'application/xml',
      etag: '"v1"',
      lastModified: 'Wed, 01 Jan 2026 00:00:00 GMT',
    });
  });

  it('sends If-None-Match and yields a 304 with null body', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      status: 304,
      data: '',
      headers: { etag: '"v1"' },
    });

    const result = await getSitemap(client, basePath, 'site-1', { ifNoneMatch: '"v1"' });

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/sitemap.xml`,
      expect.objectContaining({ headers: { 'If-None-Match': '"v1"' } })
    );
    expect(result.status).toBe(304);
    expect(result.body).toBeNull();
    expect(result.etag).toBe('"v1"');
  });

  it('forwards fetchOptions to the fetch adapter when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: '<urlset/>', headers: {} });

    await getSitemap(client, basePath, 'site-1', { fetchOptions: { cache: 'force-cache' } });

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/sitemap.xml`,
      expect.objectContaining({ fetchOptions: { cache: 'force-cache' } })
    );
  });
});

describe('getSitemapFile', () => {
  it('returns the child file body on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: '<urlset/>', headers: {} });

    const result = await getSitemapFile(client, basePath, 'site-1', 'sitemap-1.xml');

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/sitemap/sitemap-1.xml`,
      expect.objectContaining({ responseType: 'text' })
    );
    expect(result.status).toBe(200);
    expect(result.body).toBe('<urlset/>');
  });

  it('returns status 404 with a null body when the file is missing', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 404, data: '', headers: {} });

    const result = await getSitemapFile(client, basePath, 'site-1', 'missing.xml');

    expect(result.status).toBe(404);
    expect(result.body).toBeNull();
  });
});

describe('getRobotsTxt', () => {
  it('GETs robots.txt as text', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      status: 200,
      data: 'User-agent: *\nAllow: /',
      headers: { 'content-type': 'text/plain' },
    });

    const result = await getRobotsTxt(client, basePath, 'site-1');

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/robots.txt`,
      expect.objectContaining({ responseType: 'text' })
    );
    expect(result.body).toContain('User-agent');
    expect(result.contentType).toBe('text/plain');
  });

  it('forwards fetchOptions to the fetch adapter when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: 'User-agent: *', headers: {} });

    await getRobotsTxt(client, basePath, 'site-1', { fetchOptions: { cache: 'force-cache' } });

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/robots.txt`,
      expect.objectContaining({ fetchOptions: { cache: 'force-cache' } })
    );
  });
});

describe('getManifest', () => {
  it('returns the manifest body on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: '{"name":"App"}', headers: {} });

    const result = await getManifest(client, basePath, 'site-1');

    expect(result.status).toBe(200);
    expect(result.body).toBe('{"name":"App"}');
  });

  it('returns status 404 with a null body when no manifest is set', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 404, data: '', headers: {} });

    const result = await getManifest(client, basePath, 'site-1');

    expect(result.status).toBe(404);
    expect(result.body).toBeNull();
  });
});
