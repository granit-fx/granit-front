import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { batchResolveDocuments } from '../api/documents.js';

import type { BatchResolveDocumentsRequest, ResolvedDocumentResponse } from '../types/index.js';

const basePath = 'https://cms.example.com';

describe('batchResolveDocuments', () => {
  it('posts the request and returns resolved assets (null slots for missing docs)', async () => {
    const client = createMockClient();
    const req: BatchResolveDocumentsRequest = {
      requests: [{ documentId: 'doc-1' }, { documentId: 'doc-missing' }],
    };
    const resolved: ResolvedDocumentResponse = {
      documentId: 'doc-1',
      versionId: 'ver-1',
      url: 'https://cdn.example.com/doc-1',
      width: 1200,
      height: 630,
      mimeType: 'image/webp',
      sizeBytes: 48200,
      lastModified: '2026-05-01T10:00:00Z',
    };
    const resp: (ResolvedDocumentResponse | null)[] = [resolved, null];
    vi.mocked(client.post).mockResolvedValue(axiosResponse(resp));

    const result = await batchResolveDocuments(client, basePath, req);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/resolution/resolve`, req);
    expect(result).toEqual([resolved, null]);
  });
});
