import { axiosResponse, createMockClient } from '@granit/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEntry,
  deleteEntry,
  getFollowers,
  getStream,
  followEntity,
  unfollowEntity,
} from '../api/timeline-api.js';

import type { CreateTimelineEntryRequest, TimelineEntryPage } from '../types/index.js';
import type { AxiosInstance } from 'axios';

const BASE_PATH = '/api/v1/timeline';

describe('timeline API', () => {
  let client: AxiosInstance;

  beforeEach(() => {
    client = createMockClient();
  });

  describe('getStream', () => {
    it('should call GET /{entityType}/{entityId} with query params', async () => {
      const page: TimelineEntryPage = { items: [], totalCount: 0, nextCursor: null };
      vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

      const result = await getStream(client, BASE_PATH, 'Patient', 'p-1', {
        page: 1,
        pageSize: 20,
      });

      expect(client.get).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1', {
        params: { page: 1, pageSize: 20 },
      });
      expect(result).toEqual({ page, degradedSources: [] });
    });
  });

  describe('createEntry', () => {
    it('should call POST /{entityType}/{entityId}/entries', async () => {
      const request: CreateTimelineEntryRequest = {
        entryType: 0,
        body: 'Hello',
      };
      const entry = {
        id: 'e-1',
        entryType: 0,
        body: 'Hello',
        authorId: 'u-1',
        authorName: 'User',
        parentEntryId: null,
        occurredAt: '2026-01-01T00:00:00Z',
        attachments: [],
      };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(entry));

      const result = await createEntry(client, BASE_PATH, 'Patient', 'p-1', request);

      expect(client.post).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/entries', request);
      expect(result).toEqual(entry);
    });
  });

  describe('deleteEntry', () => {
    it('should call DELETE /{entityType}/{entityId}/entries/{id}', async () => {
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await deleteEntry(client, BASE_PATH, 'Patient', 'p-1', 'e-1');

      expect(client.delete).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/entries/e-1');
    });
  });

  describe('followEntity', () => {
    it('should call POST /{entityType}/{entityId}/follow', async () => {
      vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

      await followEntity(client, BASE_PATH, 'Patient', 'p-1');

      expect(client.post).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/follow');
    });
  });

  describe('unfollowEntity', () => {
    it('should call DELETE /{entityType}/{entityId}/follow', async () => {
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await unfollowEntity(client, BASE_PATH, 'Patient', 'p-1');

      expect(client.delete).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/follow');
    });
  });

  describe('getFollowers', () => {
    it('should call GET /{entityType}/{entityId}/followers', async () => {
      const followers = ['u-1', 'u-2'];
      vi.mocked(client.get).mockResolvedValue(axiosResponse(followers));

      const result = await getFollowers(client, BASE_PATH, 'Patient', 'p-1');

      expect(client.get).toHaveBeenCalledWith('/api/v1/timeline/Patient/p-1/followers');
      expect(result).toEqual(followers);
    });
  });
});
