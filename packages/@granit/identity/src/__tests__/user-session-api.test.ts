import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  listMyUserDevices,
  listMyUserSessions,
  revokeMyOtherUserSessions,
  revokeMyUserSession,
} from '../api/user-session-api';

import type {
  UserDeviceResponse,
  UserSessionResponse,
  UserSessionsRevokedResponse,
} from '../types/index';

const sampleSession: UserSessionResponse = {
  sessionId: toEntityId<'UserSession'>('session-1'),
  isCurrent: true,
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
  kind: 'MobileApp',
  operatingSystem: 'iOS',
  browser: null,
  lastSeen: toISODateString('2026-03-20T12:00:00Z'),
  sessionCount: 2,
  isTrusted: false,
  trustedUntil: null,
  lastLocation: null,
};

const basePath = '/api/v1';

describe('user-session-api', () => {
  describe('listMyUserSessions', () => {
    it('should GET {basePath}/sessions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleSession]));

      const result = await listMyUserSessions(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/sessions`);
      expect(result).toEqual([sampleSession]);
    });
  });

  describe('listMyUserDevices', () => {
    it('should GET {basePath}/devices', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleDevice]));

      const result = await listMyUserDevices(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/devices`);
      expect(result).toEqual([sampleDevice]);
    });
  });

  describe('revokeMyUserSession', () => {
    it('should DELETE {basePath}/sessions/{sessionId}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await revokeMyUserSession(client, basePath, toEntityId<'UserSession'>('session-1'));

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/sessions/session-1`);
    });

    it('should encode sessionId with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await revokeMyUserSession(client, basePath, toEntityId<'UserSession'>('session/special@id'));

      expect(client.delete).toHaveBeenCalledWith(
        `${basePath}/sessions/${encodeURIComponent('session/special@id')}`
      );
    });
  });

  describe('revokeMyOtherUserSessions', () => {
    it('should DELETE {basePath}/sessions and return the revoked count', async () => {
      const client = createMockClient();
      const revoked: UserSessionsRevokedResponse = { revokedCount: 3 };
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(revoked));

      const result = await revokeMyOtherUserSessions(client, basePath);

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/sessions`);
      expect(result).toEqual(revoked);
    });
  });
});
