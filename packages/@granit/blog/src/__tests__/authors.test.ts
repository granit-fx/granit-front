import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import { createAuthor, deleteAuthor, getAuthor, listAuthors, updateAuthor } from '../api/authors';

import type { BlogAuthorProfileResponse } from '../types/index';

const BASE = 'https://blog.example.com/api/blog';

const author: BlogAuthorProfileResponse = {
  id: 'author-1',
  siteId: 'site-1',
  userId: 'user-1',
  displayName: 'Ada Lovelace',
  bio: null,
  avatarDocumentId: null,
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

describe('listAuthors', () => {
  it('GET /sites/{siteId}/authors returning a bare array', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([author]));

    const result = await listAuthors(client, BASE, 'site-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/sites/site-1/authors`, undefined);
    expect(result).toEqual([author]);
  });

  it('forwards an abort signal', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));
    const controller = new AbortController();

    await listAuthors(client, BASE, 'site-1', { signal: controller.signal });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/sites/site-1/authors`, {
      signal: controller.signal,
    });
  });
});

describe('getAuthor', () => {
  it('GET /authors/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(author));

    await getAuthor(client, BASE, 'author-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/authors/author-1`);
  });
});

describe('createAuthor', () => {
  it('POST /sites/{siteId}/authors', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(author));

    const request = { userId: 'user-1', displayName: 'Ada Lovelace' };
    await createAuthor(client, BASE, 'site-1', request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/sites/site-1/authors`, request);
  });
});

describe('updateAuthor', () => {
  it('PUT /authors/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(author));

    const request = { displayName: 'Ada L.' };
    await updateAuthor(client, BASE, 'author-1', request);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/authors/author-1`, request);
  });
});

describe('deleteAuthor', () => {
  it('DELETE /authors/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deleteAuthor(client, BASE, 'author-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/authors/author-1`);
  });
});
