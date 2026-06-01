import { listDocumentShares, listFolderShares } from '@granit/documents';
import { useQuery } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider';

import type { ListSharesResponse } from '@granit/documents';
import type { UseQueryResult } from '@tanstack/react-query';

/** List active share grants attached directly to a folder. */
export function useFolderShares(
  folderId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<ListSharesResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'shares', 'folder', folderId),
    queryFn: () => listFolderShares(config.client, config.basePath, folderId),
    enabled: (options?.enabled ?? true) && folderId.length > 0,
  });
}

/** List active share grants attached directly to a document. */
export function useDocumentShares(
  documentId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<ListSharesResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'shares', 'document', documentId),
    queryFn: () => listDocumentShares(config.client, config.basePath, documentId),
    enabled: (options?.enabled ?? true) && documentId.length > 0,
  });
}
