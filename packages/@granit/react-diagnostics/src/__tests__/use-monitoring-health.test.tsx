import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { mockDiagnosticsHealth } from '@granit/react-diagnostics/testing';

import { buildDiagnosticsQueryKey } from '../hooks/query-keys';
import { useMonitoringHealth } from '../hooks/use-monitoring-health';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const mockResponse = mockDiagnosticsHealth;

describe('buildDiagnosticsQueryKey', () => {
  it('should use default prefix when no queryKeyPrefix is provided', () => {
    expect(buildDiagnosticsQueryKey({}, 'health')).toEqual(['diagnostics', 'health']);
  });

  it('should use custom prefix when queryKeyPrefix is provided', () => {
    const config = { queryKeyPrefix: ['custom', 'diag'] as const };
    expect(buildDiagnosticsQueryKey(config, 'health')).toEqual(['custom', 'diag', 'health']);
  });

  it('should return only the prefix when no segments are provided', () => {
    expect(buildDiagnosticsQueryKey({})).toEqual(['diagnostics']);
  });
});

describe('useMonitoringHealth', () => {
  it('should fetch health with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockResponse });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonitoringHealth({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/diagnostics/health');
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should fetch health with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockResponse });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useMonitoringHealth({ client, basePath: '/api/v2/diagnostics' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/diagnostics/health');
  });

  it('should return services from the response', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockResponse });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonitoringHealth({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.services).toHaveLength(mockDiagnosticsHealth.services.length);
    expect(result.current.data?.services[0].id).toBe('api-gateway');
    expect(result.current.data?.checkedAt).toBe('2026-03-12T10:00:00Z');
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMonitoringHealth({ client }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
