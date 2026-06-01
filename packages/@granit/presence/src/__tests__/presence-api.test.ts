import { axiosResponse, createMockClient } from '@granit/api-client/test-utils';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  clearMyPresenceOverride,
  getBatchPresence,
  getMyPresence,
  getUserPresence,
  pollMyPresence,
  setMyPresence,
} from '../api/presence-api';

import type { BatchPresenceResponse, PresenceResponse, SetPresenceRequest } from '../types/index';
import type { UserId } from '@granit/types';

const userId = toEntityId<'User'>('user-1') as UserId;

const onlineSnapshot: PresenceResponse = {
  userId,
  effectiveStatus: 'Online',
  manualOverride: null,
  overrideUntilUtc: null,
  lastSeenUtc: toISODateString('2026-05-22T10:00:00Z'),
};

describe('presence-api', () => {
  describe('getMyPresence', () => {
    it('GETs /presence/my', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(onlineSnapshot));

      const result = await getMyPresence(client, '/api/v1');

      expect(client.get).toHaveBeenCalledWith('/api/v1/presence/my');
      expect(result).toEqual(onlineSnapshot);
    });
  });

  describe('setMyPresence', () => {
    it('PUTs /presence/my with the body', async () => {
      const client = createMockClient();
      const dnd: PresenceResponse = {
        ...onlineSnapshot,
        effectiveStatus: 'DoNotDisturb',
        manualOverride: 'DoNotDisturb',
        overrideUntilUtc: toISODateString('2026-05-22T11:00:00Z'),
      };
      vi.mocked(client.put).mockResolvedValue(axiosResponse(dnd));

      const body: SetPresenceRequest = {
        manualStatus: 'DoNotDisturb',
        untilUtc: toISODateString('2026-05-22T11:00:00Z'),
      };
      const result = await setMyPresence(client, '/api/v1', body);

      expect(client.put).toHaveBeenCalledWith('/api/v1/presence/my', body);
      expect(result).toEqual(dnd);
    });
  });

  describe('clearMyPresenceOverride', () => {
    it('DELETEs /presence/my/override', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(onlineSnapshot));

      const result = await clearMyPresenceOverride(client, '/api/v1');

      expect(client.delete).toHaveBeenCalledWith('/api/v1/presence/my/override');
      expect(result).toEqual(onlineSnapshot);
    });
  });

  describe('pollMyPresence', () => {
    it('POSTs /presence/my/poll with the heartbeat body', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue(axiosResponse(onlineSnapshot));

      await pollMyPresence(client, '/api/v1', { idleSeconds: 42 });

      expect(client.post).toHaveBeenCalledWith('/api/v1/presence/my/poll', { idleSeconds: 42 });
    });
  });

  describe('getUserPresence', () => {
    it('GETs /presence/users/{id} with encoded id', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(onlineSnapshot));

      await getUserPresence(client, '/api/v1', toEntityId<'User'>('user/with/slashes') as UserId);

      expect(client.get).toHaveBeenCalledWith('/api/v1/presence/users/user%2Fwith%2Fslashes');
    });
  });

  describe('getBatchPresence', () => {
    it('POSTs /presence/users/batch with the userIds list', async () => {
      const client = createMockClient();
      const response: BatchPresenceResponse = { presences: { [userId]: onlineSnapshot } };
      vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

      const result = await getBatchPresence(client, '/api/v1', { userIds: [userId] });

      expect(client.post).toHaveBeenCalledWith('/api/v1/presence/users/batch', {
        userIds: [userId],
      });
      expect(result).toEqual(response);
    });
  });
});
