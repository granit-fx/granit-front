import { assignDocumentTag, listDocumentTags, unassignDocumentTag } from '@granit/documents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider.js';

import type { ResolvedDocumentsConfig } from '../providers/documents-provider.js';
import type { DocumentTagAssignmentResponse, ListDocumentTagsResponse } from '@granit/documents';
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';

function invalidateDocumentTags(
  queryClient: QueryClient,
  config: ResolvedDocumentsConfig,
  documentId: string
): void {
  queryClient.invalidateQueries({
    queryKey: buildDocumentsQueryKey(config, 'documents', documentId, 'tags'),
  });
}

/**
 * List the tags currently attached to a document via the Documents proxy
 * endpoint. Disabled when `documentId` is empty.
 */
export function useDocumentTagsList(
  documentId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<ListDocumentTagsResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', documentId, 'tags'),
    queryFn: () => listDocumentTags(config.client, config.basePath, documentId),
    enabled: (options?.enabled ?? true) && documentId.length > 0,
  });
}

interface DocumentTagMutationArgs {
  readonly documentId: string;
  readonly tagId: string;
}

/** Attach a tag to a document (idempotent). */
export function useAssignDocumentTag(): UseMutationResult<
  DocumentTagAssignmentResponse,
  Error,
  DocumentTagMutationArgs
> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, tagId }: DocumentTagMutationArgs) =>
      assignDocumentTag(config.client, config.basePath, documentId, tagId),
    onSuccess: (_data, { documentId }) => {
      invalidateDocumentTags(queryClient, config, documentId);
    },
  });
}

/** Detach a tag from a document. */
export function useUnassignDocumentTag(): UseMutationResult<void, Error, DocumentTagMutationArgs> {
  const config = useDocumentsConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, tagId }: DocumentTagMutationArgs) =>
      unassignDocumentTag(config.client, config.basePath, documentId, tagId),
    onSuccess: (_data, { documentId }) => {
      invalidateDocumentTags(queryClient, config, documentId);
    },
  });
}
