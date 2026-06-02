import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getEffectiveSeo } from '../api/seo.js';

import type { EffectiveSeoResponse } from '../types/index.js';

const basePath = 'https://cms.example.com';

const sampleSeo: EffectiveSeoResponse = {
  title: 'Page Title | My Site',
  description: 'A short description.',
  canonicalUrl: 'https://example.com/fr/a-propos',
  robots: { index: true, follow: true, noArchive: false, noSnippet: false },
  keywords: ['granit', 'cms'],
  openGraph: {
    type: 'website',
    alternateLocales: [],
  },
  twitterCard: {
    card: 'summary_large_image',
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
