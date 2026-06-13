import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { createSite, deleteSite, getSite, listSites, updateSite } from '../api/sites';

import type { SiteResponse } from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const BASE = 'https://cms.example.com';

const site: SiteResponse = {
  id: 'site-1',
  slug: 'acme',
  defaultCulture: 'fr',
  allowedCultures: ['fr', 'en'],
  domains: [],
  defaultTheme: 'default',
  activated: true,
  tenantId: null,
  displayNames: { fr: 'ACME', en: 'ACME' },
};

describe('listSites', () => {
  it('fetches paged list without params', async () => {
    const client = createMockClient();
    const response: PagedResult<SiteResponse> = {
      items: [site],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listSites(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/sites`, undefined);
    expect(result).toEqual(response);
  });

  it('serializes the QueryEngine request into the query string', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
    );

    await listSites(client, BASE, { page: 1, pageSize: 10 });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/sites?page=1&pageSize=10`, undefined);
  });
});

describe('getSite', () => {
  it('GET /api/cms/sites/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(site));

    const result = await getSite(client, BASE, 'site-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/sites/site-1`);
    expect(result).toEqual(site);
  });
});

describe('createSite', () => {
  it('POST /api/cms/sites with request body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(site));

    const request = { slug: 'acme', defaultCulture: 'fr', allowedCultures: ['fr', 'en'] };
    const result = await createSite(client, BASE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/sites`, request);
    expect(result).toEqual(site);
  });
});

describe('updateSite', () => {
  it('PUT /api/cms/sites/{id}', async () => {
    const client = createMockClient();
    const updated = { ...site, activated: false };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    const request = {
      defaultCulture: 'fr',
      allowedCultures: ['fr'],
      domains: [],
      defaultTheme: 'default',
      activated: false,
    };
    const result = await updateSite(client, BASE, 'site-1', request);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/api/cms/sites/site-1`, request);
    expect(result).toEqual(updated);
  });
});

describe('deleteSite', () => {
  it('DELETE /api/cms/sites/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deleteSite(client, BASE, 'site-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/api/cms/sites/site-1`);
  });
});
