import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_DIAGNOSTICS_BASE_PATH, getMonitoringHealth } from '../api/diagnostics-api';

import type { MonitoringHealthResponse } from '../types/index';

const BASE = DEFAULT_DIAGNOSTICS_BASE_PATH;

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

describe('getMonitoringHealth', () => {
  it('calls GET {basePath}/health', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockResponse });

    const result = await getMonitoringHealth(client, BASE);
    expect(client.get).toHaveBeenCalledWith(`${BASE}/health`);
    expect(result).toEqual(mockResponse);
  });

  it('returns all services from the response', async () => {
    const client = createMockClient();
    const multiService: MonitoringHealthResponse = {
      services: [
        {
          id: 'postgresql',
          name: 'Postgresql',
          status: 'healthy',
          responseTimeMs: 5.2,
          description: 'Primary database cluster',
          tags: ['readiness', 'startup'],
        },
        {
          id: 'redis',
          name: 'Redis',
          status: 'degraded',
          responseTimeMs: 120.5,
          description: null,
          tags: ['readiness'],
        },
      ],
      checkedAt: '2026-03-20T12:00:00+00:00',
    };
    vi.mocked(client.get).mockResolvedValueOnce({ data: multiService });

    const result = await getMonitoringHealth(client, BASE);
    expect(result.services).toHaveLength(2);
    expect(result.services[0]!.status).toBe('healthy');
    expect(result.services[1]!.status).toBe('degraded');
  });

  it('uses a custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockResponse });

    await getMonitoringHealth(client, '/api/v2/diagnostics');
    expect(client.get).toHaveBeenCalledWith('/api/v2/diagnostics/health');
  });

  it('propagates errors from the client', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Forbidden'));

    await expect(getMonitoringHealth(client, BASE)).rejects.toThrow('Forbidden');
  });
});
