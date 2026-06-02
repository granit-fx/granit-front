import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { createRedirect, deleteRedirect, listRedirects, updateRedirect } from '../api/redirects-admin.js';

import type { PagedResponse, RedirectResponse } from '../types/index.js';

const BASE = 'https://cms.example.com';

const redirect: RedirectResponse = {
  id: 'redir-1',
  siteId: 'site-1',
  fromPath: '/old',
  toPath: '/new',
  culture: null,
  statusCode: 301,
  isEnabled: true,
};

describe('listRedirects', () => {
  it('GET /api/cms/redirects without params', async () => {
    const client = createMockClient();
    const response: PagedResponse<RedirectResponse> = { items: [redirect], totalCount: 1, page: 0, pageSize: 20 };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listRedirects(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/redirects`, { params: undefined });
    expect(result).toEqual(response);
  });

  it('passes siteId and search params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [], totalCount: 0, page: 0, pageSize: 20 }));

    await listRedirects(client, BASE, { siteId: 'site-1', search: '/old' });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/redirects`, {
      params: { siteId: 'site-1', search: '/old' },
    });
  });
});

describe('createRedirect', () => {
  it('POST /api/cms/redirects', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(redirect));

    const request = { siteId: 'site-1', fromPath: '/old', toPath: '/new' };
    const result = await createRedirect(client, BASE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/redirects`, request);
    expect(result).toEqual(redirect);
  });
});

describe('updateRedirect', () => {
  it('PUT /api/cms/redirects/{id}', async () => {
    const client = createMockClient();
    const updated = { ...redirect, toPath: '/newer' };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    const request = { fromPath: '/old', toPath: '/newer' };
    const result = await updateRedirect(client, BASE, 'redir-1', request);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/api/cms/redirects/redir-1`, request);
    expect(result).toEqual(updated);
  });
});

describe('deleteRedirect', () => {
  it('DELETE /api/cms/redirects/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deleteRedirect(client, BASE, 'redir-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/api/cms/redirects/redir-1`);
  });
});
