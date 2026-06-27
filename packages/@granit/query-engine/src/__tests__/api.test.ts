import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getGrouped, getPage, getQueryCatalog, getQueryMeta } from '../api/query-api';
import {
  createSavedView,
  deleteSavedView,
  listSavedViews,
  setDefaultSavedView,
  updateSavedView,
} from '../api/saved-views-api';

describe('query-api', () => {
  it('getPage calls GET with serialized params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { items: [{ id: '1' }], totalCount: 1 },
    });
    const result = await getPage(client, '/api/v1/patients', { page: 1, pageSize: 10 });
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/patients'), undefined);
    expect(result).toEqual({ items: [{ id: '1' }], totalCount: 1 });
  });

  it('getPage with empty params calls basePath only', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { items: [], totalCount: 0 },
    });
    await getPage(client, '/api/v1/patients', {});
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients', undefined);
  });

  it('getGrouped calls GET with serialized params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { groups: [], totalCount: 0 },
    });
    const result = await getGrouped(client, '/api/v1/patients', { groupBy: 'status' });
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('groupBy=status'), undefined);
    expect(result).toEqual({ groups: [], totalCount: 0 });
  });

  it('getGrouped with empty params calls basePath only', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { groups: [], totalCount: 0 },
    });
    await getGrouped(client, '/api/v1/patients', {});
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients', undefined);
  });

  it('getQueryMeta calls GET /meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { columns: [], filterableFields: [] },
    });
    const result = await getQueryMeta(client, '/api/v1/patients');
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients/meta', undefined);
    expect(result).toEqual({ columns: [], filterableFields: [] });
  });

  it('getPage forwards the abort signal', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: { items: [], totalCount: 0 } });
    const { signal } = new AbortController();
    await getPage(client, '/api/v1/patients', { page: 1 }, { signal });
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/patients'), {
      signal,
    });
  });

  it('getGrouped forwards the abort signal', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: { groups: [], totalCount: 0 } });
    const { signal } = new AbortController();
    await getGrouped(client, '/api/v1/patients', { groupBy: 'status' }, { signal });
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('groupBy=status'), { signal });
  });

  it('getQueryMeta forwards the abort signal', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: { columns: [], filterableFields: [] } });
    const { signal } = new AbortController();
    await getQueryMeta(client, '/api/v1/patients', { signal });
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients/meta', { signal });
  });

  it('getQueryCatalog calls GET /catalog', async () => {
    const client = createMockClient();
    const catalog = [
      { name: 'Granit.Test.Query', basePath: '/api/v1/patients', labelKey: 'Entity:Patient' },
    ];
    vi.mocked(client.get).mockResolvedValueOnce({ data: catalog });
    const result = await getQueryCatalog(client, '/api/v1');
    expect(client.get).toHaveBeenCalledWith('/api/v1/catalog', undefined);
    expect(result).toEqual(catalog);
  });

  it('getQueryCatalog forwards the abort signal', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });
    const { signal } = new AbortController();
    await getQueryCatalog(client, '/api/v1', { signal });
    expect(client.get).toHaveBeenCalledWith('/api/v1/catalog', { signal });
  });
});

describe('saved-views-api', () => {
  it('listSavedViews calls GET /saved-views', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });
    const result = await listSavedViews(client, '/api/v1/patients');
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients/saved-views');
    expect(result).toEqual([]);
  });

  it('createSavedView calls POST /saved-views', async () => {
    const client = createMockClient();
    const view = { id: '1', name: 'Test', isShared: false, isDefault: false };
    vi.mocked(client.post).mockResolvedValueOnce({ data: view });
    const result = await createSavedView(client, '/api/v1/patients', {
      name: 'Test',
      isShared: false,
      isDefault: false,
    });
    expect(client.post).toHaveBeenCalledWith('/api/v1/patients/saved-views', {
      name: 'Test',
      isShared: false,
      isDefault: false,
    });
    expect(result).toEqual(view);
  });

  it('updateSavedView calls PUT /saved-views/:id', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });
    await updateSavedView(client, '/api/v1/patients', '1', {
      name: 'Updated',
      isShared: true,
    });
    expect(client.put).toHaveBeenCalledWith('/api/v1/patients/saved-views/1', {
      name: 'Updated',
      isShared: true,
    });
  });

  it('deleteSavedView calls DELETE /saved-views/:id', async () => {
    const client = createMockClient();
    await deleteSavedView(client, '/api/v1/patients', '1');
    expect(client.delete).toHaveBeenCalledWith('/api/v1/patients/saved-views/1');
  });

  it('setDefaultSavedView calls POST /saved-views/:id/set-default', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });
    await setDefaultSavedView(client, '/api/v1/patients', '1');
    expect(client.post).toHaveBeenCalledWith('/api/v1/patients/saved-views/1/set-default');
  });
});
