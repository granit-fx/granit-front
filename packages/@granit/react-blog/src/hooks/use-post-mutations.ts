'use client';

import {
  addPostAttachment,
  createPost,
  deletePost,
  removePostAttachment,
  reorderPostAttachments,
  saveDraftContent,
  updatePost,
  updatePostAttachment,
} from '@granit/blog';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBlogConfig } from '../providers/blog-provider';

import { blogKeys } from './query-keys';

import type {
  BlogPostAddAttachmentRequest,
  BlogPostCreateRequest,
  BlogPostDraftContentRequest,
  BlogPostDraftContentResponse,
  BlogPostReorderAttachmentsRequest,
  BlogPostResponse,
  BlogPostUpdateAttachmentRequest,
  BlogPostUpdateRequest,
} from '@granit/blog';
import type { UseMutationResult } from '@tanstack/react-query';

export function useCreatePost(): UseMutationResult<
  BlogPostResponse,
  Error,
  { siteId: string; request: BlogPostCreateRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, request }) => createPost(client, basePath, siteId, request),
    onSuccess: (data) => {
      qc.setQueryData(blogKeys.posts.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: blogKeys.posts.all(queryKeyPrefix) });
    },
  });
}

export function useUpdatePost(): UseMutationResult<
  BlogPostResponse,
  Error,
  { id: string; request: BlogPostUpdateRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updatePost(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(blogKeys.posts.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: blogKeys.posts.grid(queryKeyPrefix) });
    },
  });
}

export function useDeletePost(): UseMutationResult<void, Error, { id: string }> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deletePost(client, basePath, id),
    onSuccess: (_data, { id }) => {
      qc.removeQueries({ queryKey: blogKeys.posts.detail(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: blogKeys.posts.all(queryKeyPrefix) });
    },
  });
}

/**
 * Saves a per-culture draft. Rejects with a 409 on `DraftConcurrency` / `StalePost`
 * — surface that as a reload prompt (see `extractBlogConflict`).
 */
export function useSaveDraftContent(): UseMutationResult<
  BlogPostDraftContentResponse,
  Error,
  { id: string; request: BlogPostDraftContentRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => saveDraftContent(client, basePath, id, request),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: blogKeys.posts.detail(queryKeyPrefix, id) });
    },
  });
}

export function useAddPostAttachment(): UseMutationResult<
  BlogPostResponse,
  Error,
  { id: string; request: BlogPostAddAttachmentRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => addPostAttachment(client, basePath, id, request),
    onSuccess: (data) => qc.setQueryData(blogKeys.posts.detail(queryKeyPrefix, data.id), data),
  });
}

export function useUpdatePostAttachment(): UseMutationResult<
  BlogPostResponse,
  Error,
  { id: string; documentId: string; request: BlogPostUpdateAttachmentRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documentId, request }) =>
      updatePostAttachment(client, basePath, id, documentId, request),
    onSuccess: (data) => qc.setQueryData(blogKeys.posts.detail(queryKeyPrefix, data.id), data),
  });
}

export function useRemovePostAttachment(): UseMutationResult<
  BlogPostResponse,
  Error,
  { id: string; documentId: string }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documentId }) => removePostAttachment(client, basePath, id, documentId),
    onSuccess: (data) => qc.setQueryData(blogKeys.posts.detail(queryKeyPrefix, data.id), data),
  });
}

export function useReorderPostAttachments(): UseMutationResult<
  BlogPostResponse,
  Error,
  { id: string; request: BlogPostReorderAttachmentsRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => reorderPostAttachments(client, basePath, id, request),
    onSuccess: (data) => qc.setQueryData(blogKeys.posts.detail(queryKeyPrefix, data.id), data),
  });
}
