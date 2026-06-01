import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCreateApiKey,
  useRevokeApiKey,
  useRotateApiKey,
  useUpdateApiKeyScopes,
} from '../hooks/use-api-key-mutations';

import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyRotateResponse,
} from '@granit/authentication-api-keys';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

// ---------------------------------------------------------------------------
// useCreateApiKey
// ---------------------------------------------------------------------------

describe('useCreateApiKey', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should POST to the default base path with the request body', async () => {
    const client = createMockClient();
    const createResponse: ApiKeyCreateResponse = {
      id: 'key-new',
      rawSecret: 'test-raw-secret-value',
      prefix: 'test',
      lastFourChars: 'c123',
      name: 'My Key',
      type: 'Secret',
      environment: 'production',
      expiresAt: null,
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: createResponse });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateApiKey({ client }), { wrapper });

    const request: ApiKeyCreateRequest = {
      name: 'My Key',
      type: 'Secret',
      environment: 'production',
    };
    result.current.mutate(request);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/authentication/api-keys', request);
    expect(result.current.data?.id).toBe('key-new');
    expect(result.current.data?.rawSecret).toBe('test-raw-secret-value');
  });

  it('should use custom basePath when provided', async () => {
    const client = createMockClient();
    const createResponse: ApiKeyCreateResponse = {
      id: 'key-new',
      rawSecret: 'test-rotated-secret',
      prefix: 'sk_v2',
      lastFourChars: 'xyz',
      name: 'V2 Key',
      type: 'Publishable',
      environment: 'staging',
      expiresAt: null,
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: createResponse });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCreateApiKey({ client, basePath: '/api/v2/authentication' }),
      {
        wrapper,
      }
    );

    result.current.mutate({ name: 'V2 Key', type: 'Publishable', environment: 'staging' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/authentication/api-keys', expect.any(Object));
  });

  it('should invalidate the list cache on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({
      data: {
        id: 'key-x',
        rawSecret: 's',
        prefix: 'p',
        lastFourChars: 'xxxx',
        name: 'n',
        type: 'Secret',
        environment: 'production',
        expiresAt: null,
      },
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateApiKey({ client }), { wrapper });

    result.current.mutate({ name: 'n', type: 'Secret', environment: 'production' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['api-keys', 'list'],
    });
  });

  it('should surface errors on create failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Validation failed'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateApiKey({ client }), { wrapper });

    result.current.mutate({ name: 'Bad Key', type: 'Secret', environment: 'production' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Validation failed');
  });

  it('should include optional fields when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({
      data: {
        id: 'key-opt',
        rawSecret: 's',
        prefix: 'p',
        lastFourChars: 'xxxx',
        name: 'Opt Key',
        type: 'Webhook',
        environment: 'production',
        expiresAt: toISODateString('2027-01-01T00:00:00Z'),
      },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateApiKey({ client }), { wrapper });

    const request: ApiKeyCreateRequest = {
      name: 'Opt Key',
      type: 'Webhook',
      environment: 'production',
      permissions: ['Events.Publish'],
      allowedCidrs: ['192.168.1.0/24'],
      expiresAt: toISODateString('2027-01-01T00:00:00Z'),
      cacheBehavior: 'NoCache',
    };
    result.current.mutate(request);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/authentication/api-keys', request);
  });
});

// ---------------------------------------------------------------------------
// useRevokeApiKey
// ---------------------------------------------------------------------------

describe('useRevokeApiKey', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should POST to the revoke endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRevokeApiKey({ client }), { wrapper });

    result.current.mutate('key-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/authentication/api-keys/key-1/revoke');
  });

  it('should use custom basePath when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRevokeApiKey({ client, basePath: '/api/v2/authentication' }),
      {
        wrapper,
      }
    );

    result.current.mutate('key-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/authentication/api-keys/key-1/revoke');
  });

  it('should invalidate both list and detail caches on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRevokeApiKey({ client }), { wrapper });

    result.current.mutate('key-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys', 'list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys', 'detail', 'key-1'] });
  });

  it('should surface errors on revoke failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Already revoked'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRevokeApiKey({ client }), { wrapper });

    result.current.mutate('key-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Already revoked');
  });
});

