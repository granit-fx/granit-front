import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAdminAppSettings, useBulkUpdateSettings } from '../hooks/use-admin-app-settings';
import { SettingsProvider } from '../providers/settings-provider';

import type { AdminAppSettingResponse, BulkUpdateSettingsResponse } from '@granit/settings';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/settings', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getAdminAppSettings: vi.fn(),
    bulkUpdateSettings: vi.fn(),
  };
});

const { getAdminAppSettings, bulkUpdateSettings } = await import('@granit/settings');

function createWrapper(client: AxiosInstance, basePath?: string) {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <SettingsProvider config={{ client, basePath }}>{children}</SettingsProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

const mockSettings: AdminAppSettingResponse[] = [
  {
    key: 'ui.theme',
    label: 'Theme',
    description: 'Default theme',
    defaultValue: 'system',
    value: 'light',
    valueKind: 'String',
    allowedValues: ['light', 'dark', 'system'],
    isEncrypted: false,
  },
];

describe('useAdminAppSettings', () => {
  it('should fetch admin settings for the given scope', async () => {
    const client = createMockClient();
    vi.mocked(getAdminAppSettings).mockResolvedValue(mockSettings);

    const { wrapper } = createWrapper(client, '/api');
    const { result } = renderHook(() => useAdminAppSettings('global'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getAdminAppSettings).toHaveBeenCalledWith(client, '/api', 'global');
    expect(result.current.data).toEqual(mockSettings);
  });

  it('should respect enabled option', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useAdminAppSettings('global', { enabled: false }), {
      wrapper,
    });

    expect(result.current.isFetching).toBe(false);
    expect(getAdminAppSettings).not.toHaveBeenCalled();
  });
});

describe('useBulkUpdateSettings', () => {
  it('should save settings and invalidate the scope cache', async () => {
    const client = createMockClient();
    const envelope: BulkUpdateSettingsResponse = {
      results: [{ key: 'ui.theme', outcome: 'Updated', errorCode: null }],
    };
    vi.mocked(bulkUpdateSettings).mockResolvedValue(envelope);

    const { wrapper, queryClient } = createWrapper(client, '/api');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useBulkUpdateSettings('global'), { wrapper });

    const payload = [{ key: 'ui.theme', value: 'dark' }];

    let returned: BulkUpdateSettingsResponse | undefined;
    await act(async () => {
      returned = await result.current.mutateAsync(payload);
    });

    expect(bulkUpdateSettings).toHaveBeenCalledWith(client, '/api', 'global', payload);
    expect(invalidateSpy).toHaveBeenCalled();
    expect(returned).toEqual(envelope);
  });

  it('should surface non-Updated outcomes via the response envelope (no throw)', async () => {
    const client = createMockClient();
    const envelope: BulkUpdateSettingsResponse = {
      results: [
        { key: 'ui.theme', outcome: 'Updated', errorCode: null },
        {
          key: 'system.maintenance_mode',
          outcome: 'ProviderNotAllowed',
          errorCode: 'Granit:Settings:ProviderNotAllowed',
        },
      ],
    };
    vi.mocked(bulkUpdateSettings).mockResolvedValue(envelope);

    const { wrapper } = createWrapper(client, '/api');
    const { result } = renderHook(() => useBulkUpdateSettings('tenant'), { wrapper });

    await act(async () => {
      const res = await result.current.mutateAsync([
        { key: 'ui.theme', value: 'dark' },
        { key: 'system.maintenance_mode', value: 'true' },
      ]);
      expect(res.results.filter((r) => r.outcome !== 'Updated')).toHaveLength(1);
    });
  });
});
