import { axiosResponse, createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  addPostAttachment,
  createPost,
  deletePost,
  getPost,
  removePostAttachment,
  reorderPostAttachments,
  saveDraftContent,
  updatePost,
  updatePostAttachment,
} from '../api/posts-admin';

import type { BlogPostResponse } from '../types/index';

const BASE = 'https://blog.example.com/api/blog';

const post: BlogPostResponse = {
  id: 'post-1',
  siteId: 'site-1',
  slug: 'hello-world',
  authorId: 'author-1',
  coverImageDocumentId: null,
  scheduledAtUtc: null,
  attachments: [],
  concurrencyStamp: 'stamp-1',
  createdAt: toISODateString('2026-01-01T00:00:00Z'),
  modifiedAt: null,
};

describe('createPost', () => {
  it('POST /sites/{siteId}/posts', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(post));

    const request = { slug: 'hello-world', authorId: 'author-1' };
    const result = await createPost(client, BASE, 'site-1', request);

    expect(client.post).toHaveBeenCalledWith(`${BASE}/sites/site-1/posts`, request);
    expect(result).toEqual(post);
  });
});

describe('getPost', () => {
  it('GET /posts/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(post));

    const result = await getPost(client, BASE, 'post-1');

    expect(client.get).toHaveBeenCalledWith(`${BASE}/posts/post-1`);
    expect(result).toEqual(post);
  });
});

describe('updatePost', () => {
  it('PUT /posts/{id} echoing the concurrency stamp', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(post));

    const request = { slug: 'hello-world', authorId: 'author-1', concurrencyStamp: 'stamp-1' };
    await updatePost(client, BASE, 'post-1', request);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/posts/post-1`, request);
  });
});

describe('deletePost', () => {
  it('DELETE /posts/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204, data: undefined });

    await deletePost(client, BASE, 'post-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/posts/post-1`);
  });
});

describe('saveDraftContent', () => {
  it('PUT /posts/{id}/content returning the version id', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse({ versionId: 'ver-1' }));

    const request = {
      culture: 'en',
      contentJson: '{"content":[],"root":{}}',
      title: 'Hello',
      summary: null,
      concurrencyStamp: 'stamp-1',
    };
    const result = await saveDraftContent(client, BASE, 'post-1', request);

    expect(client.put).toHaveBeenCalledWith(`${BASE}/posts/post-1/content`, request);
    expect(result).toEqual({ versionId: 'ver-1' });
  });
});

describe('attachments', () => {
  it('POST /posts/{id}/attachments', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(post));

    await addPostAttachment(client, BASE, 'post-1', { documentId: 'doc-1', caption: 'A' });

    expect(client.post).toHaveBeenCalledWith(`${BASE}/posts/post-1/attachments`, {
      documentId: 'doc-1',
      caption: 'A',
    });
  });

  it('PATCH /posts/{id}/attachments/{documentId}', async () => {
    const client = createMockClient();
    vi.mocked(client.patch).mockResolvedValue(axiosResponse(post));

    await updatePostAttachment(client, BASE, 'post-1', 'doc-1', { altText: 'alt' });

    expect(client.patch).toHaveBeenCalledWith(`${BASE}/posts/post-1/attachments/doc-1`, {
      altText: 'alt',
    });
  });

  it('DELETE /posts/{id}/attachments/{documentId}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(post));

    await removePostAttachment(client, BASE, 'post-1', 'doc-1');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/posts/post-1/attachments/doc-1`);
  });

  it('PUT /posts/{id}/attachments/order', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(post));

    await reorderPostAttachments(client, BASE, 'post-1', {
      documentIdsInOrder: ['doc-2', 'doc-1'],
    });

    expect(client.put).toHaveBeenCalledWith(`${BASE}/posts/post-1/attachments/order`, {
      documentIdsInOrder: ['doc-2', 'doc-1'],
    });
  });
});
