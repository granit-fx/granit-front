import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIdentityRgpd } from '../hooks/use-identity-rgpd.js';
import { IdentityProvider } from '../providers/identity-provider.js';

import type { IdentityProviderProps } from '../providers/identity-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IdentityProviderProps['config'] = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useIdentityRgpd', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('erase mutation deletes user cache', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useIdentityRgpd(), {
      wrapper: createWrapper(client),
    });

    result.current.erase.mutate(toEntityId<'User'>('user-1'));

    await waitFor(() => expect(result.current.erase.isSuccess).toBe(true));
    expect(client.delete).toHaveBeenCalledWith('/api/v1/identity/users/user-1');
  });

  it('uses custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useIdentityRgpd(), {
      wrapper: createWrapper(client, '/custom/path'),
    });

    result.current.erase.mutate(toEntityId<'User'>('user-1'));

    await waitFor(() => expect(result.current.erase.isSuccess).toBe(true));
    expect(client.delete).toHaveBeenCalledWith('/custom/path/user-1');
  });

  it('exposes error state on erase failure', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useIdentityRgpd(), {
      wrapper: createWrapper(client),
    });

    result.current.erase.mutate(toEntityId<'User'>('user-1'));

    await waitFor(() => expect(result.current.erase.isError).toBe(true));
    expect(result.current.erase.error?.message).toBe('Forbidden');
  });
});
