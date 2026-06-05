import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useNotificationPreferences } from '../hooks/use-notification-preferences';
import { NotificationProvider } from '../providers/notification-provider';

import { axiosResponse, createMockClient } from './test-utils';

import type { NotificationConfig, NotificationPreference } from '@granit/notifications';
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
        <NotificationProvider config={config}>{children}</NotificationProvider>
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
        <NotificationProvider config={config}>{children}</NotificationProvider>
      </QueryClientProvider>
    );
  };
}

const MOCK_PREFS: NotificationPreference[] = [
  {
    id: 'pref-1',
    userId: 'u-1',
    notificationTypeName: 'AppointmentReminder',
    channelName: 'InApp',
    isEnabled: true,
  },
  {
    id: 'pref-2',
    userId: 'u-1',
    notificationTypeName: 'AppointmentReminder',
    channelName: 'Email',
    isEnabled: true,
  },
  {
    id: 'pref-3',
    userId: 'u-1',
    notificationTypeName: 'SystemAlert',
    channelName: 'InApp',
    isEnabled: true,
  },
] as unknown as NotificationPreference[];

describe('useNotificationPreferences', () => {
  it('should fetch preferences on mount', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.preferences).toHaveLength(3);
    expect(result.current.preferences[0]!.notificationTypeName).toBe('AppointmentReminder');
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
      result.current.togglePreference('pref-2', false);
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
      result.current.togglePreference('pref-2', false);
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
      result.current.togglePreference('pref-2', false);
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

    const updatedPrefs: NotificationPreference[] = [
      { ...MOCK_PREFS[0]!, isEnabled: false },
    ] as unknown as NotificationPreference[];
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
