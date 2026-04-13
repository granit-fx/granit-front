import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  usePasswordChangedAt,
  useSendPasswordResetEmail,
  useSetTemporaryPassword,
} from '../hooks/use-identity-passwords.js';
import { IdentityProvider } from '../providers/identity-provider.js';

import type { IdentityConfig } from '../providers/identity-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: IdentityConfig = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <IdentityProvider config={config}>{children}</IdentityProvider>
    );
  };
}

describe('use-identity-passwords', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePasswordChangedAt', () => {
    it('fetches password changed-at timestamp', async () => {
      const client = createMockClient();
      const response = { changedAt: '2026-03-15T08:00:00Z' };
      vi.mocked(client.get).mockResolvedValue({ data: response });

      const { result } = renderHook(() => usePasswordChangedAt(toEntityId<'User'>('user-1')), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/identity/provider/users/user-1/password/changed-at'
      );
      expect(result.current.data).toEqual(response);
    });

    it('handles null changedAt', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { changedAt: null } });

      const { result } = renderHook(() => usePasswordChangedAt(toEntityId<'User'>('user-1')), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.changedAt).toBeNull();
    });

    it('is disabled when userId is empty', async () => {
      const client = createMockClient();

      const { result } = renderHook(() => usePasswordChangedAt(toEntityId<'User'>('')), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useSendPasswordResetEmail', () => {
    it('sends reset email via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useSendPasswordResetEmail(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(toEntityId<'User'>('user-1'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/identity/provider/users/user-1/password/reset-email'
      );
    });

    it('exposes error state on 501', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockRejectedValue(new Error('Not Implemented'));

      const { result } = renderHook(() => useSendPasswordResetEmail(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate(toEntityId<'User'>('user-1'));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not Implemented');
    });
  });

  describe('useSetTemporaryPassword', () => {
    it('sets temporary password via POST', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useSetTemporaryPassword(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ userId: toEntityId<'User'>('user-1'), password: 'temp123!' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/identity/provider/users/user-1/password/temporary',
        { password: 'temp123!' }
      );
    });
  });
});
