import { batchResolveDocumentAssets } from '@granit/documents';
import { useMutation } from '@tanstack/react-query';

import { useDocumentsConfig } from '../providers/documents-provider';

import type { BatchResolveRequest, ResolvedDocumentResponse } from '@granit/documents';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Resolve a batch of document assets to presigned CDN URLs. Each item may
 * target a specific version and/or rendition type; unresolvable items are
 * silently omitted from the response array.
 *
 * Primarily used by the CMS renderer to embed document assets. Results are
 * short-lived (CDN URLs expire), so no query caching is applied.
 */
export function useBatchResolveDocumentAssets(): UseMutationResult<
  readonly ResolvedDocumentResponse[],
  Error,
  BatchResolveRequest
> {
  const config = useDocumentsConfig();

  return useMutation({
    mutationFn: (request: BatchResolveRequest) =>
      batchResolveDocumentAssets(config.client, config.basePath, request),
  });
}
