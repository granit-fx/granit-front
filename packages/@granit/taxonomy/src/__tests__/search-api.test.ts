import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { searchTaxonomy } from '../api/search-api.js';

import type { TaxonomySearchResultGroup } from '../types.js';

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
  it('GETs /search with the q query param', async () => {
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
});
