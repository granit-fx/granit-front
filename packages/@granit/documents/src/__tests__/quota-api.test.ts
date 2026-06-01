import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getTenantStorageQuota } from '../api/quota-api';

import type { TenantStorageQuotaResponse } from '../types/index';

const basePath = '/api/v1/documents';

describe('getTenantStorageQuota', () => {
  it('GETs /quota and returns the quota snapshot', async () => {
    const client = createMockClient();
    const quota: TenantStorageQuotaResponse = {
      limitBytes: 10_000_000,
      usageBytes: 2_500_000,
      percentUsed: 25,
      updatedAt: '2026-05-01T10:00:00Z',
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(quota));

    const result = await getTenantStorageQuota(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/quota`);
    expect(result).toEqual(quota);
  });
});
