import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { batchResolveDocumentAssets } from '../api/resolution-api';

import type { BatchResolveRequest, ResolvedDocumentResponse } from '../types/index';

const basePath = '/api/v1/documents';

const request: BatchResolveRequest = {
  requests: [{ documentId: 'doc-1', renditionType: 'Web' }],
};

const resolved: readonly ResolvedDocumentResponse[] = [
  {
    documentId: 'doc-1',
    versionId: 'ver-1',
    url: 'https://cdn.example.com/doc-1',
    width: 1920,
    height: 1080,
    mimeType: 'image/webp',
    sizeBytes: 2048,
    lastModified: '2026-05-01T10:00:00Z',
  },
];

describe('batchResolveDocumentAssets', () => {
  it('POSTs to /resolution/resolve and returns the resolved assets', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(resolved));

    const result = await batchResolveDocumentAssets(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/resolution/resolve`, request, undefined);
    expect(result).toEqual(resolved);
  });

  it('forwards fetchOptions to the fetch adapter when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(resolved));

    await batchResolveDocumentAssets(client, basePath, request, {
      cache: 'force-cache',
    });

    expect(client.post).toHaveBeenCalledWith(`${basePath}/resolution/resolve`, request, {
      fetchOptions: { cache: 'force-cache' },
    });
  });
});
