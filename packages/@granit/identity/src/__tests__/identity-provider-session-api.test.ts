import { axiosResponse, createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  getUserDeviceActivity,
  listUserSessions,
  terminateAllSessions,
  terminateSession,
} from '../api/identity-provider-session-api';

import type { IdentityDeviceActivity, IdentitySession } from '../types/index';

const sampleSession: IdentitySession = {
  sessionId: toEntityId<'IdentitySession'>('session-1'),
  ipAddress: '192.168.1.1',
  startedAt: toISODateString('2026-03-20T10:00:00Z'),
  lastAccess: toISODateString('2026-03-20T12:00:00Z'),
  rememberMe: false,
  clients: ['web-app'],
  location: null,
  riskLevel: null,
};

const sampleDeviceActivity: IdentityDeviceActivity = {
  ipAddress: '192.168.1.1',
  lastAccess: toISODateString('2026-03-20T12:00:00Z'),
  device: 'Desktop',
  os: 'Windows',
  osVersion: '11',
  browser: 'Chrome',
  mobile: false,
  current: true,
  sessions: [sampleSession],
  location: null,
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

  describe('getUserDeviceActivity', () => {
    it('should GET {basePath}/users/{userId}/devices', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleDeviceActivity]));

      const result = await getUserDeviceActivity(client, basePath, toEntityId<'User'>('user-1'));

      expect(client.get).toHaveBeenCalledWith(`${basePath}/users/user-1/devices`);
      expect(result).toEqual([sampleDeviceActivity]);
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
        toEntityId<'IdentitySession'>('session-1')
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
        toEntityId<'IdentitySession'>('session/special@id')
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
