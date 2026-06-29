import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { resolveRedirect } from '../api/redirects';

import type { ResolveResponse } from '../types/index';

const basePath = 'https://cms.example.com';

describe('resolveRedirect', () => {
  it('sends path/culture as query and siteId as the X-Granit-Site header, returns the redirect on 200', async () => {
    const client = createMockClient();
    const redirect: ResolveResponse = { target: '/new-path', statusCode: 301 };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(redirect));

    const result = await resolveRedirect(client, basePath, {
      siteId: 'site-1',
      path: '/old-path',
      culture: 'fr',
    });

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/resolve`,
      expect.objectContaining({
        params: { path: '/old-path', culture: 'fr' },
        headers: { 'X-Granit-Site': 'site-1' },
      })
    );
    expect(result).toEqual(redirect);
  });

  it('returns null on 204 (no match)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 204, data: null });

    const result = await resolveRedirect(client, basePath, {
      siteId: 'site-1',
      path: '/no-redirect',
    });

    expect(result).toBeNull();
  });

  it('forwards fetchOptions to the fetch adapter when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ status: 204, data: null });

    await resolveRedirect(
      client,
      basePath,
      { siteId: 'site-1', path: '/old-path' },
      { cache: 'force-cache' }
    );

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/resolve`,
      expect.objectContaining({ fetchOptions: { cache: 'force-cache' } })
    );
  });
});
