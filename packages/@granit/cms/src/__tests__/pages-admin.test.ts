import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  createPage,
  deletePage,
  getPage,
  getPageTree,
  listPageVersions,
  listPages,
  movePage,
  publishPage,
  rollbackPage,
  saveDraft,
  unpublishPage,
  updatePage,
  updatePageTranslation,
} from '../api/pages-admin';

import type {
  PageDraftConflictResponse,
  PageResponse,
  PageTreeNodeResponse,
  PageVersionSummaryResponse,
} from '../types/index';

const BASE = 'https://cms.example.com';

const treeNode: PageTreeNodeResponse = {
  id: 'page-1',
  parentId: null,
  slugSegment: 'home',
  structurePath: '/home',
  depth: 0,
  isSiteRoot: true,
};

const page: PageResponse = {
  id: 'page-1',
  siteId: 'site-1',
  parentId: null,
  slugSegment: 'home',
  structurePath: '/home',
  depth: 0,
  kind: 'standard',
  isSiteRoot: true,
  layoutKey: null,
  translations: [{ culture: 'fr', urlSlug: 'accueil', title: 'Accueil', path: '/accueil' }],
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
  concurrencyStamp: 'mock-stamp',
};

const version: PageVersionSummaryResponse = {
  versionId: 'v-1',
  version: 1,
  lifecycleStatus: 'Draft',
  isPublished: false,
  publishedAt: null,
};

describe('getPageTree', () => {
  it('GET /api/cms/pages/tree with X-Granit-Site header', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([treeNode]));

    const result = await getPageTree(client, BASE, 'site-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/pages/tree`, {
      headers: { 'X-Granit-Site': 'site-1' },
    });
    expect(result).toEqual([treeNode]);
  });
});

describe('listPages', () => {
  it('serializes the QueryEngine request into the query string', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ items: [page], totalCount: 1, hasMore: false, nextCursor: null })
    );

    await listPages(client, BASE, { page: 1, pageSize: 20 });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/pages?page=1&pageSize=20`, undefined);
  });
});

describe('getPage', () => {
  it('GET /api/cms/pages/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    const result = await getPage(client, BASE, 'page-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1`);
    expect(result).toEqual(page);
  });
});

describe('createPage', () => {
  it('POST /api/cms/pages', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(page));

    const request = { parentId: 'parent-1', slugSegment: 'home', layoutKey: null };
    const result = await createPage(client, BASE, request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/pages`, request);
    expect(result).toEqual(page);
  });
});

describe('updatePage', () => {
  it('PUT /api/cms/pages/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(page));

    await updatePage(client, BASE, 'page-1', {
      slugSegment: 'new-home',
      concurrencyStamp: 'stamp-1',
    });

    expect(client.put).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1`, {
      slugSegment: 'new-home',
      concurrencyStamp: 'stamp-1',
    });
  });
});

describe('updatePageTranslation', () => {
  it('PUT /api/cms/pages/{id}/translations/{culture}', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(page));

    await updatePageTranslation(client, BASE, 'page-1', 'fr', {
      urlSlug: 'accueil',
      title: 'Accueil',
    });

    expect(client.put).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1/translations/fr`, {
      urlSlug: 'accueil',
      title: 'Accueil',
    });
  });
});

describe('movePage', () => {
  it('POST /api/cms/pages/{id}/move', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    await movePage(client, BASE, 'page-1', {
      newParentId: 'parent-1',
      concurrencyStamp: 'stamp-1',
    });

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1/move`, {
      newParentId: 'parent-1',
      concurrencyStamp: 'stamp-1',
    });
  });
});

describe('deletePage', () => {
  it('DELETE /api/cms/pages/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deletePage(client, BASE, 'page-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1`);
  });
});

describe('saveDraft', () => {
  it('returns ok+version on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue({ status: 200, data: version });

    const result = await saveDraft(client, BASE, 'page-1', 'fr', { contentJson: '{}' });

    expect(result).toEqual({ ok: true, version });
  });

  it('returns ok:false+conflict on 409', async () => {
    const client = createMockClient();
    const conflict: PageDraftConflictResponse = { pageId: 'page-1', culture: 'fr' };
    vi.mocked(client.put).mockResolvedValue({ status: 409, data: conflict });

    const result = await saveDraft(client, BASE, 'page-1', 'fr', { contentJson: '{}' });

    expect(result).toEqual({ ok: false, conflict });
  });
});

describe('listPageVersions', () => {
  it('GET /api/cms/pages/{id}/versions', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([version]));

    const result = await listPageVersions(client, BASE, 'page-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1/versions`);
    expect(result).toEqual([version]);
  });
});

describe('publishPage', () => {
  it('POST /api/cms/pages/{id}/publish', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    await publishPage(client, BASE, 'page-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1/publish`);
  });
});

describe('unpublishPage', () => {
  it('POST /api/cms/pages/{id}/unpublish', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    await unpublishPage(client, BASE, 'page-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1/unpublish`);
  });
});

describe('rollbackPage', () => {
  it('POST /api/cms/pages/{id}/rollback/{versionId} (204 NoContent)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ status: 204, data: undefined });

    await rollbackPage(client, BASE, 'page-1', 'v-1');

    expect(client.post).toHaveBeenCalledWith(`${BASE}/api/cms/pages/page-1/rollback/v-1`);
  });
});
