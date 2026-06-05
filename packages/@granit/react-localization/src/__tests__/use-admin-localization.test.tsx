import { deleteLocalizationOverride, setLocalizationOverride } from '@granit/localization';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useDeleteLocalizationOverride,
  useSetLocalizationOverride,
} from '../hooks/use-admin-localization';

import type { ReactNode } from 'react';

vi.mock('@granit/localization', () => ({
  setLocalizationOverride: vi.fn(),
  deleteLocalizationOverride: vi.fn(),
}));

const BASE = '/api/v1/localization';

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

describe('useSetLocalizationOverride', () => {
  it('should call setLocalizationOverride', async () => {
    const client = createMockClient();
    vi.mocked(setLocalizationOverride).mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSetLocalizationOverride({ client, basePath: BASE }), {
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
      BASE,
      'App',
      'fr',
      'hello',
      'Bonjour'
    );
  });

  it('should default basePath to /api/v1/localization', async () => {
    const client = createMockClient();
    vi.mocked(setLocalizationOverride).mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSetLocalizationOverride({ client }), { wrapper });

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
      BASE,
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
    const { result } = renderHook(() => useDeleteLocalizationOverride({ client, basePath: BASE }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        resourceName: 'App',
        cultureName: 'fr',
        key: 'hello',
      });
    });

    expect(deleteLocalizationOverride).toHaveBeenCalledWith(client, BASE, 'App', 'fr', 'hello');
  });
});
