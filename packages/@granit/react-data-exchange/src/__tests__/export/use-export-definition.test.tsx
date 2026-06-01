import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useExportDefinitions, useExportFields } from '../../export/hooks/use-export-definition';
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

describe('useExportDefinitions', () => {
  it('fetches definitions', async () => {
    const defs = [{ name: 'Test', entityType: 'Entity', supportedFormats: ['xlsx'] }];
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({ data: defs });

    const { result } = renderHook(() => useExportDefinitions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(defs);
  });
});

describe('useExportFields', () => {
  it('fetches fields when definitionName is provided', async () => {
    const fields = [
      {
        propertyPath: 'Email',
        clrTypeName: 'String',
        header: 'Email',
        format: null,
        order: 1,
        isNavigation: false,
      },
    ];
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({ data: fields });

    const { result } = renderHook(() => useExportFields('Test'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fields);
  });

  it('does not fetch when definitionName is undefined', () => {
    const { result } = renderHook(() => useExportFields(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});
