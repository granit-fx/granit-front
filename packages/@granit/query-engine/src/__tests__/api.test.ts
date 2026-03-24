import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { fetchGrouped, fetchPage, fetchQueryMeta } from '../api/query-api.js';
import {
  createSavedView,
  deleteSavedView,
  fetchSavedViews,
  setDefaultSavedView,
  updateSavedView,
} from '../api/saved-views-api.js';

describe('query-api', () => {
  it('fetchPage calls GET with serialized params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { items: [{ id: '1' }], totalCount: 1 },
    });
    const result = await fetchPage(client, '/api/v1/patients', { page: 1, pageSize: 10 });
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/api/v1/patients'));
    expect(result).toEqual({ items: [{ id: '1' }], totalCount: 1 });
  });

  it('fetchPage with empty params calls basePath only', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { items: [], totalCount: 0 },
    });
    await fetchPage(client, '/api/v1/patients', {});
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients');
  });

  it('fetchGrouped calls GET with serialized params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { groups: [], totalCount: 0 },
    });
    const result = await fetchGrouped(client, '/api/v1/patients', { groupBy: 'status' });
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('groupBy=status'));
    expect(result).toEqual({ groups: [], totalCount: 0 });
  });

  it('fetchGrouped with empty params calls basePath only', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { groups: [], totalCount: 0 },
    });
    await fetchGrouped(client, '/api/v1/patients', {});
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients');
  });

  it('fetchQueryMeta calls GET /meta', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({
      data: { columns: [], filterableFields: [] },
    });
    const result = await fetchQueryMeta(client, '/api/v1/patients');
    expect(client.get).toHaveBeenCalledWith('/api/v1/patients/meta');
    expect(result).toEqual({ columns: [], filterableFields: [] });
  });
});

describe('saved-views-api', () => {
  it('fetchSavedViews calls GET /saved-views', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });
    const result = await fetchSavedViews(client, '/api/v1/patients');
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
    const view = { id: '1', name: 'Updated', isShared: true, isDefault: false };
    vi.mocked(client.put).mockResolvedValueOnce({ data: view });
    const result = await updateSavedView(client, '/api/v1/patients', '1', {
      name: 'Updated',
      isShared: true,
    });
    expect(client.put).toHaveBeenCalledWith('/api/v1/patients/saved-views/1', {
      name: 'Updated',
      isShared: true,
    });
    expect(result).toEqual(view);
  });

  it('deleteSavedView calls DELETE /saved-views/:id', async () => {
    const client = createMockClient();
    await deleteSavedView(client, '/api/v1/patients', '1');
    expect(client.delete).toHaveBeenCalledWith('/api/v1/patients/saved-views/1');
  });

  it('setDefaultSavedView calls POST /saved-views/:id/set-default', async () => {
    const client = createMockClient();
    const view = { id: '1', name: 'Test', isShared: false, isDefault: true };
    vi.mocked(client.post).mockResolvedValueOnce({ data: view });
    const result = await setDefaultSavedView(client, '/api/v1/patients', '1');
    expect(client.post).toHaveBeenCalledWith('/api/v1/patients/saved-views/1/set-default');
    expect(result).toEqual(view);
  });
});
