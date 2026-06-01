import { axiosResponse, createMockClient } from '@granit/api-client/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { getResourceRoom, joinResourceRoom, leaveResourceRoom } from '../api/presence-rooms-api';

import type { ResourceRoomResponse } from '../types/index';

const mockRoom: ResourceRoomResponse = {
  kind: 'cms.page',
  id: 'doc-1',
  participants: [{ userId: 'user-a', lastSeenUtc: '2026-05-28T10:00:00Z', metadata: null }],
};

describe('presence-rooms-api', () => {
  describe('joinResourceRoom', () => {
    it('POSTs to /presence/rooms/{kind}/{id}/heartbeat', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(mockRoom));

      const result = await joinResourceRoom(client, '/api/v1', 'cms.page', 'doc-1', {});

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/presence/rooms/cms.page/doc-1/heartbeat',
        {},
        expect.objectContaining({})
      );
      expect(result).toEqual(mockRoom);
    });

    it('URL-encodes kind and id', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(mockRoom));

      await joinResourceRoom(client, '/api/v1', 'cms.page', 'id with/slash', {});

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/presence/rooms/cms.page/id%20with%2Fslash/heartbeat',
        {},
        expect.objectContaining({})
      );
    });

    it('rejects an invalid kind before the network call', async () => {
      const client = createMockClient();
      await expect(
        joinResourceRoom(client, '/api/v1', 'INVALID!', 'doc-1', {})
      ).rejects.toBeInstanceOf(TypeError);
      expect(client.post).not.toHaveBeenCalled();
    });

    it('rejects an id longer than 256 chars', async () => {
      const client = createMockClient();
      const longId = 'x'.repeat(257);
      await expect(
        joinResourceRoom(client, '/api/v1', 'cms.page', longId, {})
      ).rejects.toBeInstanceOf(TypeError);
      expect(client.post).not.toHaveBeenCalled();
    });

    it('rejects metadata larger than 512 bytes', async () => {
      const client = createMockClient();
      // Build a string that exceeds 512 bytes via multi-byte chars.
      const metadata = '€'.repeat(200); // '€' is 3 bytes, 200 × 3 = 600 bytes
      await expect(
        joinResourceRoom(client, '/api/v1', 'cms.page', 'doc-1', { metadata })
      ).rejects.toBeInstanceOf(TypeError);
      expect(client.post).not.toHaveBeenCalled();
    });

    it('forwards the AbortSignal', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(mockRoom));
      const ac = new AbortController();

      await joinResourceRoom(client, '/api/v1', 'cms.page', 'doc-1', {}, ac.signal);

      expect(client.post).toHaveBeenCalledWith(
        expect.any(String),
        {},
        expect.objectContaining({ signal: ac.signal })
      );
    });
  });

  describe('getResourceRoom', () => {
    it('GETs /presence/rooms/{kind}/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(mockRoom));

      const result = await getResourceRoom(client, '/api/v1', 'cms.page', 'doc-1');

      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/presence/rooms/cms.page/doc-1',
        expect.objectContaining({})
      );
      expect(result).toEqual(mockRoom);
    });

    it('rejects an invalid kind before the network call', async () => {
      const client = createMockClient();
      await expect(
        getResourceRoom(client, '/api/v1', '123invalid', 'doc-1')
      ).rejects.toBeInstanceOf(TypeError);
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('leaveResourceRoom', () => {
    it('DELETEs /presence/rooms/{kind}/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await leaveResourceRoom(client, '/api/v1', 'cms.page', 'doc-1');

      expect(client.delete).toHaveBeenCalledWith(
        '/api/v1/presence/rooms/cms.page/doc-1',
        expect.objectContaining({})
      );
    });

    it('rejects an invalid kind before the network call', async () => {
      const client = createMockClient();
      await expect(
        leaveResourceRoom(client, '/api/v1', '-badkind', 'doc-1')
      ).rejects.toBeInstanceOf(TypeError);
      expect(client.delete).not.toHaveBeenCalled();
    });
  });
});
