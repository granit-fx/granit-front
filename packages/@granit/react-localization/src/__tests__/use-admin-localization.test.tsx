import {
  deleteLocalizationOverride,
  listLanguages,
  setLocalizationOverride,
  updateLanguageStatus,
} from '@granit/localization';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useDeleteLocalizationOverride,
  useLanguages,
  useSetLocalizationOverride,
  useToggleLanguage,
} from '../hooks/use-admin-localization';

import type { ReactNode } from 'react';

vi.mock('@granit/localization', () => ({
  listLanguages: vi.fn(),
  updateLanguageStatus: vi.fn(),
  setLocalizationOverride: vi.fn(),
  deleteLocalizationOverride: vi.fn(),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useLanguages', () => {
  it('should fetch languages', async () => {
    const client = createMockClient();
    const languages = [
      { cultureName: 'fr', displayName: 'Français', isDefault: true, isEnabled: true },
    ];
    vi.mocked(listLanguages).mockResolvedValue(languages);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguages({ client, basePath: '/api' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listLanguages).toHaveBeenCalledWith(client, '/api');
    expect(result.current.data).toEqual(languages);
  });

  it('should use empty string as default basePath', async () => {
    const client = createMockClient();
    vi.mocked(listLanguages).mockResolvedValue([]);

    const { wrapper } = createWrapper();
    renderHook(() => useLanguages({ client }), { wrapper });

    await waitFor(() => expect(listLanguages).toHaveBeenCalledWith(client, ''));
  });
});

describe('useToggleLanguage', () => {
  it('should call updateLanguageStatus', async () => {
    const client = createMockClient();
    vi.mocked(updateLanguageStatus).mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleLanguage({ client, basePath: '/api' }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ cultureName: 'nl', isEnabled: true });
    });

    expect(updateLanguageStatus).toHaveBeenCalledWith(client, '/api', 'nl', true);
  });
});

describe('useSetLocalizationOverride', () => {
  it('should call setLocalizationOverride', async () => {
    const client = createMockClient();
    vi.mocked(setLocalizationOverride).mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSetLocalizationOverride({ client, basePath: '/api' }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        resourceName: 'App',
        cultureName: 'fr',
        key: 'hello',
        value: 'Bonjour',
      });
    });

    expect(setLocalizationOverride).toHaveBeenCalledWith(
      client,
      '/api',
      'App',
      'fr',
      'hello',
      'Bonjour'
    );
  });
});

describe('useDeleteLocalizationOverride', () => {
  it('should call deleteLocalizationOverride', async () => {
    const client = createMockClient();
    vi.mocked(deleteLocalizationOverride).mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useDeleteLocalizationOverride({ client, basePath: '/api' }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        resourceName: 'App',
        cultureName: 'fr',
        key: 'hello',
      });
    });

    expect(deleteLocalizationOverride).toHaveBeenCalledWith(client, '/api', 'App', 'fr', 'hello');
  });
});
