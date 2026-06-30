import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  assignTag,
  createTag,
  deleteTag,
  getTag,
  listAssignedTags,
  listTags,
  unassignTag,
  updateTag,
} from '../api/tags-api';

import type {
  CreateTagRequest,
  TagAssignmentRequest,
  TagAssignmentResponse,
  TagResponse,
  UpdateTagRequest,
} from '../types/index';

const basePath = '/api/v1/taxonomy';

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

const sampleAssignment: TagAssignmentResponse = {
  id: 'ta-1',
  tenantId: null,
  tagId: 'tag-1',
  targetType: 'Granit.Documents.Domain.Document',
  targetId: 'doc-1',
  assignedAt: toISODateString('2026-05-02T12:00:00Z'),
  assignedByUserId: 'user-1',
};

describe('listTags', () => {
  it('GETs /tags with the scope query param and unwraps the ListTagsResponse envelope', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleTag] }));

    const result = await listTags(client, basePath, { scope: 'documents' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags`, {
      params: { scope: 'documents' },
    });
    expect(result).toEqual([sampleTag]);
  });

  it('appends q when supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleTag] }));

    await listTags(client, basePath, { scope: 'documents', q: 'urg' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags`, {
      params: { scope: 'documents', q: 'urg' },
    });
  });

  it('omits q when undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleTag] }));

    await listTags(client, basePath, { scope: 'documents', q: undefined });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags`, {
      params: { scope: 'documents' },
    });
  });

  it('tolerates a bare-array response (legacy mocks)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleTag]));

    const result = await listTags(client, basePath, { scope: 'documents' });

    expect(result).toEqual([sampleTag]);
  });
});

describe('getTag', () => {
  it('GETs /tags/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleTag));

    const result = await getTag(client, basePath, 'tag-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags/tag-1`);
    expect(result).toEqual(sampleTag);
  });
});

describe('createTag', () => {
  it('POSTs the request body to /tags', async () => {
    const client = createMockClient();
    const request: CreateTagRequest = {
      scope: 'documents',
      name: 'Urgent',
      color: '#FF0000',
      hideOnEntityCard: false,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleTag));

    const result = await createTag(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/tags`, request);
    expect(result).toEqual(sampleTag);
  });

  it('accepts hideOnEntityCard: null', async () => {
    const client = createMockClient();
    const request: CreateTagRequest = {
      scope: 'documents',
      name: 'Draft',
      color: '#AABBCC',
      hideOnEntityCard: null,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleTag));

    await createTag(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/tags`, request);
  });
});

describe('updateTag', () => {
  it('PATCHes /tags/{id} with the nullable payload and url-encodes the id', async () => {
    const client = createMockClient();
    const request: UpdateTagRequest = {
      concurrencyStamp: 'stamp-1',
      name: 'Critical',
      color: null,
      hideOnEntityCard: null,
    };
    vi.mocked(client.patch).mockResolvedValue(axiosResponse({ ...sampleTag, name: 'Critical' }));

    const result = await updateTag(client, basePath, 'tag/with slash', request);

    expect(client.patch).toHaveBeenCalledWith(
      `${basePath}/tags/${encodeURIComponent('tag/with slash')}`,
      request
    );
    expect(result.name).toBe('Critical');
  });
});

describe('deleteTag', () => {
  it('DELETEs /tags/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteTag(client, basePath, 'tag-1');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/tags/tag-1`);
  });
});

describe('assignTag', () => {
  it('POSTs the target ref to /tags/{id}/assign', async () => {
    const client = createMockClient();
    const request: TagAssignmentRequest = {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleAssignment));

    const result = await assignTag(client, basePath, 'tag-1', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/tags/tag-1/assign`, request);
    expect(result).toEqual(sampleAssignment);
  });
});

describe('unassignTag', () => {
  it('DELETEs /tags/{id}/assign/{targetType}/{targetId} with all segments encoded', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await unassignTag(client, basePath, 'tag-1', 'Granit.Documents.Domain.Document', 'doc-1');

    expect(client.delete).toHaveBeenCalledWith(
      `${basePath}/tags/tag-1/assign/${encodeURIComponent('Granit.Documents.Domain.Document')}/doc-1`
    );
  });
});

describe('listAssignedTags', () => {
  it('GETs /assignments (not /tags/assignments) and unwraps the items envelope', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleTag] }));

    const result = await listAssignedTags(client, basePath, {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
    });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/assignments`, {
      params: {
        targetType: 'Granit.Documents.Domain.Document',
        targetId: 'doc-1',
      },
    });
    expect(result).toEqual([sampleTag]);
  });
});
