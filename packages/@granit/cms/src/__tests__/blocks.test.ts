import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getBlockCatalog, getPublicBlockCatalog, resolveBlockData } from '../api/blocks';

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

describe('getPublicBlockCatalog', () => {
  it('returns the catalog from the anonymous public route', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(catalog));

    const result = await getPublicBlockCatalog(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api/cms/blocks/public`, undefined);
    expect(result).toEqual(catalog);
  });

  it('forwards fetchOptions to the fetch adapter when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(catalog));

    // `cache` is a real RequestInit field; the Next-only `next` field is exercised
    // by the renderer (which augments RequestInit). The forwarding mechanism is identical.
    await getPublicBlockCatalog(client, basePath, { cache: 'force-cache' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api/cms/blocks/public`, {
      fetchOptions: { cache: 'force-cache' },
    });
  });
});

describe('resolveBlockData', () => {
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

  it('posts the request and returns block data', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(resp));

    const result = await resolveBlockData(client, basePath, req);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/api/cms/blocks/data`, req, undefined);
    expect(result).toEqual(resp);
  });

  it('forwards fetchOptions to the fetch adapter when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(resp));

    await resolveBlockData(client, basePath, req, { cache: 'no-store' });

    expect(client.post).toHaveBeenCalledWith(`${basePath}/api/cms/blocks/data`, req, {
      fetchOptions: { cache: 'no-store' },
    });
  });
});
