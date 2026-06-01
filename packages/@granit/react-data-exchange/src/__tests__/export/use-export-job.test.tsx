import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExportJob } from '../../export/hooks/use-export-job';
import { ExportProvider } from '../../export/providers/export-provider';

import type { ExportConfig } from '../../export/providers/export-provider';
import type { ReactNode } from 'react';

const mockClient = axios.create();

const mockConfig: ExportConfig = {
  client: mockClient,
  basePath: '/api/v1/data-exchange',
};

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ExportProvider config={mockConfig}>{children}</ExportProvider>
      </QueryClientProvider>
    );
  };
}

describe('useExportJob', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with null job and no errors', () => {
    const { result } = renderHook(() => useExportJob(), {
      wrapper: createWrapper(),
    });

    expect(result.current.job).toBeNull();
    expect(result.current.isExporting).toBe(false);
    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('creates an export job via startExport', async () => {
    const jobResponse = {
      id: 'job-1',
      status: 'Queued' as const,
      definitionName: 'Test',
      format: 'xlsx',
      rowCount: null,
      errorMessage: null,
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });
    // Mock the status polling query to prevent it from running
    vi.spyOn(mockClient, 'get').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useExportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startExport({
        definitionName: 'Test',
        format: 'xlsx',
        selectedFields: ['Name'],
        includeIdForImport: false,
        sort: null,
        filter: null,
        presets: null,
        search: null,
      });
    });

    await waitFor(() => expect(result.current.job).not.toBeNull());
    expect(result.current.job?.id).toBe('job-1');
    expect(result.current.job?.status).toBe('Queued');
  });

  it('reports isExporting while job is active', async () => {
    const jobResponse = {
      id: 'job-2',
      status: 'Exporting' as const,
      definitionName: 'Test',
      format: 'csv',
      rowCount: null,
      errorMessage: null,
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });
    vi.spyOn(mockClient, 'get').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useExportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startExport({
        definitionName: 'Test',
        format: 'csv',
        selectedFields: null,
        includeIdForImport: false,
        sort: null,
        filter: null,
        presets: null,
        search: null,
      });
    });

    await waitFor(() => expect(result.current.isExporting).toBe(true));
  });

  it('propagates creation error', async () => {
    vi.spyOn(mockClient, 'post').mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useExportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startExport({
        definitionName: 'Test',
        format: 'xlsx',
        selectedFields: null,
        includeIdForImport: false,
        sort: null,
        filter: null,
        presets: null,
        search: null,
      });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('Network error');
  });

  it('resets state', async () => {
    const jobResponse = {
      id: 'job-3',
      status: 'Completed' as const,
      definitionName: 'Test',
      format: 'xlsx',
      rowCount: 10,
      errorMessage: null,
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });

    // Mock download to avoid side effects
    vi.spyOn(mockClient, 'get').mockResolvedValue({
      data: new Blob(['test']),
      headers: { 'content-disposition': 'attachment; filename="export.xlsx"' },
    });

    const { result } = renderHook(() => useExportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startExport({
        definitionName: 'Test',
        format: 'xlsx',
        selectedFields: null,
        includeIdForImport: false,
        sort: null,
        filter: null,
        presets: null,
        search: null,
      });
    });

    await waitFor(() => expect(result.current.job).not.toBeNull());

    act(() => {
      result.current.reset();
    });

    await waitFor(() => expect(result.current.job).toBeNull());
    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('stops exporting when job reaches terminal status', async () => {
    const jobResponse = {
      id: 'job-4',
      status: 'Failed' as const,
      definitionName: 'Test',
      format: 'xlsx',
      rowCount: null,
      errorMessage: 'Something went wrong',
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });

    const { result } = renderHook(() => useExportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startExport({
        definitionName: 'Test',
        format: 'xlsx',
        selectedFields: null,
        includeIdForImport: false,
        sort: null,
        filter: null,
        presets: null,
        search: null,
      });
    });

    await waitFor(() => expect(result.current.job?.status).toBe('Failed'));
    expect(result.current.isExporting).toBe(false);
  });
});