// ---------------------------------------------------------------------------
// useRotateApiKey
// ---------------------------------------------------------------------------

describe('useRotateApiKey', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should POST to the rotate endpoint and return the new secret', async () => {
    const client = createMockClient();
    const rotateResponse: ApiKeyRotateResponse = {
      newKeyId: 'key-new',
      rawSecret: 'test-new-secret-value',
      prefix: 'test',
      lastFourChars: 'cret',
      oldKeyId: 'key-old',
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: rotateResponse });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRotateApiKey({ client }), { wrapper });

    result.current.mutate('key-old');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/authentication/api-keys/key-old/rotate');
    expect(result.current.data?.newKeyId).toBe('key-new');
    expect(result.current.data?.rawSecret).toBe('test-new-secret-value');
    expect(result.current.data?.oldKeyId).toBe('key-old');
  });

  it('should use custom basePath when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({
      data: {
        newKeyId: 'k2',
        rawSecret: 's',
        prefix: 'p',
        lastFourChars: 'xxxx',
        oldKeyId: 'k1',
      },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useRotateApiKey({ client, basePath: '/api/v2/authentication' }),
      {
        wrapper,
      }
    );

    result.current.mutate('k1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/authentication/api-keys/k1/rotate');
  });

  it('should invalidate both list and detail caches on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({
      data: {
        newKeyId: 'key-new',
        rawSecret: 's',
        prefix: 'p',
        lastFourChars: 'xxxx',
        oldKeyId: 'key-1',
      },
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRotateApiKey({ client }), { wrapper });

    result.current.mutate('key-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys', 'list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys', 'detail', 'key-1'] });
  });

  it('should surface errors on rotate failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Key not found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRotateApiKey({ client }), { wrapper });

    result.current.mutate('key-missing');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Key not found');
  });
});

// ---------------------------------------------------------------------------
// useUpdateApiKeyScopes
// ---------------------------------------------------------------------------

describe('useUpdateApiKeyScopes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should PUT to the scopes endpoint with the request body', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateApiKeyScopes({ client }), { wrapper });

    result.current.mutate({
      id: 'key-1',
      request: {
        permissions: ['Invoices.Read', 'Invoices.Create'],
        allowedCidrs: ['10.0.0.0/8'],
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith('/api/v1/authentication/api-keys/key-1/scopes', {
      permissions: ['Invoices.Read', 'Invoices.Create'],
      allowedCidrs: ['10.0.0.0/8'],
    });
  });

  it('should use custom basePath when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useUpdateApiKeyScopes({ client, basePath: '/api/v2/authentication' }),
      { wrapper }
    );

    result.current.mutate({
      id: 'key-1',
      request: { permissions: [], allowedCidrs: [] },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith(
      '/api/v2/authentication/api-keys/key-1/scopes',
      expect.any(Object)
    );
  });

  it('should invalidate both list and detail caches on success', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateApiKeyScopes({ client }), { wrapper });

    result.current.mutate({
      id: 'key-1',
      request: { permissions: ['Reports.Export'], allowedCidrs: [] },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys', 'list'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys', 'detail', 'key-1'] });
  });

  it('should surface errors on update failure', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateApiKeyScopes({ client }), { wrapper });

    result.current.mutate({
      id: 'key-1',
      request: { permissions: [], allowedCidrs: [] },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });

  it('should accept empty permissions and cidrs', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateApiKeyScopes({ client }), { wrapper });

    result.current.mutate({
      id: 'key-1',
      request: { permissions: [], allowedCidrs: [] },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.put).toHaveBeenCalledWith('/api/v1/authentication/api-keys/key-1/scopes', {
      permissions: [],
      allowedCidrs: [],
    });
  });
});
