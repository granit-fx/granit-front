import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useExportPresets } from '../../export/hooks/use-export-presets';
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

describe('useExportPresets', () => {
  it('fetches presets for a definition', async () => {
    const presets = [
      {
        definitionName: 'Test',
        presetName: 'Monthly',
        selectedFields: ['Email'],
        format: 'xlsx',
        includeIdForImport: false,
      },
    ];
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({ data: presets });

    const { result } = renderHook(() => useExportPresets('Test'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.presets.isSuccess).toBe(true));
    expect(result.current.presets.data).toEqual(presets);
  });

  it('does not fetch when definitionName is undefined', () => {
    const { result } = renderHook(() => useExportPresets(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.presets.fetchStatus).toBe('idle');
  });

  it('save mutation calls POST /presets', async () => {
    vi.spyOn(mockClient, 'get').mockResolvedValue({ data: [] });
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useExportPresets('Test'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.presets.isSuccess).toBe(true));

    act(() => {
      result.current.save.mutate({
        definitionName: 'Test',
        presetName: 'New',
        selectedFields: ['Email'],
        format: 'csv',
        includeIdForImport: false,
      });
    });

    await waitFor(() => expect(result.current.save.isSuccess).toBe(true));
    expect(mockClient.post).toHaveBeenCalledWith(
      '/api/v1/data-exchange/metadata/presets',
      expect.objectContaining({ presetName: 'New' })
    );
  });

  it('remove mutation calls DELETE /presets/{def}/{name}', async () => {
    vi.spyOn(mockClient, 'get').mockResolvedValue({ data: [] });
    vi.spyOn(mockClient, 'delete').mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useExportPresets('Test'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.presets.isSuccess).toBe(true));

    act(() => {
      result.current.remove.mutate('Monthly');
    });

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
    expect(mockClient.delete).toHaveBeenCalledWith(
      '/api/v1/data-exchange/metadata/presets/Test/Monthly'
    );
  });
});
