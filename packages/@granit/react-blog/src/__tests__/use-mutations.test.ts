import {
  addPostAttachment,
  cancelPostSchedule,
  createAuthor,
  createPost,
  deleteAuthor,
  deletePost,
  publishPost,
  removePostAttachment,
  reorderPostAttachments,
  saveDraftContent,
  schedulePost,
  unpublishPost,
  updateAuthor,
  updatePost,
  updatePostAttachment,
} from '@granit/blog';
import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockAuthors, mockPosts } from '@granit/react-blog/testing';

import { useCreateAuthor, useDeleteAuthor, useUpdateAuthor } from '../hooks/use-author-mutations';
import {
  useCancelPostSchedule,
  usePublishPost,
  useSchedulePost,
  useUnpublishPost,
} from '../hooks/use-post-lifecycle';
import {
  useAddPostAttachment,
  useCreatePost,
  useDeletePost,
  useRemovePostAttachment,
  useReorderPostAttachments,
  useSaveDraftContent,
  useUpdatePost,
  useUpdatePostAttachment,
} from '../hooks/use-post-mutations';

import { createWrapper } from './test-utils';

vi.mock('@granit/blog', () => ({
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  saveDraftContent: vi.fn(),
  addPostAttachment: vi.fn(),
  updatePostAttachment: vi.fn(),
  removePostAttachment: vi.fn(),
  reorderPostAttachments: vi.fn(),
  publishPost: vi.fn(),
  unpublishPost: vi.fn(),
  schedulePost: vi.fn(),
  cancelPostSchedule: vi.fn(),
  createAuthor: vi.fn(),
  updateAuthor: vi.fn(),
  deleteAuthor: vi.fn(),
}));

const post = mockPosts[0]!;
const author = mockAuthors[0]!;
const publication = { postId: post.id, siteId: post.siteId };

afterEach(() => vi.clearAllMocks());

describe('post mutations', () => {
  it('creates a post', async () => {
    const client = createMockClient();
    vi.mocked(createPost).mockResolvedValue(post);
    const { result } = renderHook(() => useCreatePost(), { wrapper: createWrapper(client) });

    await result.current.mutateAsync({
      siteId: post.siteId,
      request: { slug: 'x', authorId: 'a' },
    });

    expect(createPost).toHaveBeenCalledWith(client, '/api/blog', post.siteId, {
      slug: 'x',
      authorId: 'a',
    });
  });

  it('updates a post', async () => {
    const client = createMockClient();
    vi.mocked(updatePost).mockResolvedValue(post);
    const { result } = renderHook(() => useUpdatePost(), { wrapper: createWrapper(client) });

    await result.current.mutateAsync({
      id: post.id,
      request: { slug: 'x', authorId: 'a', concurrencyStamp: 's' },
    });

    expect(updatePost).toHaveBeenCalled();
  });

  it('deletes a post', async () => {
    const client = createMockClient();
    vi.mocked(deletePost).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeletePost(), { wrapper: createWrapper(client) });

    await result.current.mutateAsync({ id: post.id });
    expect(deletePost).toHaveBeenCalledWith(client, '/api/blog', post.id);
  });

  it('saves a draft', async () => {
    const client = createMockClient();
    vi.mocked(saveDraftContent).mockResolvedValue({ versionId: 'v1' });
    const { result } = renderHook(() => useSaveDraftContent(), { wrapper: createWrapper(client) });

    await result.current.mutateAsync({
      id: post.id,
      request: { culture: 'en', contentJson: '{}', title: 'T' },
    });
    expect(saveDraftContent).toHaveBeenCalled();
  });

  it('adds, updates, removes and reorders attachments', async () => {
    const client = createMockClient();
    vi.mocked(addPostAttachment).mockResolvedValue(post);
    vi.mocked(updatePostAttachment).mockResolvedValue(post);
    vi.mocked(removePostAttachment).mockResolvedValue(post);
    vi.mocked(reorderPostAttachments).mockResolvedValue(post);

    const add = renderHook(() => useAddPostAttachment(), { wrapper: createWrapper(client) });
    await add.result.current.mutateAsync({ id: post.id, request: { documentId: 'd' } });
    expect(addPostAttachment).toHaveBeenCalled();

    const upd = renderHook(() => useUpdatePostAttachment(), { wrapper: createWrapper(client) });
    await upd.result.current.mutateAsync({
      id: post.id,
      documentId: 'd',
      request: { altText: 'a' },
    });
    expect(updatePostAttachment).toHaveBeenCalled();

    const rem = renderHook(() => useRemovePostAttachment(), { wrapper: createWrapper(client) });
    await rem.result.current.mutateAsync({ id: post.id, documentId: 'd' });
    expect(removePostAttachment).toHaveBeenCalled();

    const reo = renderHook(() => useReorderPostAttachments(), { wrapper: createWrapper(client) });
    await reo.result.current.mutateAsync({ id: post.id, request: { documentIdsInOrder: ['d'] } });
    expect(reorderPostAttachments).toHaveBeenCalled();
  });
});

describe('lifecycle mutations', () => {
  it('publishes, unpublishes, schedules and cancels', async () => {
    const client = createMockClient();
    vi.mocked(publishPost).mockResolvedValue(publication);
    vi.mocked(unpublishPost).mockResolvedValue(publication);
    vi.mocked(schedulePost).mockResolvedValue(undefined);
    vi.mocked(cancelPostSchedule).mockResolvedValue(undefined);

    const pub = renderHook(() => usePublishPost(), { wrapper: createWrapper(client) });
    await pub.result.current.mutateAsync(post.id);
    expect(publishPost).toHaveBeenCalledWith(client, '/api/blog', post.id);

    const unpub = renderHook(() => useUnpublishPost(), { wrapper: createWrapper(client) });
    await unpub.result.current.mutateAsync(post.id);
    expect(unpublishPost).toHaveBeenCalled();

    const sch = renderHook(() => useSchedulePost(), { wrapper: createWrapper(client) });
    await sch.result.current.mutateAsync({
      id: post.id,
      request: { localDateTime: '2026-08-01T09:00:00', timeZoneId: 'Europe/Brussels' },
    });
    expect(schedulePost).toHaveBeenCalled();

    const cancel = renderHook(() => useCancelPostSchedule(), { wrapper: createWrapper(client) });
    await cancel.result.current.mutateAsync(post.id);
    expect(cancelPostSchedule).toHaveBeenCalledWith(client, '/api/blog', post.id);
  });
});

describe('author mutations', () => {
  it('creates, updates and deletes authors', async () => {
    const client = createMockClient();
    vi.mocked(createAuthor).mockResolvedValue(author);
    vi.mocked(updateAuthor).mockResolvedValue(author);
    vi.mocked(deleteAuthor).mockResolvedValue(undefined);

    const create = renderHook(() => useCreateAuthor(), { wrapper: createWrapper(client) });
    await create.result.current.mutateAsync({
      siteId: author.siteId,
      request: { userId: 'u', displayName: 'N' },
    });
    expect(createAuthor).toHaveBeenCalled();

    const update = renderHook(() => useUpdateAuthor(), { wrapper: createWrapper(client) });
    await update.result.current.mutateAsync({ id: author.id, request: { displayName: 'N2' } });
    expect(updateAuthor).toHaveBeenCalled();

    const del = renderHook(() => useDeleteAuthor(), { wrapper: createWrapper(client) });
    await del.result.current.mutateAsync({ id: author.id, siteId: author.siteId });
    expect(deleteAuthor).toHaveBeenCalledWith(client, '/api/blog', author.id);
  });
});
