import { listDocumentRenditions, requestRenditionDownloadUrl } from '@granit/documents';
import { useQuery } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider';

import type {
  ListRenditionsResponse,
  RenditionDownloadUrlResponse,
  RenditionType,
} from '@granit/documents';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * List all renditions for the current version of a document. Disabled when
 * `id` is empty.
 */
export function useDocumentRenditions(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<ListRenditionsResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', id, 'renditions'),
    queryFn: () => listDocumentRenditions(config.client, config.basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

/**
 * Get a presigned download URL for a specific rendition type. The URL is
 * short-lived — use `staleTime: Infinity` + manual `refetch()` on demand
 * rather than auto-refetching. Disabled when `id` is empty.
 */
export function useRenditionDownloadUrl(
  id: string,
  type: RenditionType,
  options?: { readonly enabled?: boolean }
): UseQueryResult<RenditionDownloadUrlResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', id, 'renditions', type, 'download'),
    queryFn: () => requestRenditionDownloadUrl(config.client, config.basePath, id, type),
    enabled: (options?.enabled ?? true) && id.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
