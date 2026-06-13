import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useTerminateAllSessions,
  useTerminateSession,
  useUserDeviceActivity,
  useUserSessions,
} from '../hooks/use-identity-sessions';
import { IdentityProvider } from '../providers/identity-provider';

import type { IdentityProviderProps } from '../providers/identity-provider';
import type { IdentityDeviceActivity, IdentitySession } from '@granit/identity';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

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

const sampleDevice: IdentityDeviceActivity = {
  ipAddress: '192.168.1.1',
  lastAccess: toISODateString('2026-03-20T12:00:00Z'),
  device: 'Desktop',
  operatingSystem: 'Windows',
  operatingSystemVersion: '11',
  browser: 'Chrome',
  mobile: false,
  current: true,
  sessions: [sampleSession],
  location: null,
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

describe('use-identity-sessions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useUserSessions', () => {
    it('fetches sessions for a user', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleSession] });

      const { result } = renderHook(() => useUserSessions(toEntityId<'User'>('user-1')), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/identity/provider/users/user-1/sessions');
      expect(result.current.data).toEqual([sampleSession]);
    });

    it('is disabled when userId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useUserSessions(toEntityId<'User'>('')), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useUserDeviceActivity', () => {
    it('fetches device activity for a user', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleDevice] });

      const { result } = renderHook(() => useUserDeviceActivity(toEntityId<'User'>('user-1')), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/v1/identity/provider/users/user-1/devices');
      expect(result.current.data).toEqual([sampleDevice]);
    });

    it('is disabled when userId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => useUserDeviceActivity(toEntityId<'User'>('')), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useTerminateSession', () => {
    it('terminates a specific session via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useTerminateSession(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({
        userId: toEntityId<'User'>('user-1'),
        sessionId: toEntityId<'IdentitySession'>('session-1'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith(
        '/api/v1/identity/provider/users/user-1/sessions/session-1'
      );
    });
  });

  describe('useTerminateAllSessions', () => {
    it('terminates all sessions via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useTerminateAllSessions(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(toEntityId<'User'>('user-1'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/v1/identity/provider/users/user-1/sessions');
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockRejectedValue(new Error('Not Implemented'));

      const { result } = renderHook(() => useTerminateAllSessions(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(toEntityId<'User'>('user-1'));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not Implemented');
    });
  });
});
