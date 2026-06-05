import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  addReleaseAction,
  cancelRelease,
  createRelease,
  getRelease,
  listReleases,
  publishRelease,
  removeReleaseAction,
  scheduleRelease,
  updateRelease,
} from '../api/releases';

import type { ReleaseResponse } from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const BASE = 'https://cms.example.com';

const release: ReleaseResponse = {
  id: 'rel-1',
  siteId: 'site-1',
  name: 'Sprint 42',
  status: 'Draft',
  schedule: null,
  tenantId: null,
  actions: [],
  concurrencyStamp: 'stamp-1',
};

describe('listReleases', () => {
  it('GET /api/cms/releases', async () => {
    const client = createMockClient();
    const response: PagedResult<ReleaseResponse> = {
      items: [release],
      totalCount: 1,
      hasMore: false,
      nextCursor: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const result = await listReleases(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/releases`, { params: undefined });
    expect(result).toEqual(response);
  });
});

describe('getRelease', () => {
  it('GET /api/cms/releases/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(release));

    const result = await getRelease(client, BASE, 'rel-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/releases/rel-1`);
    expect(result).toEqual(release);
  });
});

describe('createRelease', () => {
  it('POST /api/cms/releases', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(release));

    const request = { siteId: 'site-1', name: 'Sprint 42' };
    const result = await createRelease(client, BASE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/releases`, request);
    expect(result).toEqual(release);
  });
});

describe('updateRelease', () => {
  it('PUT /api/cms/releases/{id}', async () => {
    const client = createMockClient();
    const updated = { ...release, name: 'Sprint 42 rev2' };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updated));

    await updateRelease(client, BASE, 'rel-1', { name: 'Sprint 42 rev2' });

    expect(client.put).toHaveBeenCalledWith(`${BASE}/api/cms/releases/rel-1`, {
      name: 'Sprint 42 rev2',
    });
  });
});

describe('addReleaseAction', () => {
  it('POST /api/cms/releases/{id}/actions', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(release));

    const request = {
      contentType: 'page',
      contentId: 'page-1',
      culture: 'fr',
      type: 'Publish' as const,
    };
    const result = await addReleaseAction(client, BASE, 'rel-1', request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/releases/rel-1/actions`, request);
    expect(result).toEqual(release);
  });
});

describe('removeReleaseAction', () => {
  it('DELETE /api/cms/releases/{id}/actions/{actionId} returns updated release', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(release));

    const result = await removeReleaseAction(client, BASE, 'rel-1', 'action-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/api/cms/releases/rel-1/actions/action-1`);
    expect(result).toEqual(release);
  });
});

describe('scheduleRelease', () => {
  it('POST /api/cms/releases/{id}/schedule', async () => {
    const client = createMockClient();
    const scheduled = { ...release, status: 'Ready' as const };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(scheduled));

    const request = { localDateTime: '2026-07-01T09:00:00', timeZoneId: 'Europe/Brussels' };
    const result = await scheduleRelease(client, BASE, 'rel-1', request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/releases/rel-1/schedule`, request);
    expect(result).toEqual(scheduled);
  });
});

describe('cancelRelease', () => {
  it('POST /api/cms/releases/{id}/cancel returns updated release', async () => {
    const client = createMockClient();
    const cancelled = { ...release, status: 'Draft' as const };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(cancelled));

    const result = await cancelRelease(client, BASE, 'rel-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/releases/rel-1/cancel`);
    expect(result).toEqual(cancelled);
  });
});

describe('publishRelease', () => {
  it('POST /api/cms/releases/{id}/publish', async () => {
    const client = createMockClient();
    const executed = { ...release, status: 'Done' as const };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(executed));

    const result = await publishRelease(client, BASE, 'rel-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/releases/rel-1/publish`);
    expect(result).toEqual(executed);
  });
});
