import {
  createFolder,
  moveFolder,
  renameFolder,
  restoreFolder,
  trashFolder,
} from '@granit/documents';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider.js';

import type { ResolvedDocumentsConfig } from '../providers/documents-provider.js';
import type {
  CreateFolderRequest,
  FolderResponse,
  MoveFolderRequest,
  RenameFolderRequest,
} from '@granit/documents';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

interface FolderIdMutationArgs<TRequest> {
  readonly id: string;
  readonly request: TRequest;
}

function invalidateFolderList(queryClient: QueryClient, config: ResolvedDocumentsConfig): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'folders', 'list'),
  });
}

function invalidateAllFolders(queryClient: QueryClient, config: ResolvedDocumentsConfig): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'folders'),
  });
}

function invalidateTrashedDocuments(
  queryClient: QueryClient,
  config: ResolvedDocumentsConfig
): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'documents', 'trash'),
  });
}

/** Create a folder. Invalidates the folder-list family. */
export function useCreateFolder(): UseMutationResult<FolderResponse, Error, CreateFolderRequest> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateFolderRequest) =>
      createFolder(config.client, config.basePath, request),
    onSuccess: () => {
      invalidateFolderList(queryClient, config);
    },
  });
}

/**
 * Rename a folder. Invalidates the entire folder namespace (list + detail +
 * breadcrumb share the prefix).
 */
export function useRenameFolder(): UseMutationResult<
  FolderResponse,
  Error,
  FolderIdMutationArgs<RenameFolderRequest>
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: FolderIdMutationArgs<RenameFolderRequest>) =>
      renameFolder(config.client, config.basePath, id, request),
    onSuccess: () => {
      invalidateAllFolders(queryClient, config);
    },
  });
}

/**
 * Move a folder. Multiple roots affected; broad invalidation of the folder
 * namespace (descendant breadcrumbs change too).
 */
export function useMoveFolder(): UseMutationResult<
  FolderResponse,
  Error,
  FolderIdMutationArgs<MoveFolderRequest>
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: FolderIdMutationArgs<MoveFolderRequest>) =>
      moveFolder(config.client, config.basePath, id, request),
    onSuccess: () => {
      invalidateAllFolders(queryClient, config);
    },
  });
}

/**
 * Soft-delete a folder. Cascade-trashes descendants — broad folder invalidation
 * plus the trashed-documents listing.
 */
export function useTrashFolder(): UseMutationResult<FolderResponse, Error, string> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trashFolder(config.client, config.basePath, id),
    onSuccess: () => {
      invalidateAllFolders(queryClient, config);
      invalidateTrashedDocuments(queryClient, config);
    },
  });
}

/**
 * Restore a trashed folder. Non-cascading on the backend, but the listing
 * (which may filter by status) and any cached detail need refresh.
 */
export function useRestoreFolder(): UseMutationResult<FolderResponse, Error, string> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreFolder(config.client, config.basePath, id),
    onSuccess: () => {
      invalidateAllFolders(queryClient, config);
      invalidateTrashedDocuments(queryClient, config);
    },
  });
}
