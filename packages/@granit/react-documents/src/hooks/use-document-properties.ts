import { getDocumentProperties, getDocumentVersionProperties } from '@granit/documents';
import { useQuery } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider';

import type { DocumentPropertiesResponse } from '@granit/documents';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Get the extracted metadata for the current version of a document. Returns
 * `undefined` while the background extractor has not finished (`status:
 * 'Pending'` or `'Extracting'`). Disabled when `id` is empty.
 */
export function useDocumentProperties(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<DocumentPropertiesResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', id, 'metadata'),
    queryFn: () => getDocumentProperties(config.client, config.basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

/**
 * Get the extracted metadata for a specific version of a document. Disabled
 * when either `id` or `versionId` is empty.
 */
export function useDocumentVersionProperties(
  id: string,
  versionId: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<DocumentPropertiesResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', id, 'versions', versionId, 'metadata'),
    queryFn: () => getDocumentVersionProperties(config.client, config.basePath, id, versionId),
    enabled: (options?.enabled ?? true) && id.length > 0 && versionId.length > 0,
  });
}
