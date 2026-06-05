import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getBlockCatalog, resolveBlockData } from '../api/blocks';

import type {
  BlockCatalogResponse,
  BlockDataResolveRequest,
  BlockDataResponse,
} from '../types/index';

const basePath = 'https://cms.example.com';

const catalog: BlockCatalogResponse = {
  categories: [
    {
      category: 'hero',
      blocks: [
        {
          name: 'Hero',
          version: '1.0.0',
          sourceModule: 'Granit.Cms.Blocks.Hero',
          renderSide: 'Server',
          dataSourceKey: null,
          subscribedContentTypes: [],
          fields: {
            headline: { kind: 'Text' },
            imageId: { kind: 'DocumentReference' },
          },
        },
      ],
    },
  ],
};

describe('getBlockCatalog', () => {
  it('returns the catalog', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(catalog));

    const result = await getBlockCatalog(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api/cms/blocks`);
    expect(result).toEqual(catalog);
  });
});

describe('resolveBlockData', () => {
  it('posts the request and returns block data', async () => {
    const client = createMockClient();
    const req: BlockDataResolveRequest = {
      dataSourceKey: 'blog-latest',
      query: null,
      siteId: 'site-1',
      culture: 'fr',
    };
    const resp: BlockDataResponse = {
      data: { posts: [] },
      consumedContentKeys: ['blog:post:1', 'blog:post:2'],
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(resp));

    const result = await resolveBlockData(client, basePath, req);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/api/cms/blocks/data`, req);
    expect(result).toEqual(resp);
  });
});
