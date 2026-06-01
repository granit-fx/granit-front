import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useImportReport } from '../../import/hooks/use-import-report';
import { ImportProvider } from '../../import/providers/import-provider';

import type { ImportConfig } from '../../import/providers/import-provider';
import type { ReactNode } from 'react';

const mockClient = axios.create();

const mockConfig: ImportConfig = {
  client: mockClient,
  basePath: '/api/v1/data-exchange',
};

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ImportProvider config={mockConfig}>{children}</ImportProvider>
      </QueryClientProvider>
    );
  };
}

describe('useImportReport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches report when jobId is provided', async () => {
    const report = {
      importJobId: 'job-1',
      finalStatus: 'Completed',
      totalRows: 100,
      succeededRows: 95,
      failedRows: 5,
      skippedRows: 0,
      insertedRows: 90,
      updatedRows: 5,
      duration: '00:00:03',
      rowErrors: [],
    };
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({ data: report });

    const { result } = renderHook(() => useImportReport('job-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.report.isSuccess).toBe(true));
    expect(result.current.report.data).toEqual(report);
  });

  it('does not fetch when jobId is undefined', () => {
    const { result } = renderHook(() => useImportReport(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.report.fetchStatus).toBe('idle');
  });

  it('exposes downloadCorrection function', () => {
    const { result } = renderHook(() => useImportReport('job-1'), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.downloadCorrection).toBe('function');
  });

  it('downloadCorrection creates a download link', async () => {
    const blob = new Blob(['correction data']);
    vi.spyOn(mockClient, 'get').mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/correction-file')) {
        return Promise.resolve({
          data: blob,
          headers: { 'content-disposition': 'attachment; filename="corrections.csv"' },
        });
      }
      return Promise.resolve({
        data: {
          importJobId: 'job-1',
          finalStatus: 'Completed',
          totalRows: 0,
          succeededRows: 0,
          failedRows: 0,
          skippedRows: 0,
          insertedRows: 0,
          updatedRows: 0,
          duration: '00:00:00',
          rowErrors: [],
        },
      });
    });

    const mockCreateObjectURL = vi.fn(() => 'blob:test');
    const mockRevokeObjectURL = vi.fn();
    (globalThis as Record<string, unknown>).URL = {
      ...URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    };

    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag);
    });

    const { result } = renderHook(() => useImportReport('job-1'), {
      wrapper: createWrapper(),
    });

    await result.current.downloadCorrection();

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('downloadCorrection does nothing when jobId is undefined', async () => {
    const getSpy = vi.spyOn(mockClient, 'get');

    const { result } = renderHook(() => useImportReport(undefined), {
      wrapper: createWrapper(),
    });

    await result.current.downloadCorrection();
    expect(getSpy).not.toHaveBeenCalled();
  });
});
