import { AuditCategory } from '@granit/auditing';
import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  useAuditLogEntries,
  useAuditLogEntry,
  useEntityAuditTrail,
} from '../hooks/use-audit-log.js';
import { AuditLogProvider } from '../providers/audit-log-provider.js';

import type { AuditLogConfig } from '../providers/audit-log-provider.js';
import type { AuditEntryDetail, AuditPage } from '@granit/auditing';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance, basePath = '/audit-log') {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: AuditLogConfig = { client, basePath };
    return (
      <QueryClientProvider client={queryClient}>
        <AuditLogProvider config={config}>{children}</AuditLogProvider>
      </QueryClientProvider>
    );
  };
}

const emptyPage: AuditPage = {
  items: [],
  totalCount: 0,
  hasMore: false,
  nextCursor: null,
};

describe('useAuditLogEntries', () => {
  it('should fetch entries', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(emptyPage));

    const { result } = renderHook(
      () => useAuditLogEntries({ category: AuditCategory.DataMutation }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(emptyPage);
    expect(client.get).toHaveBeenCalledWith('/audit-log', {
      params: { category: AuditCategory.DataMutation },
    });
  });
});

describe('useAuditLogEntry', () => {
  it('should fetch a single entry', async () => {
    const client = createMockClient();
    const detail: AuditEntryDetail = {
      id: 'abc-123',
      timestamp: toISODateString('2026-03-17T10:00:00Z'),
      userId: 'user-1',
      userName: 'admin',
      category: AuditCategory.DataMutation,
      ipAddress: null,
      tenantId: null,
      correlationId: null,
      entityChanges: [],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(detail));

    const { result } = renderHook(() => useAuditLogEntry('abc-123'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(detail);
  });

  it('should not fetch when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useAuditLogEntry(''), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useEntityAuditTrail', () => {
  it('should fetch entity audit trail', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(emptyPage));

    const { result } = renderHook(
      () => useEntityAuditTrail('Patient', '42', { page: 1, pageSize: 10 }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/audit-log/entity/Patient/42', {
      params: { page: 1, pageSize: 10 },
    });
  });

  it('should not fetch when entityType is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useEntityAuditTrail('', '42'), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
