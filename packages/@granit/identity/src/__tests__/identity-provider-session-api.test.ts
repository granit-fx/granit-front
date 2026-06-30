import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  listUserDevices,
  listUserSessions,
  terminateAllSessions,
  terminateSession,
} from '../api/identity-provider-session-api';

import type { UserDeviceResponse, UserSessionResponse } from '../types/index';

const sampleSession: UserSessionResponse = {
  sessionId: toEntityId<'UserSession'>('session-1'),
  isCurrent: false,
  createdAt: toISODateString('2026-03-20T10:00:00Z'),
  lastAccessedAt: toISODateString('2026-03-20T12:00:00Z'),
  userAgent: 'Mozilla/5.0',
  ipAddress: '192.168.1.0',
  location: null,
  riskLevel: null,
  riskReasons: null,
};

const sampleDevice: UserDeviceResponse = {
  deviceId: toEntityId<'UserDevice'>('device-1'),
  kind: 'Browser',
  operatingSystem: 'Windows',
  browser: 'Chrome',
  lastSeen: toISODateString('2026-03-20T12:00:00Z'),
  sessionCount: 1,
  isTrusted: false,
  trustedUntil: null,
  lastLocation: null,
};

const basePath = '/identity/provider';

describe('identity-provider-session-api', () => {
  describe('listUserSessions', () => {
    it('should GET {basePath}/users/{userId}/sessions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleSession]));

      const result = await listUserSessions(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1/sessions`);
      expect(result).toEqual([sampleSession]);
    });

    it('should encode userId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await listUserSessions(client, basePath, toEntityId<'User'>('user/special@id'));

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/sessions`
      );
    });
  });

  describe('listUserDevices', () => {
    it('should GET {basePath}/users/{userId}/devices', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleDevice]));

      const result = await listUserDevices(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1/devices`);
      expect(result).toEqual([sampleDevice]);
    });
  });

  describe('terminateSession', () => {
    it('should DELETE {basePath}/users/{userId}/sessions/{sessionId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await terminateSession(
        client,
        basePath,
        toEntityId<'User'>('user-1'),
        toEntityId<'UserSession'>('session-1')
      );

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/users/user-1/sessions/session-1`);
    });

    it('should encode userId and sessionId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await terminateSession(
        client,
        basePath,
        toEntityId<'User'>('user/special@id'),
        toEntityId<'UserSession'>('session/special@id')
      );

      expect(client.delete).toHaveBeenCalledWith(
        `${basePath}/users/${encodeURIComponent('user/special@id')}/sessions/${encodeURIComponent('session/special@id')}`
      );
    });
  });

  describe('terminateAllSessions', () => {
    it('should DELETE {basePath}/users/{userId}/sessions', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await terminateAllSessions(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/users/user-1/sessions`);
    });
  });
});
