import { getApplicationLocalization } from '@granit/localization';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useApplicationLocalization } from '../hooks/use-application-localization';

import type { ApplicationLocalizationDto } from '@granit/localization';
import type { ReactNode } from 'react';

vi.mock('@granit/localization', () => ({
  getApplicationLocalization: vi.fn(),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.mocked(getApplicationLocalization).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const EMPTY_DTO: ApplicationLocalizationDto = {
  cultureName: 'fr-BE',
  resources: {},
  languages: [],
};

describe('useApplicationLocalization', () => {
  it('fetches with default basePath and provided culture', async () => {
    const client = createMockClient();
    vi.mocked(getApplicationLocalization).mockResolvedValue(EMPTY_DTO);

    const { result } = renderHook(
      () => useApplicationLocalization({ client, cultureName: 'fr-BE' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getApplicationLocalization).toHaveBeenCalledWith(
      client,
      '/api/v1/localization',
      'fr-BE'
    );
  });

  it('honors custom basePath and undefined culture', async () => {
    const client = createMockClient();
    vi.mocked(getApplicationLocalization).mockResolvedValue(EMPTY_DTO);

    renderHook(
      () => useApplicationLocalization({ client, basePath: '/custom', cultureName: undefined }),
      { wrapper: createWrapper() }
    );

    await waitFor(() =>
      expect(getApplicationLocalization).toHaveBeenCalledWith(client, '/custom', undefined)
    );
  });

  it('does not fire the query when enabled is false', () => {
    const client = createMockClient();
    vi.mocked(getApplicationLocalization).mockResolvedValue(EMPTY_DTO);

    renderHook(() => useApplicationLocalization({ client, enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(getApplicationLocalization).not.toHaveBeenCalled();
  });
});
