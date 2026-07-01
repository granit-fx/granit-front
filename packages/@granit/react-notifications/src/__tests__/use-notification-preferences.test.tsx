import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mockNotificationPreferences } from '@granit/react-notifications/testing';

import { buildNotificationsQueryKey } from '../hooks/query-keys';
import {
  useNotificationPreferences,
  useUpsertNotificationPreference,
} from '../hooks/use-notification-preferences';
import { NotificationsProvider } from '../providers/notifications-provider';

import { axiosResponse, createMockClient } from './test-utils';

import type { NotificationConfig, NotificationPreferenceResponse } from '@granit/notifications';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance, basePath = '/api/v1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => {
    const config: NotificationConfig = { apiClient: client, basePath };
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider config={config}>{children}</NotificationsProvider>
      </QueryClientProvider>
    );
  };
}

function createWrapperWithoutBasePath(client: AxiosInstance) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => {
    const config: NotificationConfig = { apiClient: client };
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider config={config}>{children}</NotificationsProvider>
      </QueryClientProvider>
    );
  };
}

// First three shared preference rows: all three target the same type across
// channels, with `togglePreference` exercised on the second (index 1).
const MOCK_PREFS: NotificationPreferenceResponse[] = mockNotificationPreferences.slice(0, 3);
const TOGGLE_ID = MOCK_PREFS[1]!.id;

describe('useNotificationPreferences', () => {
  it('should fetch preferences on mount', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.preferences).toHaveLength(3);
    expect(result.current.preferences[0]!.notificationTypeName).toBe(
      MOCK_PREFS[0]!.notificationTypeName
    );
  });

  it('should update preference optimistically via togglePreference', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    // Keep PUT pending so we can observe the intermediate optimistic state.
    let resolvePut!: () => void;
    const pendingPut = new Promise<void>((resolve) => {
      resolvePut = resolve;
    });
    vi.mocked(client.put).mockReturnValue(pendingPut as never);

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.togglePreference(TOGGLE_ID, false);
    });

    await waitFor(() => expect(result.current.preferences[1]!.isEnabled).toBe(false));

    await act(async () => {
      resolvePut();
    });
  });

  it('should roll back on toggle failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));
    vi.mocked(client.put).mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.togglePreference(TOGGLE_ID, false);
    });

    await waitFor(() => expect(result.current.preferences[1]!.isEnabled).toBe(true));
  });

  it('should handle initial fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Load failed');
    expect(result.current.preferences).toHaveLength(0);
  });

  it('should no-op when toggling a non-existent preference id', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.togglePreference('non-existent', false);
    });

    expect(client.put).not.toHaveBeenCalled();
    expect(result.current.preferences).toHaveLength(3);
  });

  it('should reflect saving state while PUT is in flight', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    let resolvePut!: () => void;
    const pendingPut = new Promise<void>((resolve) => {
      resolvePut = resolve;
    });
    vi.mocked(client.put).mockReturnValue(pendingPut as never);

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.togglePreference(TOGGLE_ID, false);
    });

    await waitFor(() => expect(result.current.saving).toBe(true));

    await act(async () => {
      resolvePut();
    });
    await waitFor(() => expect(result.current.saving).toBe(false));
  });

  it('should refresh preferences', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedPrefs: NotificationPreferenceResponse[] = [
      { ...MOCK_PREFS[0]!, isEnabled: false },
    ];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(updatedPrefs));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.preferences).toHaveLength(1));
    expect(result.current.preferences[0]!.isEnabled).toBe(false);
  });

  it('should use default basePath when config.basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapperWithoutBasePath(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/notifications/preferences')
    );
  });
});

describe('useUpsertNotificationPreference', () => {
  it('should PUT the preference and resolve on success', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUpsertNotificationPreference(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        notificationTypeName: 'security.login',
        channelName: 'Email',
        isEnabled: true,
      });
    });

    expect(client.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/notifications/preferences'),
      { notificationTypeName: 'security.login', channelName: 'Email', isEnabled: true }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should surface the error on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Upsert failed'));

    const { result } = renderHook(() => useUpsertNotificationPreference(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current
        .mutateAsync({ notificationTypeName: 't', channelName: 'InApp', isEnabled: false })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Upsert failed');
  });
});

describe('buildNotificationsQueryKey', () => {
  it('should default the prefix to ["notifications"]', () => {
    const config = { apiClient: createMockClient() };
    expect(buildNotificationsQueryKey(config, 'preferences')).toEqual([
      'notifications',
      'preferences',
    ]);
  });

  it('should honour a custom queryKeyPrefix', () => {
    const config = { apiClient: createMockClient(), queryKeyPrefix: ['scope', 'notifs'] as const };
    expect(buildNotificationsQueryKey(config, 'subscriptions')).toEqual([
      'scope',
      'notifs',
      'subscriptions',
    ]);
  });
});
