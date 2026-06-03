'use client';

import {
  createPage,
  deletePage,
  movePage,
  publishPage,
  rollbackPage,
  saveDraft,
  unpublishPage,
  updatePage,
  updatePageTranslation,
} from '@granit/cms';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type {
  CreatePageRequest,
  MovePageRequest,
  PageResponse,
  PageVersionSummaryResponse,
  SaveDraftRequest,
  UpdatePageRequest,
  UpdatePageTranslationRequest,
} from '@granit/cms';
import type { SaveDraftResult } from '@granit/cms';
import type { UseMutationResult } from '@tanstack/react-query';

export function useCreatePage(): UseMutationResult<PageResponse, Error, CreatePageRequest> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => createPage(client, basePath, req),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.tree(queryKeyPrefix, data.siteId) });
      qc.invalidateQueries({ queryKey: cmsKeys.pages.all(queryKeyPrefix) });
    },
  });
}

export function useUpdatePage(): UseMutationResult<
  PageResponse,
  Error,
  { id: string; request: UpdatePageRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updatePage(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.pages.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsKeys.pages.tree(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useUpdatePageTranslation(): UseMutationResult<
  PageResponse,
  Error,
  { id: string; culture: string; request: UpdatePageTranslationRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, culture, request }) =>
      updatePageTranslation(client, basePath, id, culture, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.pages.detail(queryKeyPrefix, data.id), data);
    },
  });
}

export function useMovePage(): UseMutationResult<
  void,
  Error,
  { id: string; request: MovePageRequest; siteId: string }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => movePage(client, basePath, id, request),
    onSuccess: (_data, { siteId }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.tree(queryKeyPrefix, siteId) });
    },
  });
}

export function useDeletePage(): UseMutationResult<void, Error, { id: string; siteId: string }> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deletePage(client, basePath, id),
    onSuccess: (_data, { id, siteId }) => {
      qc.removeQueries({ queryKey: cmsKeys.pages.detail(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: cmsKeys.pages.tree(queryKeyPrefix, siteId) });
    },
  });
}

export function useSaveDraft(): UseMutationResult<
  SaveDraftResult,
  Error,
  { id: string; culture: string; request: SaveDraftRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, culture, request }) => saveDraft(client, basePath, id, culture, request),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.versions(queryKeyPrefix, id) });
    },
  });
}

export function usePublishPage(): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => publishPage(client, basePath, id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.versions(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: cmsKeys.pages.detail(queryKeyPrefix, id) });
    },
  });
}

export function useUnpublishPage(): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => unpublishPage(client, basePath, id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.versions(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: cmsKeys.pages.detail(queryKeyPrefix, id) });
    },
  });
}

export function useRollbackPage(): UseMutationResult<
  PageVersionSummaryResponse,
  Error,
  { id: string; versionId: string }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, versionId }) => rollbackPage(client, basePath, id, versionId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.pages.versions(queryKeyPrefix, id) });
    },
  });
}
