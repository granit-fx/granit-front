import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useIdentityCapabilities } from '../hooks/use-identity-capabilities';
import { IdentityProvider } from '../providers/identity-provider';

import type { IdentityProviderProps } from '../providers/identity-provider';
import type { IdentityProviderCapabilitiesResponse } from '@granit/identity';
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

const mockCapabilities: IdentityProviderCapabilitiesResponse = {
  providerName: 'Keycloak',
  supportsIndividualSessionTermination: true,
  supportsNativePasswordResetEmail: false,
  supportsGroupHierarchy: true,
  supportsCustomAttributes: false,
  maxCustomAttributes: 50,
  supportsCredentialVerification: true,
  supportsUserCreation: true,
  supportsGroupManagement: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useIdentityCapabilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches capabilities with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockCapabilities });

    const { result } = renderHook(() => useIdentityCapabilities({ enabled: true }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalled();
  });

  it('fetches capabilities with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockCapabilities });

    const { result } = renderHook(() => useIdentityCapabilities({ enabled: true }), {
      wrapper: createWrapper(client, '/custom/identity'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalled();
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useIdentityCapabilities({ enabled: false }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });

  it('defaults to enabled when options omitted', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: mockCapabilities });

    const { result } = renderHook(() => useIdentityCapabilities(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('exposes error state on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useIdentityCapabilities({ enabled: true }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});
