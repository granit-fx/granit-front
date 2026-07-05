'use client';

import { cancelPostSchedule, publishPost, schedulePost, unpublishPost } from '@granit/blog';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBlogConfig } from '../providers/blog-provider';

import { blogKeys } from './query-keys';

import type { BlogPostPublicationResponse, BlogPostScheduleRequest } from '@granit/blog';
import type { UseMutationResult } from '@tanstack/react-query';

/** Invalidate the affected post detail + grid after a lifecycle transition. */
function useLifecycleInvalidation(): (postId: string) => void {
  const { queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return (postId: string) => {
    qc.invalidateQueries({ queryKey: blogKeys.posts.detail(queryKeyPrefix, postId) });
    qc.invalidateQueries({ queryKey: blogKeys.posts.grid(queryKeyPrefix) });
    qc.invalidateQueries({ queryKey: blogKeys.publicPosts.all(queryKeyPrefix) });
  };
}

export function usePublishPost(): UseMutationResult<BlogPostPublicationResponse, Error, string> {
  const { client, basePath } = useBlogConfig();
  const invalidate = useLifecycleInvalidation();
  return useMutation({
    mutationFn: (id: string) => publishPost(client, basePath, id),
    onSuccess: (data) => invalidate(data.postId),
  });
}

export function useUnpublishPost(): UseMutationResult<BlogPostPublicationResponse, Error, string> {
  const { client, basePath } = useBlogConfig();
  const invalidate = useLifecycleInvalidation();
  return useMutation({
    mutationFn: (id: string) => unpublishPost(client, basePath, id),
    onSuccess: (data) => invalidate(data.postId),
  });
}

export function useSchedulePost(): UseMutationResult<
  void,
  Error,
  { id: string; request: BlogPostScheduleRequest }
> {
  const { client, basePath } = useBlogConfig();
  const invalidate = useLifecycleInvalidation();
  return useMutation({
    mutationFn: ({ id, request }) => schedulePost(client, basePath, id, request),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

export function useCancelPostSchedule(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useBlogConfig();
  const invalidate = useLifecycleInvalidation();
  return useMutation({
    mutationFn: (id: string) => cancelPostSchedule(client, basePath, id),
    onSuccess: (_data, id) => invalidate(id),
  });
}
