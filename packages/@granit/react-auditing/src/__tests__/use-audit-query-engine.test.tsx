import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuditEntityChanges } from '../hooks/use-audit-entity-changes';
import {
  useAuditEntries,
  useAuditEntriesByCorrelation,
  usePseudonymizeUserAuditLogs,
} from '../hooks/use-audit-log';
import { AuditEntityChangesProvider } from '../providers/audit-entity-changes-provider';
import { AuditLogProvider } from '../providers/audit-log-provider';

import type { AuditEntryDetail, AuditPage } from '@granit/auditing';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

const emptyPage: AuditPage = { items: [], totalCount: 0, hasMore: false, nextCursor: null };

function auditWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <AuditLogProvider config={{ client, basePath: '/api/v1/auditing' }}>
          {children}
        </AuditLogProvider>
      </QueryClientProvider>
    );
  };
}

function changesWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <AuditEntityChangesProvider client={client} basePath="/api/v1/auditing">
          {children}
        </AuditEntityChangesProvider>
      </QueryClientProvider>
    );
  };
}

describe('useAuditEntries (query engine)', () => {
  it('fetches a page from the audit-entries query endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(emptyPage));

    const { result } = renderHook(() => useAuditEntries(), { wrapper: auditWrapper(client) });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.query.data).toEqual(emptyPage);
    expect(client.get).toHaveBeenCalled();
    const url = String(vi.mocked(client.get).mock.calls[0]?.[0]);
    expect(url).toMatch(/^\/api\/v1\/auditing\/audit-entries/);
  });
});

describe('useAuditEntityChanges (query engine)', () => {
  it('fetches a page from the audit-entity-changes query endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(emptyPage));

    const { result } = renderHook(() => useAuditEntityChanges(), {
      wrapper: changesWrapper(client),
    });

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    const url = String(vi.mocked(client.get).mock.calls[0]?.[0]);
    expect(url).toMatch(/^\/api\/v1\/auditing\/audit-entity-changes/);
  });
});

describe('useAuditEntriesByCorrelation', () => {
  it('fetches correlated detail entries', async () => {
    const client = createMockClient();
    const details: AuditEntryDetail[] = [];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(details));

    const { result } = renderHook(() => useAuditEntriesByCorrelation('corr-1'), {
      wrapper: auditWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/auditing/audit-entries/correlation/corr-1');
  });

  it('does not fetch when correlationId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useAuditEntriesByCorrelation(''), {
      wrapper: auditWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePseudonymizeUserAuditLogs', () => {
  it('posts to the pseudonymize endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => usePseudonymizeUserAuditLogs(), {
      wrapper: auditWrapper(client),
    });

    await result.current.mutateAsync('user-1');

    expect(client.post).toHaveBeenCalledWith('/api/v1/auditing/audit-entries/pseudonymize/user-1');
  });
});
