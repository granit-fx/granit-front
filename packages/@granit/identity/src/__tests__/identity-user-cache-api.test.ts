import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  batchResolveUsers,
  eraseUserCache,
  getCacheStats,
  getUserById,
  searchUsers,
  syncAllUsers,
  syncStaleUsers,
  syncUsers,
} from '../api/identity-user-cache-api.js';

import type {
  IdentityUser,
  IdentityUserCacheStats,
  IdentityUserCacheSyncAllResult,
  IdentityUserCacheSyncStaleResult,
  IdentityUserPage,
} from '../types/index.js';

const sampleUser: IdentityUser = {
  userId: 'user-1',
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  enabled: true,
  extraProperties: { department: 'Engineering' },
};

const basePath = '/identity/users';

describe('identity-user-cache-api', () => {
  describe('searchUsers', () => {
    it('should GET {basePath}/ without params', async () => {
      const client = createMockClient();
      const page: IdentityUserPage = {
        items: [sampleUser],
        totalCount: 1,
        hasMore: false,
        nextCursor: null,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

      const result = await searchUsers(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/`, { params: undefined });
      expect(result).toEqual(page);
    });

    it('should GET {basePath}/ with query params', async () => {
      const client = createMockClient();
      const page: IdentityUserPage = {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextCursor: null,
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

      const params = { search: 'john', page: 1, pageSize: 10 };
      const result = await searchUsers(client, basePath, params);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/`, { params });
      expect(result).toEqual(page);
    });
  });

  describe('getUserById', () => {
    it('should GET {basePath}/{userId}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleUser));

      const result = await getUserById(client, basePath, 'user-1');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/user-1`);
      expect(result).toEqual(sampleUser);
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleUser));

      await getUserById(client, basePath, 'user/special@id');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/${encodeURIComponent('user/special@id')}`
      );
    });
  });

  describe('batchResolveUsers', () => {
    it('should POST {basePath}/batch with userIds body', async () => {
      const client = createMockClient();
      const users = [sampleUser];
      vi.mocked(client.post).mockResolvedValue(axiosResponse(users));

      const result = await batchResolveUsers(client, basePath, ['user-1']);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/batch`, {
        userIds: ['user-1'],
      });
      expect(result).toEqual(users);
    });
  });

  describe('getCacheStats', () => {
    it('should GET {basePath}/stats', async () => {
      const client = createMockClient();
      const stats: IdentityUserCacheStats = {
        totalEntries: 42,
        staleEntries: 3,
        oldestSyncAt: '2026-01-01T00:00:00Z',
        newestSyncAt: '2026-03-17T12:00:00Z',
      };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(stats));

      const result = await getCacheStats(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/stats`);
      expect(result).toEqual(stats);
    });
  });

  describe('syncUsers', () => {
    it('should POST {basePath}/sync with userIds body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await syncUsers(client, basePath, ['user-1', 'user-2']);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/sync`, {
        userIds: ['user-1', 'user-2'],
      });
    });
  });

  describe('syncAllUsers', () => {
    it('should POST {basePath}/sync-all', async () => {
      const client = createMockClient();
      const result: IdentityUserCacheSyncAllResult = { syncedCount: 100 };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(result));

      const actual = await syncAllUsers(client, basePath);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/sync-all`);
      expect(actual).toEqual(result);
    });
  });

  describe('syncStaleUsers', () => {
    it('should POST {basePath}/sync-stale', async () => {
      const client = createMockClient();
      const result: IdentityUserCacheSyncStaleResult = { refreshedCount: 5 };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(result));

      const actual = await syncStaleUsers(client, basePath);

      expect(client.post).toHaveBeenCalledWith(`${basePath}/sync-stale`);
      expect(actual).toEqual(result);
    });
  });

  describe('eraseUserCache', () => {
    it('should DELETE {basePath}/{userId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await eraseUserCache(client, basePath, 'user-1');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/user-1`);
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await eraseUserCache(client, basePath, 'user/special@id');

      expect(client.delete).toHaveBeenCalledWith(
        `${basePath}/${encodeURIComponent('user/special@id')}`
      );
    });
  });
});
