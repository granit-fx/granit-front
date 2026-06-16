import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAssignDocumentTag,
  useDocumentTagsList,
  useUnassignDocumentTag,
} from '../hooks/use-document-tags';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type {
  DocumentTagAssignmentResponse,
  DocumentTagResponse,
  ListDocumentTagsResponse,
} from '@granit/documents';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleTag: DocumentTagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
};
const sampleList: ListDocumentTagsResponse = { items: [sampleTag] };
const sampleAssignment: DocumentTagAssignmentResponse = {
  id: 'tag-asg-1',
  tenantId: null,
  tagId: 'tag-1',
  documentId: 'doc-1',
  assignedAt: toISODateString('2026-05-02T00:00:00Z'),
  assignedByUserId: 'user-1',
};

interface Harness {
  readonly client: AxiosInstance;
  readonly queryClient: QueryClient;
  readonly wrapper: (props: { children: ReactNode }) => React.ReactElement;
}

function createHarness(): Harness {
  const client = createMockClient();
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
    </QueryClientProvider>
  );
  return { client, queryClient, wrapper };
}

describe('useDocumentTagsList', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/tags', async () => {
    const { client, wrapper } = createHarness();
    vi.mocked(client.get).mockResolvedValue({ data: sampleList });

    const { result } = renderHook(() => useDocumentTagsList('doc-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/tags');
  });

  it('does not fire when documentId is empty', () => {
    const { client, wrapper } = createHarness();
    const { result } = renderHook(() => useDocumentTagsList(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useAssignDocumentTag', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /documents/{id}/tags/{tagId} and invalidates that document tag list', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleAssignment });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAssignDocumentTag(), { wrapper });
    await result.current.mutateAsync({ documentId: 'doc-1', tagId: 'tag-1' });

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/tags/tag-1');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'documents', 'doc-1', 'tags']]);
  });
});

describe('useUnassignDocumentTag', () => {
  afterEach(() => vi.restoreAllMocks());

  it('DELETEs /documents/{id}/tags/{tagId} and invalidates that document tag list', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnassignDocumentTag(), { wrapper });
    await result.current.mutateAsync({ documentId: 'doc-1', tagId: 'tag-1' });

    expect(client.delete).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/tags/tag-1');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'documents', 'doc-1', 'tags']]);
  });
});
