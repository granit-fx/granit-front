import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  assignTag,
  createTag,
  deleteTag,
  getTagAssignments,
  listTags,
  unassignTag,
  updateTag,
} from '../api/tags-api.js';

import type {
  CreateTagRequest,
  TagAssignmentRequest,
  TagAssignmentResponse,
  TagResponse,
  UpdateTagRequest,
} from '../types/index.js';

const basePath = '/api/v1/taxonomy';

const sampleTag: TagResponse = {
  id: 'tag-1',
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  updatedAt: '2026-05-01T08:00:00Z',
};

const sampleAssignment: TagAssignmentResponse = {
  tagId: 'tag-1',
  targetType: 'Granit.Documents.Domain.Document',
  targetId: 'doc-1',
  assignedAt: '2026-05-02T12:00:00Z',
};

describe('listTags', () => {
  it('GETs /tags with the scope query param', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleTag]));

    const result = await listTags(client, basePath, { scope: 'documents' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags`, {
      params: { scope: 'documents' },
    });
    expect(result).toEqual([sampleTag]);
  });

  it('appends q when supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleTag]));

    await listTags(client, basePath, { scope: 'documents', q: 'urg' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags`, {
      params: { scope: 'documents', q: 'urg' },
    });
  });

  it('omits q when undefined', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleTag]));

    await listTags(client, basePath, { scope: 'documents', q: undefined });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags`, {
      params: { scope: 'documents' },
    });
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
});

describe('updateTag', () => {
  it('PATCHes /tags/{id} with the partial payload and url-encodes the id', async () => {
    const client = createMockClient();
    const request: UpdateTagRequest = { name: 'Critical' };
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

describe('getTagAssignments', () => {
  it('GETs /tags/assignments with targetType + targetId query params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleAssignment]));

    const result = await getTagAssignments(client, basePath, {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
    });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/tags/assignments`, {
      params: {
        targetType: 'Granit.Documents.Domain.Document',
        targetId: 'doc-1',
      },
    });
    expect(result).toEqual([sampleAssignment]);
  });
});
