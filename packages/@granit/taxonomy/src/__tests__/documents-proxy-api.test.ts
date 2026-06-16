import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  attachTagToDocument,
  detachTagFromDocument,
  listDocumentTags,
} from '../api/documents-proxy-api';

import type { TagResponse } from '../types/index';

const basePath = '/api/v1';

const sampleTag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: toISODateString('2026-05-01T08:00:00Z'),
  concurrencyStamp: 'stamp-1',
};

describe('listDocumentTags', () => {
  it('GETs /documents/{documentId}/tags', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleTag]));

    const result = await listDocumentTags(client, basePath, 'doc-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1/tags`);
    expect(result).toEqual([sampleTag]);
  });

  it('encodes the document id', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await listDocumentTags(client, basePath, 'doc/with slash');

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/documents/${encodeURIComponent('doc/with slash')}/tags`
    );
  });
});

describe('attachTagToDocument', () => {
  it('POSTs (no body) to /documents/{documentId}/tags/{tagId}', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    await attachTagToDocument(client, basePath, 'doc-1', 'tag-1');

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/doc-1/tags/tag-1`);
  });
});

describe('detachTagFromDocument', () => {
  it('DELETEs /documents/{documentId}/tags/{tagId}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await detachTagFromDocument(client, basePath, 'doc-1', 'tag-1');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/documents/doc-1/tags/tag-1`);
  });
});
