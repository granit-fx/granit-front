import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createRedirect,
  deleteRedirect,
  getRedirect,
  getRedirectsGrid,
  getRedirectSettings,
  listRedirects,
  previewRedirect,
  updateRedirect,
  updateRedirectSettings,
} from '../api/redirects-admin';

import type {
  PagedResult,
  RedirectCreateRequest,
  RedirectMutationResult,
  RedirectPreviewResponse,
  RedirectResponse,
  RedirectUpdateRequest,
  SiteRedirectSettingsResponse,
} from '../types/index';

const BASE = 'https://cms.example.com';
const SITE = 'site-1';

const redirect: RedirectResponse = {
  id: 'redir-1',
  siteId: SITE,
  source: '/old',
  matchType: 'Exact',
  target: '/new',
  type: 'MovedPermanently',
  statusCode: 301,
  isActive: true,
  culture: null,
  origin: 'Manual',
  hitCount: 0,
  lastHitAt: null,
};

const mutationResult: RedirectMutationResult = { redirect, conflictWarning: null };

describe('listRedirects', () => {
  it('GET /sites/{siteId}/redirects returns a flat array', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([redirect]));

    const result = await listRedirects(client, BASE, SITE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/sites/${SITE}/redirects`);
    expect(result).toEqual([redirect]);
  });

  it('encodes the siteId segment', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await listRedirects(client, BASE, 'a/b');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/sites/a%2Fb/redirects`);
  });
});

describe('getRedirect', () => {
  it('GET /{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(redirect));

    const result = await getRedirect(client, BASE, 'redir-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/redir-1`);
    expect(result).toEqual(redirect);
  });
});

describe('createRedirect', () => {
  it('POST /sites/{siteId}/redirects returns the mutation result', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mutationResult));

    const request: RedirectCreateRequest = { source: '/old', target: '/new' };
    const result = await createRedirect(client, BASE, SITE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/sites/${SITE}/redirects`, request);
    expect(result).toEqual(mutationResult);
  });
});

describe('updateRedirect', () => {
  it('PUT /{id} returns the mutation result', async () => {
    const client = createMockClient();
    const updated: RedirectMutationResult = {
      redirect: { ...redirect, target: '/newer' },
      conflictWarning: 'shadows a page',
    };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    const request: RedirectUpdateRequest = { target: '/newer' };
    const result = await updateRedirect(client, BASE, 'redir-1', request);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/redir-1`, request);
    expect(result).toEqual(updated);
  });
});

describe('deleteRedirect', () => {
  it('DELETE /{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deleteRedirect(client, BASE, 'redir-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/redir-1`);
  });
});

describe('getRedirectSettings', () => {
  it('GET /sites/{siteId}/settings', async () => {
    const client = createMockClient();
    const settings: SiteRedirectSettingsResponse = { siteId: SITE, autoRedirectOnMove: true };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(settings));

    const result = await getRedirectSettings(client, BASE, SITE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/sites/${SITE}/settings`);
    expect(result).toEqual(settings);
  });
});

describe('updateRedirectSettings', () => {
  it('PUT /sites/{siteId}/settings', async () => {
    const client = createMockClient();
    const settings: SiteRedirectSettingsResponse = { siteId: SITE, autoRedirectOnMove: false };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(settings));

    const result = await updateRedirectSettings(client, BASE, SITE, { autoRedirectOnMove: false });

    expect(client.put).toHaveBeenCalledWith(`${BASE}/sites/${SITE}/settings`, {
      autoRedirectOnMove: false,
    });
    expect(result).toEqual(settings);
  });
});

describe('previewRedirect', () => {
  it('GET /sites/{siteId}/preview with path/culture query', async () => {
    const client = createMockClient();
    const preview: RedirectPreviewResponse = {
      matched: true,
      target: '/new',
      statusCode: 301,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(preview));

    const result = await previewRedirect(client, BASE, SITE, { path: '/old', culture: 'fr' });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/sites/${SITE}/preview`, {
      params: { path: '/old', culture: 'fr' },
    });
    expect(result).toEqual(preview);
  });
});

describe('getRedirectsGrid', () => {
  it('GET /grid with serialized QueryRequest', async () => {
    const client = createMockClient();
    const page: PagedResult<RedirectResponse> = {
      items: [redirect],
      totalCount: 1,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const result = await getRedirectsGrid(client, BASE, { page: 1, pageSize: 25 });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/grid?page=1&pageSize=25`, undefined);
    expect(result).toEqual(page);
  });
});
