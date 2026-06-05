import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDeleteSetting } from '../hooks/use-delete-setting';
import { useSetting } from '../hooks/use-setting';
import { useSettings } from '../hooks/use-settings';
import { useUpdateSetting } from '../hooks/use-update-setting';
import { SettingsProvider } from '../providers/settings-provider';

import type { SettingsConfig } from '../providers/settings-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: SettingsConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <SettingsProvider config={config}>{children}</SettingsProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useSetting
// ---------------------------------------------------------------------------

describe('useSetting', () => {
  it('should fetch a single setting by name', async () => {
    const client = createMockClient();
    const settingValue = { name: 'Granit.Locale', value: 'fr' };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(settingValue));

    const { result } = renderHook(() => useSetting('user', 'Granit.Locale'), {
      wrapper: createWrapper(client, '/api'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/settings/user/Granit.Locale');
    expect(result.current.data).toEqual(settingValue);
  });

  it('should use empty string when basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ name: 'x', value: 'y' }));

    const { result } = renderHook(() => useSetting('user', 'x'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/settings/user/x');
  });

  it('should not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useSetting('user', 'Granit.Locale', { enabled: false }), {
      wrapper: createWrapper(client, '/api'),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should fetch when enabled is true explicitly', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ name: 'x', value: 'v' }));

    const { result } = renderHook(() => useSetting('user', 'x', { enabled: true }), {
      wrapper: createWrapper(client, '/api'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalled();
  });

  it('should fetch by default when options are omitted', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ name: 'x', value: 'v' }));

    const { result } = renderHook(() => useSetting('user', 'x'), {
      wrapper: createWrapper(client, '/api'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useSettings
// ---------------------------------------------------------------------------

describe('useSettings', () => {
  it('should fetch all settings for a scope', async () => {
    const client = createMockClient();
    const settingsMap = { 'Granit.Locale': 'fr', 'Granit.Theme': 'dark' };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(settingsMap));

    const { result } = renderHook(() => useSettings('user'), {
      wrapper: createWrapper(client, '/api'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/settings/user');
    expect(result.current.data).toEqual(settingsMap);
  });

  it('should use empty string when basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({}));

    const { result } = renderHook(() => useSettings('tenant'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/settings/tenant');
  });

  it('should not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useSettings('user', { enabled: false }), {
      wrapper: createWrapper(client, '/api'),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should fetch when enabled is true explicitly', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({}));

    const { result } = renderHook(() => useSettings('user', { enabled: true }), {
      wrapper: createWrapper(client, '/api'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useUpdateSetting
// ---------------------------------------------------------------------------

describe('useUpdateSetting', () => {
  it('should call updateSetting via the update function', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUpdateSetting('user'), {
      wrapper: createWrapper(client, '/api'),
    });

    await act(async () => {
      result.current.update('Granit.Locale', 'en');
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.put).toHaveBeenCalledWith('/api/settings/user/Granit.Locale', { value: 'en' });
  });

  it('should call updateSetting via updateAsync', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUpdateSetting('user'), {
      wrapper: createWrapper(client, '/api'),
    });

    await act(async () => {
      await result.current.updateAsync('Granit.Theme', 'dark');
    });

    expect(client.put).toHaveBeenCalledWith('/api/settings/user/Granit.Theme', { value: 'dark' });
  });

  it('should support null value for clearing a setting', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUpdateSetting('user'), {
      wrapper: createWrapper(client, '/api'),
    });

    await act(async () => {
      result.current.update('Granit.Locale', null);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.put).toHaveBeenCalledWith('/api/settings/user/Granit.Locale', { value: null });
  });

  it('should use empty string when basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useUpdateSetting('user'), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      result.current.update('key', 'val');
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.put).toHaveBeenCalledWith('/settings/user/key', { value: 'val' });
  });

  it('should expose error on mutation failure', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useUpdateSetting('user'), {
      wrapper: createWrapper(client, '/api'),
    });

    await act(async () => {
      result.current.update('key', 'val');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe('Forbidden');
  });
});

// ---------------------------------------------------------------------------
// useDeleteSetting
// ---------------------------------------------------------------------------

describe('useDeleteSetting', () => {
  it('should call deleteSetting via the remove function', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useDeleteSetting(), {
      wrapper: createWrapper(client, '/api'),
    });

    await act(async () => {
      result.current.remove('Granit.Locale');
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.delete).toHaveBeenCalledWith('/api/settings/user/Granit.Locale');
  });

  it('should call deleteSetting via removeAsync', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useDeleteSetting(), {
      wrapper: createWrapper(client, '/api'),
    });

    await act(async () => {
      await result.current.removeAsync('Granit.Theme');
    });

    expect(client.delete).toHaveBeenCalledWith('/api/settings/user/Granit.Theme');
  });

  it('should use empty string when basePath is undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useDeleteSetting(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      result.current.remove('key');
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.delete).toHaveBeenCalledWith('/settings/user/key');
  });

  it('should expose error on mutation failure', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useDeleteSetting(), {
      wrapper: createWrapper(client, '/api'),
    });

    await act(async () => {
      result.current.remove('key');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe('Not found');
  });
});
