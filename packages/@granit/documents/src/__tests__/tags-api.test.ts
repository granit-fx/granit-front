import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import { assignDocumentTag, listDocumentTags, unassignDocumentTag } from '../api/tags-api';

import type { DocumentTagAssignmentResponse, ListDocumentTagsResponse } from '../types/index';

const basePath = '/api/v1/documents';

const sampleAssignment: DocumentTagAssignmentResponse = {
  id: 'assign-1',
  tenantId: 'tenant-1',
  tagId: 'tag-1',
  documentId: 'doc-1',
  assignedAt: toISODateString('2026-05-01T10:00:00Z'),
  assignedByUserId: 'user-1',
};

describe('listDocumentTags', () => {
  it('GETs /documents/{id}/tags', async () => {
    const client = createMockClient();
    const list: ListDocumentTagsResponse = { items: [] };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(list));

    const result = await listDocumentTags(client, basePath, 'doc-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1/tags`);
    expect(result).toEqual(list);
  });

  it('encodes the document id', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [] }));

    await listDocumentTags(client, basePath, 'doc/with slash');

    expect(client.get).toHaveBeenCalledWith(
      `${basePath}/documents/${encodeURIComponent('doc/with slash')}/tags`
    );
  });
});

describe('assignDocumentTag', () => {
  it('POSTs (no body) to /documents/{id}/tags/{tagId}', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleAssignment));

    const result = await assignDocumentTag(client, basePath, 'doc-1', 'tag-1');

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/doc-1/tags/tag-1`);
    expect(result).toEqual(sampleAssignment);
  });
});

describe('unassignDocumentTag', () => {
  it('DELETEs /documents/{id}/tags/{tagId} and resolves to void', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const result = await unassignDocumentTag(client, basePath, 'doc-1', 'tag-1');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/documents/doc-1/tags/tag-1`);
    expect(result).toBeUndefined();
  });
});
