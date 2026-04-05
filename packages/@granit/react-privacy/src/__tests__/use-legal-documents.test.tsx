import {
  createLegalDocument,
  getLegalDocument,
  listLegalDocuments,
  publishLegalDocument,
  updateLegalDocument,
} from '@granit/privacy';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useCreateLegalDocument,
  useLegalDocument,
  useLegalDocuments,
  usePublishLegalDocument,
  useUpdateLegalDocument,
} from '../hooks/use-legal-documents.js';
import { PrivacyProvider } from '../providers/privacy-provider.js';

import type { LegalDocumentDetail } from '@granit/privacy';

vi.mock('@granit/privacy', () => ({
  createLegalDocument: vi.fn(),
  getLegalDocument: vi.fn(),
  listLegalDocuments: vi.fn(),
  publishLegalDocument: vi.fn(),
  updateLegalDocument: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function createWrapper() {
  const queryClient = createTestQueryClient();
  const client = createMockClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <PrivacyProvider config={{ client }}>{children}</PrivacyProvider>
      </QueryClientProvider>
    ),
    queryClient,
    client,
  };
}

const mockDocument: LegalDocumentDetail = {
  id: 'ldv-001',
  documentId: 'privacy-policy',
  version: 1,
  lifecycleStatus: 'Draft',
  displayName: 'Privacy Policy',
  description: 'Initial draft',
  templateName: 'privacy-policy-template',
  createdAt: '2026-04-01T10:00:00Z',
  lastModifiedAt: '2026-04-01T10:00:00Z',
};

// ---------------------------------------------------------------------------
// useLegalDocuments
// ---------------------------------------------------------------------------

describe('useLegalDocuments', () => {
  it('should fetch all legal documents', async () => {
    vi.mocked(listLegalDocuments).mockResolvedValueOnce([mockDocument]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLegalDocuments(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listLegalDocuments).toHaveBeenCalled();
    expect(result.current.data).toEqual([mockDocument]);
  });

  it('should pass documentId filter params', async () => {
    vi.mocked(listLegalDocuments).mockResolvedValueOnce([mockDocument]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLegalDocuments({ documentId: 'privacy-policy' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(listLegalDocuments).toHaveBeenCalledWith(expect.anything(), '/api/v1/privacy', {
      documentId: 'privacy-policy',
    });
  });

  it('should handle fetch error', async () => {
    vi.mocked(listLegalDocuments).mockRejectedValueOnce(new Error('Server Error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLegalDocuments(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Server Error');
  });
});

// ---------------------------------------------------------------------------
// useLegalDocument
// ---------------------------------------------------------------------------

describe('useLegalDocument', () => {
  it('should fetch a single legal document by ID', async () => {
    vi.mocked(getLegalDocument).mockResolvedValueOnce(mockDocument);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLegalDocument('ldv-001'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getLegalDocument).toHaveBeenCalledWith(expect.anything(), '/api/v1/privacy', 'ldv-001');
    expect(result.current.data).toEqual(mockDocument);
  });

  it('should be disabled when id is empty', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLegalDocument(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getLegalDocument).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useCreateLegalDocument
// ---------------------------------------------------------------------------

describe('useCreateLegalDocument', () => {
  it('should create a document and invalidate legal-documents query', async () => {
    vi.mocked(createLegalDocument).mockResolvedValueOnce(mockDocument);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateLegalDocument(), { wrapper });

    result.current.mutate({
      documentId: 'privacy-policy',
      displayName: 'Privacy Policy',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(createLegalDocument).toHaveBeenCalledWith(expect.anything(), '/api/v1/privacy', {
      documentId: 'privacy-policy',
      displayName: 'Privacy Policy',
    });
    expect(result.current.data).toEqual(mockDocument);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['privacy', 'legal-documents'],
    });
  });

  it('should handle creation error', async () => {
    vi.mocked(createLegalDocument).mockRejectedValueOnce(new Error('Bad Request'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateLegalDocument(), { wrapper });

    result.current.mutate({ documentId: 'test', displayName: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Bad Request');
  });
});

// ---------------------------------------------------------------------------
// useUpdateLegalDocument
// ---------------------------------------------------------------------------

describe('useUpdateLegalDocument', () => {
  it('should update a document and invalidate legal-documents query', async () => {
    const updated = { ...mockDocument, displayName: 'Updated Policy' };
    vi.mocked(updateLegalDocument).mockResolvedValueOnce(updated);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateLegalDocument(), { wrapper });

    result.current.mutate({
      id: 'ldv-001',
      request: { displayName: 'Updated Policy' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateLegalDocument).toHaveBeenCalledWith(
      expect.anything(),
      '/api/v1/privacy',
      'ldv-001',
      { displayName: 'Updated Policy' }
    );
    expect(result.current.data).toEqual(updated);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['privacy', 'legal-documents'],
    });
  });

  it('should handle update error', async () => {
    vi.mocked(updateLegalDocument).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateLegalDocument(), { wrapper });

    result.current.mutate({ id: 'invalid', request: { displayName: 'X' } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});

// ---------------------------------------------------------------------------
// usePublishLegalDocument
// ---------------------------------------------------------------------------

describe('usePublishLegalDocument', () => {
  it('should publish a document and invalidate legal-documents query', async () => {
    const published = { ...mockDocument, lifecycleStatus: 'Published' as const };
    vi.mocked(publishLegalDocument).mockResolvedValueOnce(published);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePublishLegalDocument(), { wrapper });

    result.current.mutate('ldv-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(publishLegalDocument).toHaveBeenCalledWith(
      expect.anything(),
      '/api/v1/privacy',
      'ldv-001'
    );
    expect(result.current.data).toEqual(published);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['privacy', 'legal-documents'],
    });
  });

  it('should handle publish error', async () => {
    vi.mocked(publishLegalDocument).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePublishLegalDocument(), { wrapper });

    result.current.mutate('ldv-001');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});
