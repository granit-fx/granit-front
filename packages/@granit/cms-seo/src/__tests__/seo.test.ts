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
  it('GETs the raw sitemap.xml as text', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse('<urlset/>'));

    const result = await getSitemap(client, basePath, 'site-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api/cms/seo/sites/site-1/sitemap.xml`, {
      responseType: 'text',
    });
    expect(result).toBe('<urlset/>');
  });
});

describe('getSitemapFile', () => {
  it('returns the child file body on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: '<urlset/>' });

    const result = await getSitemapFile(client, basePath, 'site-1', 'sitemap-1.xml');

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/seo/sites/site-1/sitemap/sitemap-1.xml`,
      expect.objectContaining({ responseType: 'text' })
    );
    expect(result).toBe('<urlset/>');
  });

  it('returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 404, data: '' });

    expect(await getSitemapFile(client, basePath, 'site-1', 'missing.xml')).toBeNull();
  });
});

describe('getRobotsTxt', () => {
  it('GETs robots.txt as text', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse('User-agent: *\nAllow: /'));

    const result = await getRobotsTxt(client, basePath, 'site-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api/cms/seo/sites/site-1/robots.txt`, {
      responseType: 'text',
    });
    expect(result).toContain('User-agent');
  });
});

describe('getManifest', () => {
  it('returns the manifest body on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 200, data: '{"name":"App"}' });

    const result = await getManifest(client, basePath, 'site-1');

    expect(result).toBe('{"name":"App"}');
  });

  it('returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 404, data: '' });

    expect(await getManifest(client, basePath, 'site-1')).toBeNull();
  });
});
