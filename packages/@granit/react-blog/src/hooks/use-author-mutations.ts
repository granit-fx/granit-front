'use client';

import { createAuthor, deleteAuthor, updateAuthor } from '@granit/blog';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useBlogConfig } from '../providers/blog-provider';

import { blogKeys } from './query-keys';

import type {
  BlogAuthorProfileCreateRequest,
  BlogAuthorProfileResponse,
  BlogAuthorProfileUpdateRequest,
} from '@granit/blog';
import type { UseMutationResult } from '@tanstack/react-query';

export function useCreateAuthor(): UseMutationResult<
  BlogAuthorProfileResponse,
  Error,
  { siteId: string; request: BlogAuthorProfileCreateRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, request }) => createAuthor(client, basePath, siteId, request),
    onSuccess: (data) => {
      qc.setQueryData(blogKeys.authors.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: blogKeys.authors.list(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useUpdateAuthor(): UseMutationResult<
  BlogAuthorProfileResponse,
  Error,
  { id: string; request: BlogAuthorProfileUpdateRequest }
> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updateAuthor(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(blogKeys.authors.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: blogKeys.authors.list(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useDeleteAuthor(): UseMutationResult<void, Error, { id: string; siteId: string }> {
  const { client, basePath, queryKeyPrefix } = useBlogConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteAuthor(client, basePath, id),
    onSuccess: (_data, { id, siteId }) => {
      qc.removeQueries({ queryKey: blogKeys.authors.detail(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: blogKeys.authors.list(queryKeyPrefix, siteId) });
    },
  });
}
