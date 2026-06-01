import { toEntityId } from '@granit/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useNotificationPreferences } from '../hooks/use-notification-preferences';

import {
  axiosResponse,
  createMockClient,
  createWrapper,
  createWrapperWithoutBasePath,
} from './test-utils';

import type { NotificationPreference } from '@granit/notifications';

const MOCK_PREFS: NotificationPreference[] = [
  {
    id: toEntityId<'NotificationPreference'>('pref-1'),
    userId: toEntityId<'User'>('u-1'),
    notificationTypeName: 'AppointmentReminder',
    channelName: 'InApp',
    isEnabled: true,
  },
  {
    id: toEntityId<'NotificationPreference'>('pref-2'),
    userId: toEntityId<'User'>('u-1'),
    notificationTypeName: 'AppointmentReminder',
    channelName: 'Email',
    isEnabled: true,
  },
  {
    id: toEntityId<'NotificationPreference'>('pref-3'),
    userId: toEntityId<'User'>('u-1'),
    notificationTypeName: 'SystemAlert',
    channelName: 'InApp',
    isEnabled: true,
  },
];

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

    const updatedPref: NotificationPreference = {
      ...MOCK_PREFS[1]!,
      isEnabled: false,
    };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updatedPref));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.togglePreference('pref-2', false);
    });

    expect(result.current.preferences[1]!.isEnabled).toBe(false);
  });

  it('should roll back on toggle failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));
    vi.mocked(client.put).mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.togglePreference('pref-2', false);
    });

    // Should roll back to original value
    expect(result.current.preferences[1]!.isEnabled).toBe(true);
    expect(result.current.error?.message).toBe('Save failed');
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

  it('should wrap non-Error throws in Error on initial fetch', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue('string error');

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('string error');
  });

  it('should no-op when toggling a non-existent preference id', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.togglePreference('non-existent', false);
    });

    // No put call should have been made
    expect(client.put).not.toHaveBeenCalled();
    // Preferences unchanged
    expect(result.current.preferences).toEqual(MOCK_PREFS);
  });

  it('should wrap non-Error throws in Error on toggle failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));
    vi.mocked(client.put).mockRejectedValue(42);

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.togglePreference('pref-2', false);
    });

    // Should roll back to original value
    expect(result.current.preferences[1]!.isEnabled).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('42');
  });

  it('should refresh preferences', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedPrefs: NotificationPreference[] = [{ ...MOCK_PREFS[0]!, isEnabled: false }];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(updatedPrefs));

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferences).toHaveLength(1);
    expect(result.current.preferences[0]!.isEnabled).toBe(false);
  });

  it('should not update state when unmounted during initial fetch', async () => {
    let resolveGet: (value: unknown) => void;
    const pendingGet = new Promise((resolve) => {
      resolveGet = resolve;
    });

    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(pendingGet as never);

    const { unmount } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    // Unmount before the fetch resolves
    unmount();

    // Resolve the fetch after unmount — should not throw or update state
    await act(async () => {
      resolveGet!(axiosResponse(MOCK_PREFS));
    });
  });

  it('should not update state when unmounted during initial fetch error', async () => {
    let rejectGet: (reason: unknown) => void;
    const pendingGet = new Promise((_resolve, reject) => {
      rejectGet = reject;
    });

    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(pendingGet as never);

    const { unmount } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    unmount();

    await act(async () => {
      rejectGet!(new Error('Network error'));
    });
  });

  it('should not update state when unmounted during togglePreference save', async () => {
    let resolvePut: (value: unknown) => void;
    const pendingPut = new Promise((resolve) => {
      resolvePut = resolve;
    });

    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));
    vi.mocked(client.put).mockReturnValue(pendingPut as never);

    const { result, unmount } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Start the toggle but don't await — we'll unmount during the save
    act(() => {
      void result.current.togglePreference('pref-2', false);
    });

    unmount();

    // Resolve after unmount
    await act(async () => {
      resolvePut!(axiosResponse({ ...MOCK_PREFS[1], isEnabled: false }));
    });
  });

  it('should not update state when unmounted during togglePreference error', async () => {
    let rejectPut: (reason: unknown) => void;
    const pendingPut = new Promise((_resolve, reject) => {
      rejectPut = reject;
    });

    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));
    vi.mocked(client.put).mockReturnValue(pendingPut as never);

    const { result, unmount } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      void result.current.togglePreference('pref-2', false);
    });

    unmount();

    await act(async () => {
      rejectPut!(new Error('Server error'));
    });
  });

  it('should use default basePath when config.basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapperWithoutBasePath(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/api'));
  });
});
