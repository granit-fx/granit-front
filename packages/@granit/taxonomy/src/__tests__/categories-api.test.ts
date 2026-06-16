import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  assignCategory,
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  moveCategory,
  unassignCategory,
  updateCategory,
} from '../api/categories-api';

import type {
  CategoryAssignmentRequest,
  CategoryAssignmentResponse,
  CategoryDetailResponse,
  CategoryResponse,
  CreateCategoryRequest,
  MoveCategoryRequest,
} from '../types/index';

const basePath = '/api/v1/taxonomy';

const sampleRoot: CategoryResponse = {
  id: 'cat-1',
  tenantId: null,
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: true,
  createdAt: '2026-05-01T08:00:00Z',
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

const sampleChild: CategoryResponse = {
  id: 'cat-2',
  tenantId: null,
  scope: 'documents',
  parentId: 'cat-1',
  path: '/legal/contracts',
  name: 'contracts',
  depth: 1,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: false,
  createdAt: '2026-05-01T08:00:00Z',
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

const sampleDetail: CategoryDetailResponse = {
  ...sampleChild,
  breadcrumb: [sampleRoot, sampleChild],
};

const sampleAssignment: CategoryAssignmentResponse = {
  id: 'ca-1',
  tenantId: null,
  categoryId: 'cat-2',
  targetType: 'Granit.Documents.Domain.Document',
  targetId: 'doc-1',
  assignedAt: '2026-05-02T12:00:00Z',
  assignedByUserId: 'user-1',
};

describe('listCategories', () => {
  it('GETs /categories with only scope when parentId is omitted and unwraps the envelope', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleRoot] }));

    const result = await listCategories(client, basePath, { scope: 'documents' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/categories`, {
      params: { scope: 'documents' },
    });
    expect(result).toEqual([sampleRoot]);
  });

  it('omits parentId from params when explicitly null (root list)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleRoot] }));

    await listCategories(client, basePath, { scope: 'documents', parentId: null });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/categories`, {
      params: { scope: 'documents' },
    });
  });

  it('appends parentId when a non-null id is supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleChild] }));

    await listCategories(client, basePath, { scope: 'documents', parentId: 'cat-1' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/categories`, {
      params: { scope: 'documents', parentId: 'cat-1' },
    });
  });

  it('tolerates a bare-array response (legacy mocks)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleRoot]));

    const result = await listCategories(client, basePath, { scope: 'documents' });

    expect(result).toEqual([sampleRoot]);
  });
});

describe('getCategory', () => {
  it('GETs /categories/{id}, adapts the wire envelope, and exposes a flat CategoryDetailResponse', async () => {
    const client = createMockClient();
    // Wire format: { category: CategoryResponse, breadcrumb: CategoryResponse[] }
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ category: sampleChild, breadcrumb: [sampleRoot, sampleChild] })
    );

    const result = await getCategory(client, basePath, 'cat-2');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/categories/cat-2`);
    expect(result.id).toBe(sampleChild.id);
    expect(result.name).toBe(sampleChild.name);
    expect(result.breadcrumb).toEqual([sampleRoot, sampleChild]);
  });

  it('flattened result is structurally a CategoryDetailResponse', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ category: sampleChild, breadcrumb: [sampleRoot, sampleChild] })
    );

    const result = await getCategory(client, basePath, 'cat-2');
    const expected: CategoryDetailResponse = sampleDetail;

    expect(result).toEqual(expected);
  });
});

describe('createCategory', () => {
  it('POSTs the request body to /categories', async () => {
    const client = createMockClient();
    const request: CreateCategoryRequest = {
      scope: 'documents',
      parentId: null,
      name: 'legal',
      iconName: null,
      hideOnEntityCard: null,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleRoot));

    const result = await createCategory(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/categories`, request);
    expect(result).toEqual(sampleRoot);
  });
});

describe('updateCategory', () => {
  it('PATCHes /categories/{id} with the nullable payload', async () => {
    const client = createMockClient();
    vi.mocked(client.patch).mockResolvedValue(
      axiosResponse({ ...sampleChild, name: 'agreements' })
    );

    const result = await updateCategory(client, basePath, 'cat-2', {
      name: 'agreements',
      iconName: null,
      hideOnEntityCard: null,
    });

    expect(client.patch).toHaveBeenCalledWith(`${basePath}/categories/cat-2`, {
      name: 'agreements',
      iconName: null,
      hideOnEntityCard: null,
    });
    expect(result.name).toBe('agreements');
  });
});

describe('moveCategory', () => {
  it('POSTs newParentId to /categories/{id}/move', async () => {
    const client = createMockClient();
    const request: MoveCategoryRequest = { newParentId: 'cat-3' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleChild));

    await moveCategory(client, basePath, 'cat-2', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/categories/cat-2/move`, request);
  });

  it('forwards null newParentId to promote a node to a scope root', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse({ ...sampleChild, parentId: null }));

    await moveCategory(client, basePath, 'cat-2', { newParentId: null });

    expect(client.post).toHaveBeenCalledWith(`${basePath}/categories/cat-2/move`, {
      newParentId: null,
    });
  });
});

describe('deleteCategory', () => {
  it('DELETEs /categories/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteCategory(client, basePath, 'cat-2');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/categories/cat-2`);
  });
});

describe('assignCategory', () => {
  it('POSTs the target ref to /categories/{id}/assign', async () => {
    const client = createMockClient();
    const request: CategoryAssignmentRequest = {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleAssignment));

    const result = await assignCategory(client, basePath, 'cat-2', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/categories/cat-2/assign`, request);
    expect(result).toEqual(sampleAssignment);
  });
});

describe('unassignCategory', () => {
  it('DELETEs /categories/assign/{targetType}/{targetId} with segments encoded', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await unassignCategory(client, basePath, 'Granit.Documents.Domain.Document', 'doc-1');

    expect(client.delete).toHaveBeenCalledWith(
      `${basePath}/categories/assign/${encodeURIComponent('Granit.Documents.Domain.Document')}/doc-1`
    );
  });
});
