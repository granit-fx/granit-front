import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useMyUserDevices,
  useMyUserSessions,
  useRevokeMyOtherUserSessions,
  useRevokeMyUserSession,
} from '../hooks/use-my-sessions';
import { IdentityProvider } from '../providers/identity-provider';

import type { IdentityProviderProps } from '../providers/identity-provider';
import type { UserDeviceResponse, UserSessionResponse } from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

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
  sessionCount: 1,
  lastLocation: null,
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IdentityProviderProps['config'] = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

describe('use-my-sessions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useMyUserSessions', () => {
    it('fetches the caller’s own sessions from /sessions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleSession] });

      const { result } = renderHook(() => useMyUserSessions(), { wrapper: createWrapper(client) });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/sessions');
      expect(result.current.data).toEqual([sampleSession]);
    });
  });

  describe('useMyUserDevices', () => {
    it('fetches the caller’s own devices from /devices', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleDevice] });

      const { result } = renderHook(() => useMyUserDevices(), { wrapper: createWrapper(client) });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/devices');
      expect(result.current.data).toEqual([sampleDevice]);
    });
  });

  describe('useRevokeMyUserSession', () => {
    it('revokes one session via DELETE /sessions/{id}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useRevokeMyUserSession(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(toEntityId<'UserSession'>('session-1'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/v1/sessions/session-1');
    });
  });

  describe('useRevokeMyOtherUserSessions', () => {
    it('revokes all other sessions via DELETE /sessions and returns the count', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: { revokedCount: 2 } });

      const { result } = renderHook(() => useRevokeMyOtherUserSessions(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/v1/sessions');
      expect(result.current.data).toEqual({ revokedCount: 2 });
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useRevokeMyOtherUserSessions(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Unauthorized');
    });
  });
});
