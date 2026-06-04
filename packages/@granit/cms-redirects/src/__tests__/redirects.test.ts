import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { resolveRedirect } from '../api/redirects';

import type { RedirectResolveResponse } from '../types/index';

const basePath = 'https://cms.example.com';

describe('resolveRedirect', () => {
  it('returns the redirect on 200', async () => {
    const client = createMockClient();
    const redirect: RedirectResolveResponse = {
      target: '/new-path',
      statusCode: 301,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(redirect));

    const result = await resolveRedirect(client, basePath, {
      siteId: 'site-1',
      path: '/old-path',
      culture: 'fr',
    });

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/api/cms/redirects/resolve`,
      expect.objectContaining({
        params: { siteId: 'site-1', path: '/old-path', culture: 'fr' },
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
});
