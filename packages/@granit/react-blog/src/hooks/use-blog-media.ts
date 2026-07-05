'use client';

import { batchResolveDocumentAssets } from '@granit/documents';
import { useDocumentsConfig } from '@granit/react-documents';
import { useQuery } from '@tanstack/react-query';

import type { RenditionType, ResolvedDocumentResponse } from '@granit/documents';
import type { UseQueryResult } from '@tanstack/react-query';

/** Map of document id → resolved asset (URL, dimensions, mime). */
export type ResolvedDocumentMap = ReadonlyMap<string, ResolvedDocumentResponse>;

/**
 * Resolves a set of Document ids to render-ready assets (presigned URLs) in a
 * single round-trip, via `@granit/documents`. Blog responses carry ids
 * (`coverImageDocumentId`, `attachmentDocumentIds`, author `avatarDocumentId`),
 * not URLs — mirror how the CMS renderer resolves image blocks.
 *
 * Requires a `DocumentsProvider` in the tree. Presigned URLs are short-lived, so
 * the cache is kept modest (5 min).
 */
export function useResolvedDocuments(
  documentIds: readonly string[],
  renditionType?: RenditionType,
  options?: { readonly enabled?: boolean }
): UseQueryResult<ResolvedDocumentMap> {
  const { client, basePath } = useDocumentsConfig();
  const ids = documentIds.filter((id) => id.length > 0);
  return useQuery({
    queryKey: ['blog', 'documents', 'resolved', renditionType ?? 'original', ids] as const,
    queryFn: async () => {
      if (ids.length === 0) return new Map<string, ResolvedDocumentResponse>();
      const resolved = await batchResolveDocumentAssets(client, basePath, {
        requests: ids.map((documentId) => ({
          documentId,
          ...(renditionType ? { renditionType } : {}),
        })),
      });
      return new Map<string, ResolvedDocumentResponse>(
        resolved.map((asset) => [asset.documentId, asset])
      );
    },
    enabled: (options?.enabled ?? true) && ids.length > 0,
    staleTime: 5 * 60_000,
  });
}
