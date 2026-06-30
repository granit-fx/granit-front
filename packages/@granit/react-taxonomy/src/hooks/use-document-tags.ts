import { attachTagToDocument, detachTagFromDocument, listDocumentTags } from '@granit/taxonomy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logMutationError } from '../logger';
import { buildTaxonomyQueryKey, useTaxonomyConfig } from '../providers/taxonomy-provider';

import type { TagResponse } from '@granit/taxonomy';
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/**
 * Documents-proxy basePath. The proxy URL pattern is
 * `/api/v1/documents/{id}/tags` — it sits *above* the `/api/v1/taxonomy`
 * surface configured on the provider. Callers pass it explicitly because
 * `<DocumentTagChipStrip>` is the only component that uses these endpoints
 * and the host knows the canonical Documents API base.
 */
export interface DocumentTagsBindings {
  readonly basePath: string;
  readonly documentId: string;
}

function invalidateDocumentTags(queryClient: QueryClient, queryKey: readonly unknown[]): void {
  queryClient.invalidateQueries({ queryKey });
}

/**
 * List the tags currently attached to a document via the proxy endpoint.
 * Disabled when `documentId` is empty.
 */
export function useDocumentTags(
  bindings: DocumentTagsBindings
): UseQueryResult<readonly TagResponse[]> {
  const config = useTaxonomyConfig();
  const queryKey = buildTaxonomyQueryKey(config, 'document-tags', bindings);

  return useQuery({
    queryKey,
    queryFn: () => listDocumentTags(config.client, bindings.basePath, bindings.documentId),
    enabled: bindings.documentId.length > 0,
  });
}

/**
 * Attach an existing tag to a document. Invalidates only the impacted
 * document's tag list — sibling documents keep their cached state.
 */
export function useAttachTagToDocument(
  bindings: DocumentTagsBindings
): UseMutationResult<void, Error, string> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();
  const queryKey = buildTaxonomyQueryKey(config, 'document-tags', bindings);

  return useMutation({
    mutationFn: (tagId: string) =>
      attachTagToDocument(config.client, bindings.basePath, bindings.documentId, tagId),
    onSuccess: () => {
      invalidateDocumentTags(queryClient, queryKey);
    },
    onError: (error) => logMutationError('attachTagToDocument', error),
  });
}

/**
 * Detach a tag from a document. Invalidates only the impacted document.
 */
export function useDetachTagFromDocument(
  bindings: DocumentTagsBindings
): UseMutationResult<void, Error, string> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();
  const queryKey = buildTaxonomyQueryKey(config, 'document-tags', bindings);

  return useMutation({
    mutationFn: (tagId: string) =>
      detachTagFromDocument(config.client, bindings.basePath, bindings.documentId, tagId),
    onSuccess: () => {
      invalidateDocumentTags(queryClient, queryKey);
    },
    onError: (error) => logMutationError('detachTagFromDocument', error),
  });
}
