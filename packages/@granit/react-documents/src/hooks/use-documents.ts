import {
  getDocument,
  listDocumentVersions,
  listTrashedDocuments,
  requestDocumentDownloadUrl,
} from '@granit/documents';
import { useQuery } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider';

import type {
  DocumentResponse,
  DownloadUrlResponse,
  ListDocumentVersionsResponse,
  ListTrashedDocumentsResponse,
  PageFilter,
} from '@granit/documents';
import type { UseQueryResult } from '@tanstack/react-query';

/** Get a document. Disabled when `id` is empty. */
export function useDocument(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<DocumentResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', id),
    queryFn: () => getDocument(config.client, config.basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

/**
 * List the version history (latest first). Server caps `take` at 200.
 * Disabled when `id` is empty.
 */
export function useDocumentVersions(
  id: string,
  page: PageFilter = {},
  options?: { readonly enabled?: boolean }
): UseQueryResult<ListDocumentVersionsResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', id, 'versions', page),
    queryFn: () => listDocumentVersions(config.client, config.basePath, id, page),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

/** Paged trash listing for the current tenant. */
export function useTrashedDocuments(
  page: PageFilter = {},
  options?: { readonly enabled?: boolean }
): UseQueryResult<ListTrashedDocumentsResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', 'trash', page),
    queryFn: () => listTrashedDocuments(config.client, config.basePath, page),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Get a presigned download URL. The URL is short-lived, so this hook never
 * auto-refetches (`staleTime: Infinity`, `refetchOnWindowFocus: false`). Call
 * `refetch()` on demand when the user clicks "Download". Disabled when `id` is
 * empty.
 */
export function useDocumentDownloadUrl(
  id: string,
  versionId?: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<DownloadUrlResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'documents', id, 'download', versionId ?? null),
    queryFn: () => requestDocumentDownloadUrl(config.client, config.basePath, id, versionId),
    enabled: (options?.enabled ?? true) && id.length > 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
