import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { createMenu, deleteMenu, getMenu, listMenus, updateMenu } from '../api/menus-admin';

import type { MenuResponse } from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const BASE = 'https://cms.example.com';

const menu: MenuResponse = {
  id: 'menu-1',
  siteId: 'site-1',
  key: 'main',
  title: 'Main navigation',
  items: [],
};

describe('listMenus', () => {
  it('GET /api/cms/menus without params', async () => {
    const client = createMockClient();
    const response: PagedResult<MenuResponse> = {
      items: [menu],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listMenus(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/menus`, { params: undefined });
    expect(result).toEqual(response);
  });

  it('passes pagination params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [], totalCount: 0, hasMore: false, nextCursor: null })
    );

    await listMenus(client, BASE, { page: 1, pageSize: 20 });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/menus`, {
      params: { page: 1, pageSize: 20 },
    });
  });
});

describe('getMenu', () => {
  it('GET /api/cms/menus/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(menu));

    const result = await getMenu(client, BASE, 'menu-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/menus/menu-1`);
    expect(result).toEqual(menu);
  });
});

describe('createMenu', () => {
  it('POST /api/cms/menus', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(menu));

    const request = { siteId: 'site-1', key: 'main', title: 'Main navigation' };
    const result = await createMenu(client, BASE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/menus`, request);
    expect(result).toEqual(menu);
  });
});

describe('updateMenu', () => {
  it('PUT /api/cms/menus/{id}', async () => {
    const client = createMockClient();
    const updated = { ...menu, title: 'Primary nav' };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    const request = { title: 'Primary nav', items: [] };
    const result = await updateMenu(client, BASE, 'menu-1', request);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/api/cms/menus/menu-1`, request);
    expect(result).toEqual(updated);
  });
});

describe('deleteMenu', () => {
  it('DELETE /api/cms/menus/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deleteMenu(client, BASE, 'menu-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/api/cms/menus/menu-1`);
  });
});
