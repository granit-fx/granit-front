import { getFolder, getFolderBreadcrumb, listFolders } from '@granit/documents';
import { useQuery } from '@tanstack/react-query';

import { buildDocumentsQueryKey, useDocumentsConfig } from '../providers/documents-provider';

import type {
  FolderBreadcrumbResponse,
  FolderResponse,
  ListFoldersFilter,
  ListFoldersResponse,
} from '@granit/documents';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * List child folders under a parent. Pass `parentId: null` (or omit) to list
 * the tenant-root children. `status` defaults to `Active` server-side.
 */
export function useFolders(
  filter: ListFoldersFilter = {},
  options?: { readonly enabled?: boolean }
): UseQueryResult<ListFoldersResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'folders', 'list', filter),
    queryFn: () => listFolders(config.client, config.basePath, filter),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Get a single folder (with materialised path + depth). Disabled when `id`
 * is empty.
 */
export function useFolder(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<FolderResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'folders', 'detail', id),
    queryFn: () => getFolder(config.client, config.basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

/**
 * Get the breadcrumb chain (root→leaf) for a folder. Disabled when `id` is
 * empty.
 */
export function useFolderBreadcrumb(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<FolderBreadcrumbResponse> {
  const config = useDocumentsConfig();
  return useQuery({
    queryKey: buildDocumentsQueryKey(config, 'folders', 'breadcrumb', id),
    queryFn: () => getFolderBreadcrumb(config.client, config.basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
