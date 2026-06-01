import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useImportPreview } from '../../import/hooks/use-import-preview';
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

describe('useImportPreview', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useImportPreview(), {
      wrapper: createWrapper(),
    });

    expect(result.current.headers).toEqual([]);
    expect(result.current.previewRows).toEqual([]);
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.fieldMetadata).toEqual([]);
    expect(result.current.mappings).toEqual([]);
    expect(result.current.isPreviewing).toBe(false);
  });

  it('populates state after preview succeeds', async () => {
    const previewData = {
      headers: ['Name', 'Email'],
      previewRows: [['John', 'john@test.com']],
      suggestions: [
        { sourceColumn: 'Name', targetProperty: 'FullName', confidence: 'Fuzzy' as const },
        { sourceColumn: 'Email', targetProperty: 'Email', confidence: 'Exact' as const },
      ],
      fieldMetadata: [
        {
          propertyPath: 'FullName',
          clrTypeName: 'String',
          displayName: 'Full name',
          description: null,
          isRequired: true,
        },
        {
          propertyPath: 'Email',
          clrTypeName: 'String',
          displayName: 'Email',
          description: null,
          isRequired: true,
        },
      ],
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: previewData });

    const { result } = renderHook(() => useImportPreview(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.preview('job-1');
    });

    await waitFor(() => expect(result.current.headers).toEqual(['Name', 'Email']));
    expect(result.current.previewRows).toEqual([['John', 'john@test.com']]);
    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.fieldMetadata).toHaveLength(2);
    expect(result.current.mappings).toHaveLength(2);
  });

  it('updateMapping changes confidence to Manual', async () => {
    const previewData = {
      headers: ['Name'],
      previewRows: [['John']],
      suggestions: [
        { sourceColumn: 'Name', targetProperty: 'FullName', confidence: 'Fuzzy' as const },
      ],
      fieldMetadata: [
        {
          propertyPath: 'FullName',
          clrTypeName: 'String',
          displayName: 'Full name',
          description: null,
          isRequired: false,
        },
        {
          propertyPath: 'Email',
          clrTypeName: 'String',
          displayName: 'Email',
          description: null,
          isRequired: false,
        },
      ],
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: previewData });

    const { result } = renderHook(() => useImportPreview(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.preview('job-1');
    });

    await waitFor(() => expect(result.current.mappings).toHaveLength(1));

    act(() => {
      result.current.updateMapping('Name', 'Email');
    });

    expect(result.current.mappings[0]).toEqual({
      sourceColumn: 'Name',
      targetProperty: 'Email',
      confidence: 'Manual',
    });
  });

  it('reset clears all state', async () => {
    const previewData = {
      headers: ['Name'],
      previewRows: [['John']],
      suggestions: [
        { sourceColumn: 'Name', targetProperty: 'FullName', confidence: 'Exact' as const },
      ],
      fieldMetadata: [
        {
          propertyPath: 'FullName',
          clrTypeName: 'String',
          displayName: 'Full name',
          description: null,
          isRequired: false,
        },
      ],
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: previewData });

    const { result } = renderHook(() => useImportPreview(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.preview('job-1');
    });

    await waitFor(() => expect(result.current.headers.length).toBeGreaterThan(0));

    act(() => {
      result.current.reset();
    });

    expect(result.current.headers).toEqual([]);
    expect(result.current.mappings).toEqual([]);
    expect(result.current.fieldMetadata).toEqual([]);
  });
});
