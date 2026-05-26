import {
  appendDocumentVersion,
  finalizeUpload,
  moveDocument,
  permanentlyDeleteDocument,
  renameDocument,
  requestUploadTicket,
  restoreDocument,
  transferDocumentOwner,
  trashDocument,
} from '@granit/documents';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider.js';

import type { ResolvedDocumentsConfig } from '../providers/documents-provider.js';
import type {
  AppendVersionRequest,
  DocumentResponse,
  DocumentVersionResponse,
  FinalizeUploadRequest,
  MoveDocumentRequest,
  RenameDocumentRequest,
  TransferOwnerRequest,
  UploadTicketRequest,
  UploadTicketResponse,
} from '@granit/documents';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

interface DocumentIdMutationArgs<TRequest> {
  readonly id: string;
  readonly request: TRequest;
}

function invalidateAllDocuments(queryClient: QueryClient, config: ResolvedDocumentsConfig): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'documents'),
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

function invalidateAllFolders(queryClient: QueryClient, config: ResolvedDocumentsConfig): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'folders'),
  });
}

function invalidateQuota(queryClient: QueryClient, config: ResolvedDocumentsConfig): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'quota'),
  });
}

function invalidateDocumentDetail(
  queryClient: QueryClient,
  config: ResolvedDocumentsConfig,
  id: string
): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'documents', id),
  });
}

function invalidateDocumentVersions(
  queryClient: QueryClient,
  config: ResolvedDocumentsConfig,
  id: string
): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'documents', id, 'versions'),
  });
}

/**
 * Issue a presigned upload ticket. No invalidation — the side effect is the
 * subsequent {@link useFinalizeUpload} call.
 */
export function useRequestUploadTicket(): UseMutationResult<
  UploadTicketResponse,
  Error,
  UploadTicketRequest
> {
  const config = useDocumentsConfig();
  return useMutation({
    mutationFn: (request: UploadTicketRequest) =>
      requestUploadTicket(config.client, config.basePath, request),
  });
}

/**
 * Finalise an upload — creates the Document + initial version. Folder content
 * and tenant quota both change.
 */
export function useFinalizeUpload(): UseMutationResult<
  DocumentResponse,
  Error,
  FinalizeUploadRequest
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: FinalizeUploadRequest) =>
      finalizeUpload(config.client, config.basePath, request),
    onSuccess: () => {
      invalidateAllFolders(queryClient, config);
      invalidateQuota(queryClient, config);
    },
  });
}

/** Rename or update a document's description. Invalidates the document namespace. */
export function useRenameDocument(): UseMutationResult<
  DocumentResponse,
  Error,
  DocumentIdMutationArgs<RenameDocumentRequest>
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: DocumentIdMutationArgs<RenameDocumentRequest>) =>
      renameDocument(config.client, config.basePath, id, request),
    onSuccess: () => {
      invalidateAllDocuments(queryClient, config);
    },
  });
}

/** Move a document under another folder. */
export function useMoveDocument(): UseMutationResult<
  DocumentResponse,
  Error,
  DocumentIdMutationArgs<MoveDocumentRequest>
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: DocumentIdMutationArgs<MoveDocumentRequest>) =>
      moveDocument(config.client, config.basePath, id, request),
    onSuccess: () => {
      invalidateAllDocuments(queryClient, config);
    },
  });
}

/**
 * Transfer ownership of a document. The wire response carries the new
 * `ownerId`, so we invalidate the documents namespace to refresh any list /
 * detail bound to the old value.
 */
export function useTransferDocumentOwner(): UseMutationResult<
  DocumentResponse,
  Error,
  DocumentIdMutationArgs<TransferOwnerRequest>
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: DocumentIdMutationArgs<TransferOwnerRequest>) =>
      transferDocumentOwner(config.client, config.basePath, id, request),
    onSuccess: () => {
      invalidateAllDocuments(queryClient, config);
    },
  });
}

/** Soft-delete a document. Affects trash listing + quota (quota only on permanent delete, but invalidate broadly). */
export function useTrashDocument(): UseMutationResult<DocumentResponse, Error, string> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trashDocument(config.client, config.basePath, id),
    onSuccess: () => {
      invalidateAllDocuments(queryClient, config);
      invalidateTrashedDocuments(queryClient, config);
      invalidateQuota(queryClient, config);
    },
  });
}

/** Restore a trashed document. */
export function useRestoreDocument(): UseMutationResult<DocumentResponse, Error, string> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreDocument(config.client, config.basePath, id),
    onSuccess: () => {
      invalidateAllDocuments(queryClient, config);
      invalidateTrashedDocuments(queryClient, config);
      invalidateQuota(queryClient, config);
    },
  });
}

/** Permanently delete a trashed document. Releases tenant quota. */
export function usePermanentlyDeleteDocument(): UseMutationResult<void, Error, string> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => permanentlyDeleteDocument(config.client, config.basePath, id),
    onSuccess: () => {
      invalidateAllDocuments(queryClient, config);
      invalidateTrashedDocuments(queryClient, config);
      invalidateQuota(queryClient, config);
    },
  });
}

/**
 * Append a version. Invalidates the version list, the document detail
 * (currentVersionId changes), and the tenant quota.
 */
export function useAppendDocumentVersion(): UseMutationResult<
  DocumentVersionResponse,
  Error,
  DocumentIdMutationArgs<AppendVersionRequest>
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: DocumentIdMutationArgs<AppendVersionRequest>) =>
      appendDocumentVersion(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      invalidateDocumentVersions(queryClient, config, id);
      invalidateDocumentDetail(queryClient, config, id);
      invalidateQuota(queryClient, config);
    },
  });
}
