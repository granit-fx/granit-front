import { createQueryWrapper } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { mockPermissionGroups } from '@granit/react-authorization/testing';

import { usePermissionDefinitions } from '../hooks/use-permission-definitions';

describe('usePermissionDefinitions', () => {
  it('should fetch and return permission groups', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockPermissionGroups });

    const { result } = renderHook(() => usePermissionDefinitions({ client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPermissionGroups);
    expect(client.get).toHaveBeenCalledWith('/api/v1/authorization/permissions/definitions');
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(
      () => usePermissionDefinitions({ client, basePath: '/api/v1/authorization' }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/authorization/permissions/definitions');
  });

  it('should not fetch when disabled', () => {
    const client = createMockClient();

    const { result } = renderHook(() => usePermissionDefinitions({ client, enabled: false }), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Forbidden'));

    const { result } = renderHook(() => usePermissionDefinitions({ client }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Forbidden');
  });
});
