import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useNotificationPreferences } from '../hooks/use-notification-preferences.js';

import {
  axiosResponse,
  createMockClient,
  createWrapper,
  createWrapperWithoutBasePath,
} from './test-utils.js';

import type { NotificationPreferenceDto } from '@granit/notifications';

const MOCK_PREFS: NotificationPreferenceDto[] = [
  {
    notificationType: 'AppointmentReminder',
    label: 'Rappel de rendez-vous',
    channels: { inApp: true, email: true, push: false },
  },
  {
    notificationType: 'SystemAlert',
    label: 'Alerte système',
    channels: { inApp: true, email: false, push: false },
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

    expect(result.current.preferences).toHaveLength(2);
    expect(result.current.preferences[0].notificationType).toBe('AppointmentReminder');
  });

  it('should update preference optimistically via toggleChannel', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const updatedPref: NotificationPreferenceDto = {
      ...MOCK_PREFS[0],
      channels: { inApp: true, email: false, push: false },
    };
    vi.mocked(client.put).mockResolvedValue(axiosResponse(updatedPref));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleChannel('AppointmentReminder', 'email', false);
    });

    expect(result.current.preferences[0].channels.email).toBe(false);
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
      await result.current.toggleChannel('AppointmentReminder', 'email', false);
    });

    // Should roll back to original value
    expect(result.current.preferences[0].channels.email).toBe(true);
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

  it('should no-op when toggling a non-existent notification type', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(MOCK_PREFS));

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleChannel('NonExistentType', 'email', false);
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
      await result.current.toggleChannel('AppointmentReminder', 'email', false);
    });

    // Should roll back to original value
    expect(result.current.preferences[0].channels.email).toBe(true);
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

    const updatedPrefs: NotificationPreferenceDto[] = [
      { ...MOCK_PREFS[0], channels: { inApp: false, email: true, push: true } },
    ];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(updatedPrefs));

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.preferences).toHaveLength(1);
    expect(result.current.preferences[0].channels.push).toBe(true);
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

  it('should not update state when unmounted during toggleChannel save', async () => {
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
      result.current.toggleChannel('AppointmentReminder', 'email', false);
    });

    unmount();

    // Resolve after unmount
    await act(async () => {
      resolvePut!(
        axiosResponse({ ...MOCK_PREFS[0], channels: { inApp: true, email: false, push: false } })
      );
    });
  });

  it('should not update state when unmounted during toggleChannel error', async () => {
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
      result.current.toggleChannel('AppointmentReminder', 'email', false);
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
