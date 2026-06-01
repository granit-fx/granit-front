import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  buildDiagnosticsQueryKey,
  diagnosticsKeys,
  useMonitoringHealth,
} from '../hooks/use-monitoring-health';

import type { MonitoringHealthResponse } from '@granit/diagnostics';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const mockResponse: MonitoringHealthResponse = {
  services: [
    {
      id: 'postgresql',
      name: 'Postgresql',
      status: 'healthy',
      responseTimeMs: 5.2,
      description: 'Primary database cluster',
      tags: ['readiness', 'startup'],
    },
  ],
  checkedAt: '2026-03-20T12:00:00+00:00',
};

describe('diagnosticsKeys (legacy)', () => {
  it('should produce stable all key', () => {
    expect(diagnosticsKeys.all).toEqual(['diagnostics']);
  });

  it('should produce stable health key', () => {
    expect(diagnosticsKeys.health()).toEqual(['diagnostics', 'health']);
  });
});

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

    expect(result.current.data?.services).toHaveLength(1);
    expect(result.current.data?.services[0].id).toBe('postgresql');
    expect(result.current.data?.checkedAt).toBe('2026-03-20T12:00:00+00:00');
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
