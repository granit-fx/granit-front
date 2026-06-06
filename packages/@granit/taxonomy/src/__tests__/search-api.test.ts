import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { searchTaxonomy } from '../api/search-api';

import type { TaxonomySearchResultGroup } from '../types/index';

const basePath = '/api/v1/taxonomy';

const sampleGroup: TaxonomySearchResultGroup = {
  targetType: 'Granit.Documents.Domain.Document',
  items: [
    {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
      label: 'Q1 contract',
      snippet: '…tagged Urgent…',
      matchedTagIds: ['tag-1'],
      matchedCategoryId: null,
    },
  ],
};

describe('searchTaxonomy', () => {
  it('GETs /search with the q query param and passes through a bare-array response', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleGroup]));

    const result = await searchTaxonomy(client, basePath, { q: 'urgent' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/search`, {
      params: { q: 'urgent' },
    });
    expect(result).toEqual([sampleGroup]);
  });

  it('forwards an empty query string to the backend (does not short-circuit)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await searchTaxonomy(client, basePath, { q: '' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/search`, { params: { q: '' } });
  });

  it('adapts the backend SearchResponse envelope into TaxonomySearchResultGroup[]', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        tags: [{ id: 'tag-1', name: 'Urgent', color: '#FF0000', scope: 'documents' }],
        hits: {
          'Granit.Documents.Domain.Document': [{ targetId: 'doc-1', tagIds: ['tag-1'] }],
        },
        totalCount: 1,
        skip: 0,
        take: 50,
      })
    );

    const result = await searchTaxonomy(client, basePath, { q: 'urgent' });

    expect(result).toEqual([
      {
        targetType: 'Granit.Documents.Domain.Document',
        items: [
          {
            targetType: 'Granit.Documents.Domain.Document',
            targetId: 'doc-1',
            label: '',
            snippet: null,
            matchedTagIds: ['tag-1'],
            matchedCategoryId: null,
          },
        ],
      },
    ]);
  });

  it('returns [] when the backend envelope has no hits', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({
        tags: [] as { id: string; name: string; color: string; scope: string }[],
        hits: {},
        totalCount: 0,
        skip: 0,
        take: 50,
      })
    );

    const result = await searchTaxonomy(client, basePath, { q: 'nothing' });

    expect(result).toEqual([]);
  });
});
