import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toEntityId, toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useBeginPasskeyRegistration,
  useCompletePasskeyRegistration,
  useDeletePasskey,
  usePasskeys,
  useRenamePasskey,
} from '../hooks/use-passkeys.js';
import { AccountProvider } from '../providers/account-provider.js';

import type { AccountConfig } from '../providers/account-provider.js';
import type { AccountPasskeyCreatedResponse, AccountPasskeyInfo } from '@granit/account';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/account', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getPasskeys: vi.fn(),
    beginPasskeyRegistration: vi.fn(),
    completePasskeyRegistration: vi.fn(),
    renamePasskey: vi.fn(),
    deletePasskey: vi.fn(),
  };
});

const {
  getPasskeys,
  beginPasskeyRegistration,
  completePasskeyRegistration,
  renamePasskey,
  deletePasskey,
} = await import('@granit/account');

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: AccountConfig = { client };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <AccountProvider config={config}>{children}</AccountProvider>
    );
  };
}

function createWrapperWithQueryClient(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  const config: AccountConfig = { client };
  return {
    wrapper: ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        <AccountProvider config={config}>{children}</AccountProvider>
      ),
    queryClient,
  };
}

const mockPasskeys: readonly AccountPasskeyInfo[] = [
  {
    id: toEntityId<'Passkey'>('pk-001'),
    name: 'YubiKey 5',
    createdAt: toISODateString('2026-03-01T08:00:00Z'),
    lastUsedAt: toISODateString('2026-03-20T10:00:00Z'),
  },
  {
    id: toEntityId<'Passkey'>('pk-002'),
    name: null,
    createdAt: toISODateString('2026-03-10T12:00:00Z'),
    lastUsedAt: null,
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

describe('usePasskeys', () => {
  it('should fetch passkeys', async () => {
    const client = createMockClient();
    vi.mocked(getPasskeys).mockResolvedValue(mockPasskeys);

    const { result } = renderHook(() => usePasskeys(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getPasskeys).toHaveBeenCalledWith(client, '/api/account');
    expect(result.current.data).toEqual(mockPasskeys);
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(getPasskeys).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => usePasskeys(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('useBeginPasskeyRegistration', () => {
  it('should call beginPasskeyRegistration', async () => {
    const client = createMockClient();
    const optionsJson = '{"challenge":"abc"}';
    vi.mocked(beginPasskeyRegistration).mockResolvedValue(optionsJson);

    const { result } = renderHook(() => useBeginPasskeyRegistration(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(beginPasskeyRegistration).toHaveBeenCalledWith(client, '/api/account');
    expect(result.current.data).toBe(optionsJson);
  });
});

describe('useCompletePasskeyRegistration', () => {
  it('should call completePasskeyRegistration and invalidate passkeys on success', async () => {
    const client = createMockClient();
    const response: AccountPasskeyCreatedResponse = {
      id: toEntityId<'Passkey'>('pk-003'),
      name: 'New Key',
      createdAt: toISODateString('2026-03-21T09:00:00Z'),
    };
    vi.mocked(completePasskeyRegistration).mockResolvedValue(response);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCompletePasskeyRegistration(), { wrapper });

    result.current.mutate({ credentialJson: '{"id":"cred"}', name: 'New Key' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(completePasskeyRegistration).toHaveBeenCalledWith(client, '/api/account', {
      credentialJson: '{"id":"cred"}',
      name: 'New Key',
    });
    expect(result.current.data).toEqual(response);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'passkeys'],
    });
  });
});

describe('useRenamePasskey', () => {
  it('should call renamePasskey and invalidate passkeys on success', async () => {
    const client = createMockClient();
    vi.mocked(renamePasskey).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRenamePasskey(), { wrapper });

    result.current.mutate({
      id: toEntityId<'Passkey'>('pk-001'),
      request: { name: 'Renamed Key' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(renamePasskey).toHaveBeenCalledWith(
      client,
      '/api/account',
      toEntityId<'Passkey'>('pk-001'),
      {
        name: 'Renamed Key',
      }
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'passkeys'],
    });
  });
});

describe('useDeletePasskey', () => {
  it('should call deletePasskey and invalidate passkeys on success', async () => {
    const client = createMockClient();
    vi.mocked(deletePasskey).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapperWithQueryClient(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeletePasskey(), { wrapper });

    result.current.mutate(toEntityId<'Passkey'>('pk-001'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deletePasskey).toHaveBeenCalledWith(
      client,
      '/api/account',
      toEntityId<'Passkey'>('pk-001')
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['account', 'passkeys'],
    });
  });

  it('should handle delete error', async () => {
    const client = createMockClient();
    vi.mocked(deletePasskey).mockRejectedValue(new Error('Not Found'));

    const { result } = renderHook(() => useDeletePasskey(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate(toEntityId<'Passkey'>('pk-999'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not Found');
  });
});
