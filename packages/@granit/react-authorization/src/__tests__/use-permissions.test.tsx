import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildPermissionQueryKey, usePermissions } from '../hooks/use-permissions';

import { createAuthorizationWrapper } from './test-wrapper';

import type { AxiosInstance, AxiosResponse } from '@granit/api-client';
import type { MyPermissionsResponse } from '@granit/authorization';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_PERMISSIONS_RESPONSE: MyPermissionsResponse = { permissions: [] };

function createMockClient(
  response: MyPermissionsResponse = EMPTY_PERMISSIONS_RESPONSE
): AxiosInstance {
  return {
    get: vi.fn().mockResolvedValue({ data: response } as AxiosResponse<MyPermissionsResponse>),
  } as unknown as AxiosInstance;
}

function createFailingClient(error: Error): AxiosInstance {
  return {
    get: vi.fn().mockRejectedValue(error),
  } as unknown as AxiosInstance;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildPermissionQueryKey', () => {
  it('should use default prefix when no queryKeyPrefix is provided', () => {
    expect(buildPermissionQueryKey({}, 'me')).toEqual(['authorization', 'permissions', 'me']);
  });

  it('should use custom prefix when queryKeyPrefix is provided', () => {
    const config = { queryKeyPrefix: ['custom', 'auth'] as const };
    expect(buildPermissionQueryKey(config, 'me')).toEqual(['custom', 'auth', 'me']);
  });

  it('should return only the prefix when no segments are provided', () => {
    expect(buildPermissionQueryKey({})).toEqual(['authorization', 'permissions']);
  });

  it('should handle multiple segments', () => {
    expect(buildPermissionQueryKey({}, 'roles', 'admin')).toEqual([
      'authorization',
      'permissions',
      'roles',
      'admin',
    ]);
  });
});

describe('usePermissions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should start with isLoading=true and empty permissions', () => {
    const client = createMockClient({ permissions: ['A'] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.permissions.size).toBe(0);
  });

  it('should return granted permissions after successful fetch', async () => {
    const client = createMockClient({
      permissions: ['Invoices.Read', 'Invoices.Create', 'Reports.Export'],
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.permissions.size).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it('should call GET /api/v1/authorization/permissions with default basePath', async () => {
    const client = createMockClient();

    renderHook(() => usePermissions(), { wrapper: createAuthorizationWrapper(client) });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(client.get).toHaveBeenCalledWith('/api/v1/authorization/permissions');
  });

  it('should use custom basePath when provided', async () => {
    const client = createMockClient();

    renderHook(() => usePermissions({ basePath: '/api/v1/authorization' }), {
      wrapper: createAuthorizationWrapper(client, { basePath: '/api/v1/authorization' }),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalledOnce());

    expect(client.get).toHaveBeenCalledWith('/api/v1/authorization/permissions');
  });

  it('hasPermission should return true for a granted permission', async () => {
    const client = createMockClient({ permissions: ['Invoices.Read'] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasPermission('Invoices.Read')).toBe(true);
  });

  it('hasPermission should return false for an ungranted permission', async () => {
    const client = createMockClient({ permissions: ['Invoices.Read'] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasPermission('Invoices.Delete')).toBe(false);
  });

  it('hasPermission should return false while loading (safe default)', () => {
    const client = createMockClient({ permissions: ['Invoices.Read'] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    expect(result.current.hasPermission('Invoices.Read')).toBe(false);
  });

  it('hasAnyPermission should return true when at least one matches', async () => {
    const client = createMockClient({ permissions: ['Invoices.Read'] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasAnyPermission(['Invoices.Read', 'Invoices.Delete'])).toBe(true);
  });

  it('hasAnyPermission should return false when none match', async () => {
    const client = createMockClient({ permissions: ['Reports.Export'] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasAnyPermission(['Invoices.Read', 'Invoices.Delete'])).toBe(false);
  });

  it('hasAllPermissions should return true when all match', async () => {
    const client = createMockClient({
      permissions: ['Invoices.Read', 'Invoices.Create', 'Reports.Export'],
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasAllPermissions(['Invoices.Read', 'Invoices.Create'])).toBe(true);
  });

  it('hasAllPermissions should return false when only some match', async () => {
    const client = createMockClient({ permissions: ['Invoices.Read'] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasAllPermissions(['Invoices.Read', 'Invoices.Delete'])).toBe(false);
  });

  it('should expose error and return empty permissions on fetch failure', async () => {
    const client = createFailingClient(new Error('Network error'));

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 5000 });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.permissions.size).toBe(0);
    expect(result.current.hasPermission('Anything')).toBe(false);
  });

  it('should not fetch when enabled=false', async () => {
    const client = createMockClient({ permissions: ['Invoices.Read'] });

    const { result } = renderHook(() => usePermissions({ enabled: false }), {
      wrapper: createAuthorizationWrapper(client),
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(client.get).not.toHaveBeenCalled();
    expect(result.current.permissions.size).toBe(0);
  });

  it('should handle empty permissions list gracefully', async () => {
    const client = createMockClient({ permissions: [] });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createAuthorizationWrapper(client),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.permissions.size).toBe(0);
    expect(result.current.hasPermission('Anything')).toBe(false);
    expect(result.current.hasAnyPermission(['A', 'B'])).toBe(false);
    expect(result.current.hasAllPermissions([])).toBe(true);
  });
});
