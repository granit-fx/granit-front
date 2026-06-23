import {
  deleteSeoMetadata,
  invalidateSitemap,
  updateSeoDefaults,
  upsertSeoMetadata,
} from '@granit/cms-seo';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockSeoDefaults } from '@granit/react-cms-seo/testing';

import {
  useDeleteSeoMetadata,
  useInvalidateSitemap,
  useUpdateSeoDefaults,
  useUpsertSeoMetadata,
} from '../hooks/use-seo-mutations';
import { CmsSeoProvider } from '../providers/cms-seo-provider';

import type { RobotsDirective, SeoMetadataResponse } from '@granit/cms-seo';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const CORPORATE_SITE_ID = 'b1f0c3a4-1d2e-4f5a-8b6c-1a2b3c4d5e6f';

vi.mock('@granit/cms-seo', () => ({
  upsertSeoMetadata: vi.fn(),
  deleteSeoMetadata: vi.fn(),
  updateSeoDefaults: vi.fn(),
  invalidateSitemap: vi.fn(),
}));

const KEY = { siteId: 'site-1', contentType: 'page', contentId: 'page-1', culture: 'fr' };

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
  title: 'Test',
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

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(CmsSeoProvider, { config: { client }, children })
    );
  };
}

describe('useUpsertSeoMetadata', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls upsertSeoMetadata', async () => {
    const client = createMockClient();
    vi.mocked(upsertSeoMetadata).mockResolvedValue(metadata);

    const { result } = renderHook(() => useUpsertSeoMetadata(), { wrapper: createWrapper(client) });
    result.current.mutate({ key: KEY, request: { title: 'Test' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(upsertSeoMetadata).toHaveBeenCalledWith(client, '', KEY, { title: 'Test' });
  });
});

describe('useDeleteSeoMetadata', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteSeoMetadata', async () => {
    const client = createMockClient();
    vi.mocked(deleteSeoMetadata).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteSeoMetadata(), { wrapper: createWrapper(client) });
    result.current.mutate(KEY);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteSeoMetadata).toHaveBeenCalledWith(client, '', KEY);
  });
});

describe('useUpdateSeoDefaults', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateSeoDefaults', async () => {
    const client = createMockClient();
    const updated = mockSeoDefaults[CORPORATE_SITE_ID]!;
    vi.mocked(updateSeoDefaults).mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateSeoDefaults(), { wrapper: createWrapper(client) });
    result.current.mutate({ siteId: 'site-1', request: { siteName: 'ACME' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateSeoDefaults).toHaveBeenCalledWith(client, '', 'site-1', { siteName: 'ACME' });
  });
});

describe('useInvalidateSitemap', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls invalidateSitemap', async () => {
    const client = createMockClient();
    vi.mocked(invalidateSitemap).mockResolvedValue(undefined);

    const { result } = renderHook(() => useInvalidateSitemap(), { wrapper: createWrapper(client) });
    result.current.mutate('site-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSitemap).toHaveBeenCalledWith(client, '', 'site-1');
  });
});
