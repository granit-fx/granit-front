import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAcceptAgreement } from '../hooks/use-privacy-agreements';
import { useAgreementDocuments } from '../hooks/use-privacy-agreements';
import { useAgreementHistory } from '../hooks/use-privacy-agreements';
import { useAgreementStatuses } from '../hooks/use-privacy-agreements';
import {
  useCancelDeletion,
  useDeletionRequests,
  useDeletionStatus,
  useRequestDeletion,
} from '../hooks/use-privacy-deletion';
import { usePrivacyExportStatus, usePrivacyExports } from '../hooks/use-privacy-export';
import { useRequestExport } from '../hooks/use-privacy-export';
import {
  buildPrivacyQueryKey,
  PrivacyProvider,
  usePrivacyConfig,
} from '../providers/privacy-provider';

import type { PrivacyConfig } from '../providers/privacy-provider';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string, queryKeyPrefix?: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: PrivacyConfig = { client, basePath, queryKeyPrefix };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <PrivacyProvider config={config}>{children}</PrivacyProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// PrivacyProvider & usePrivacyConfig
// ---------------------------------------------------------------------------

describe('PrivacyProvider', () => {
  it('should provide config with default basePath and queryKeyPrefix', () => {
    const client = createMockClient();

    const { result } = renderHook(() => usePrivacyConfig(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/v1/privacy');
    expect(result.current.queryKeyPrefix).toEqual(['privacy']);
  });

  it('should use custom basePath and queryKeyPrefix when provided', () => {
    const client = createMockClient();

    const { result } = renderHook(() => usePrivacyConfig(), {
      wrapper: createWrapper(client, '/custom/path', ['custom', 'prefix']),
    });

    expect(result.current.basePath).toBe('/custom/path');
    expect(result.current.queryKeyPrefix).toEqual(['custom', 'prefix']);
  });

  it('should throw when usePrivacyConfig is used outside provider', () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    expect(() => renderHook(() => usePrivacyConfig(), { wrapper })).toThrow(
      'usePrivacyConfig must be used within a PrivacyProvider'
    );
  });
});

// ---------------------------------------------------------------------------
// buildPrivacyQueryKey
// ---------------------------------------------------------------------------

describe('buildPrivacyQueryKey', () => {
  it('should use default prefix when queryKeyPrefix is undefined', () => {
    const config: PrivacyConfig = { client: createMockClient() };
    const key = buildPrivacyQueryKey(config, 'agreements', 'documents');
    expect(key).toEqual(['privacy', 'agreements', 'documents']);
  });

  it('should use custom prefix when provided', () => {
    const config: PrivacyConfig = {
      client: createMockClient(),
      queryKeyPrefix: ['custom'],
    };
    const key = buildPrivacyQueryKey(config, 'exports');
    expect(key).toEqual(['custom', 'exports']);
  });
});

// ---------------------------------------------------------------------------
// useAgreementDocuments
// ---------------------------------------------------------------------------

describe('useAgreementDocuments', () => {
  it('should fetch legal documents', async () => {
    const client = createMockClient();
    const documents = [
      { id: 'doc-1', title: 'Terms of Service', version: '1.0', publishedAt: '2025-01-01' },
    ];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(documents));

    const { result } = renderHook(() => useAgreementDocuments(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/privacy/agreements/documents');
    expect(result.current.data).toEqual(documents);
  });
});

// ---------------------------------------------------------------------------
// useAgreementStatuses
// ---------------------------------------------------------------------------

describe('useAgreementStatuses', () => {
  it('should fetch agreement statuses', async () => {
    const client = createMockClient();
    const statuses = [{ documentId: 'doc-1', accepted: true, acceptedAt: '2025-01-02' }];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(statuses));

    const { result } = renderHook(() => useAgreementStatuses(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/privacy/agreements/status');
    expect(result.current.data).toEqual(statuses);
  });
});

// ---------------------------------------------------------------------------
// useAgreementHistory
// ---------------------------------------------------------------------------

describe('useAgreementHistory', () => {
  it('should fetch agreement history', async () => {
    const client = createMockClient();
    const history = [{ documentId: 'doc-1', action: 'accepted', performedAt: '2025-01-02' }];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(history));

    const { result } = renderHook(() => useAgreementHistory(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/privacy/agreements/history');
    expect(result.current.data).toEqual(history);
  });
});

// ---------------------------------------------------------------------------
// useAcceptAgreement
// ---------------------------------------------------------------------------

describe('useAcceptAgreement', () => {
  it('should accept a legal document', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useAcceptAgreement(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate({ documentId: 'doc-1', version: '1.0' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/privacy/agreements/accept', {
      documentId: 'doc-1',
      version: '1.0',
    });
  });

  it('should expose error on mutation failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useAcceptAgreement(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate({ documentId: 'doc-1', version: '1.0' });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('Conflict');
  });
});

// ---------------------------------------------------------------------------
// useRequestDeletion
// ---------------------------------------------------------------------------

describe('useRequestDeletion', () => {
  it('should request immediate data deletion', async () => {
    const client = createMockClient();
    const response = {
      requestId: 'del-1',
      scheduledDeletionAt: '2026-03-22T10:00:01Z',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useRequestDeletion(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate({ reason: 'I want my data deleted' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/privacy/deletions', {
      reason: 'I want my data deleted',
    });
    expect(result.current.data).toEqual(response);
  });

  it('should request deferred deletion with cooling-off period', async () => {
    const client = createMockClient();
    const response = {
      requestId: 'del-2',
      scheduledDeletionAt: '2026-04-21T10:00:00Z',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useRequestDeletion(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate({ reason: 'Closing account', defer: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/privacy/deletions', {
      reason: 'Closing account',
      defer: true,
    });
    expect(result.current.data?.scheduledDeletionAt).toBe('2026-04-21T10:00:00Z');
  });

  it('should expose error on deletion failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useRequestDeletion(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate({ reason: 'delete' });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('Forbidden');
  });
});

// ---------------------------------------------------------------------------
// useDeletionRequests
// ---------------------------------------------------------------------------

describe('useDeletionRequests', () => {
  it('should fetch all deletion requests', async () => {
    const client = createMockClient();
    const deletions = [
      {
        requestId: 'del-1',
        state: 'Deferred',
        reason: 'Closing account',
        requestedAt: '2026-03-22T10:00:00Z',
        scheduledDeletionAt: '2026-04-21T10:00:00Z',
        cancelledAt: null,
        executedAt: null,
      },
    ];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(deletions));

    const { result } = renderHook(() => useDeletionRequests(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/privacy/deletions');
    expect(result.current.data).toEqual(deletions);
  });
});

// ---------------------------------------------------------------------------
// useDeletionStatus
// ---------------------------------------------------------------------------

describe('useDeletionStatus', () => {
  it('should fetch status for a specific deletion request', async () => {
    const client = createMockClient();
    const status = {
      requestId: 'del-1',
      state: 'Deferred',
      reason: 'Closing account',
      requestedAt: '2026-03-22T10:00:00Z',
      scheduledDeletionAt: '2026-04-21T10:00:00Z',
      cancelledAt: null,
      executedAt: null,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(status));

    const { result } = renderHook(() => useDeletionStatus('del-1'), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/privacy/deletions/del-1');
    expect(result.current.data).toEqual(status);
  });

  it('should not fetch when requestId is empty', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useDeletionStatus(''), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useCancelDeletion
// ---------------------------------------------------------------------------

describe('useCancelDeletion', () => {
  it('should cancel a deferred deletion request', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useCancelDeletion(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate('del-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/privacy/deletions/del-1/cancel');
  });

  it('should expose error when cancellation fails (409 conflict)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useCancelDeletion(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate('del-1');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('Conflict');
  });
});

// ---------------------------------------------------------------------------
// usePrivacyExports
// ---------------------------------------------------------------------------

describe('usePrivacyExports', () => {
  it('should fetch all export requests', async () => {
    const client = createMockClient();
    const exports = [{ requestId: 'exp-1', status: 'completed', requestedAt: '2025-01-01' }];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(exports));

    const { result } = renderHook(() => usePrivacyExports(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/privacy/exports');
    expect(result.current.data).toEqual(exports);
  });
});

// ---------------------------------------------------------------------------
// usePrivacyExportStatus
// ---------------------------------------------------------------------------

describe('usePrivacyExportStatus', () => {
  it('should fetch status for a specific export request', async () => {
    const client = createMockClient();
    const status = { requestId: 'exp-1', status: 'processing', requestedAt: '2025-01-01' };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(status));

    const { result } = renderHook(() => usePrivacyExportStatus('exp-1'), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/privacy/exports/exp-1');
    expect(result.current.data).toEqual(status);
  });

  it('should not fetch when requestId is empty', () => {
    const client = createMockClient();

    const { result } = renderHook(() => usePrivacyExportStatus(''), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useRequestExport
// ---------------------------------------------------------------------------

describe('useRequestExport', () => {
  it('should request a new data export', async () => {
    const client = createMockClient();
    const response = { requestId: 'exp-2', requestedAt: '2025-03-22' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useRequestExport(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/privacy/exports', undefined);
    expect(result.current.data).toEqual(response);
  });

  it('should expose error on export failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Rate limited'));

    const { result } = renderHook(() => useRequestExport(), {
      wrapper: createWrapper(client, '/api/privacy'),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('Rate limited');
  });
});
