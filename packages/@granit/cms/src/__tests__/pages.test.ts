import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getPageByPath, mintPreviewToken, resolvePreview } from '../api/pages.js';

import type {
  DraftPagePreviewResponse,
  MintPreviewTokenRequest,
  MintPreviewTokenResponse,
  PublishedPageResponse,
} from '../types/index.js';

const basePath = 'https://cms.example.com';

const samplePage: PublishedPageResponse = {
  id: 'page-1',
  siteId: 'site-1',
  culture: 'fr',
  path: '/a-propos',
  title: 'À propos',
  layoutKey: null,
  contentJson: '{"content":[]}',
};

const sampleDraft: DraftPagePreviewResponse = {
  id: 'page-1',
  siteId: 'site-1',
  culture: 'fr',
  title: 'À propos (draft)',
  layoutKey: null,
  contentJson: '{"content":[]}',
};

describe('getPageByPath', () => {
  it('returns the page on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(samplePage));

    const result = await getPageByPath(client, basePath, {
      siteId: 'site-1',
      culture: 'fr',
      path: '/a-propos',
    });

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/pages/by-path`,
      expect.objectContaining({
        params: { culture: 'fr', path: '/a-propos' },
        headers: { 'X-Granit-Site': 'site-1' },
      })
    );
    expect(result).toEqual(samplePage);
  });

  it('returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 404 } });

    const result = await getPageByPath(client, basePath, {
      siteId: 'site-1',
      culture: 'fr',
      path: '/missing',
    });

    expect(result).toBeNull();
  });

  it('rethrows non-404 errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 500 } });

    await expect(
      getPageByPath(client, basePath, { siteId: 'site-1', culture: 'fr', path: '/' })
    ).rejects.toMatchObject({ response: { status: 500 } });
  });
});

describe('mintPreviewToken', () => {
  it('posts the request and returns the token response', async () => {
    const client = createMockClient();
    const req: MintPreviewTokenRequest = { culture: 'fr', lifetimeSeconds: 300 };
    const resp: MintPreviewTokenResponse = {
      token: 'tok_abc',
      expiresAt: '2026-06-01T12:05:00Z',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(resp));

    const result = await mintPreviewToken(client, basePath, 'page-1', req);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/api/cms/pages/page-1/preview-token`, req);
    expect(result).toEqual(resp);
  });
});

describe('resolvePreview', () => {
  it('returns the draft on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleDraft));

    const result = await resolvePreview(client, basePath, 'tok_abc');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api/cms/preview/resolve`, {
      params: { token: 'tok_abc' },
    });
    expect(result).toEqual(sampleDraft);
  });

  it('returns null on 401 (expired/invalid token)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 401 } });

    const result = await resolvePreview(client, basePath, 'bad_token');

    expect(result).toBeNull();
  });

  it('returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 404 } });

    expect(await resolvePreview(client, basePath, 'tok')).toBeNull();
  });
});
