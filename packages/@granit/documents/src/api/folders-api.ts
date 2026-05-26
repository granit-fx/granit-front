import type {
  CreateFolderRequest,
  FolderBreadcrumbResponse,
  FolderResponse,
  ListFoldersFilter,
  ListFoldersResponse,
  MoveFolderRequest,
  RenameFolderRequest,
  TransferOwnerRequest,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List child folders under a parent. Omit `parentId` (or pass `null`) to list
 * direct children of the invisible tenant root. `status` defaults to `Active`
 * server-side — pass `Trashed` to read the trash listing (F8.1).
 *
 * `GET {basePath}/folders`
 */
export async function listFolders(
  client: AxiosInstance,
  basePath: string,
  filter: ListFoldersFilter = {}
): Promise<ListFoldersResponse> {
  const params: Record<string, string> = {};
  if (filter.parentId !== undefined && filter.parentId !== null) {
    params.parentId = filter.parentId;
  }
  if (filter.status !== undefined) {
    params.status = filter.status;
  }
  const response = await client.get<ListFoldersResponse>(`${basePath}/folders`, { params });
  return response.data;
}

/**
 * Get a single folder, including its materialised path and depth.
 *
 * `GET {basePath}/folders/{id}`
 */
export async function getFolder(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<FolderResponse> {
  const response = await client.get<FolderResponse>(
    `${basePath}/folders/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Get the breadcrumb chain (closest-to-root first; the requested folder is the
 * last entry). The invisible tenant root is excluded from the chain.
 *
 * `GET {basePath}/folders/{id}/breadcrumb`
 */
export async function getFolderBreadcrumb(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<FolderBreadcrumbResponse> {
  const response = await client.get<FolderBreadcrumbResponse>(
    `${basePath}/folders/${encodeURIComponent(id)}/breadcrumb`
  );
  return response.data;
}

/**
 * Create a folder under the given parent (or under the tenant root when
 * `parentFolderId` is `null`).
 *
 * `POST {basePath}/folders`
 */
export async function createFolder(
  client: AxiosInstance,
  basePath: string,
  request: CreateFolderRequest
): Promise<FolderResponse> {
  const response = await client.post<FolderResponse>(`${basePath}/folders`, request);
  return response.data;
}

/**
 * Rename a folder. The materialised path is recomputed atomically; descendant
 * paths are not touched (use {@link moveFolder} for that).
 *
 * `PATCH {basePath}/folders/{id}`
 */
export async function renameFolder(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RenameFolderRequest
): Promise<FolderResponse> {
  const response = await client.patch<FolderResponse>(
    `${basePath}/folders/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Move a folder under a new parent. Backend rejects cycles, cross-tenant
 * moves, and moves under a trashed or descendant target (409 Conflict).
 *
 * `POST {basePath}/folders/{id}/move`
 */
export async function moveFolder(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: MoveFolderRequest
): Promise<FolderResponse> {
  const response = await client.post<FolderResponse>(
    `${basePath}/folders/${encodeURIComponent(id)}/move`,
    request
  );
  return response.data;
}

/**
 * Transfer ownership of a folder to another user. Requires the
 * `Documents.Folders.TransferOwnership` permission. Returns 422 when
 * {@link TransferOwnerRequest.newOwnerId} is `Guid.Empty`, the target is the
 * tenant root, or the folder is trashed; 404 when the folder does not
 * exist; 403 when the caller lacks the permission.
 *
 * `PUT {basePath}/folders/{id}/owner`
 */
export async function transferFolderOwner(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: TransferOwnerRequest
): Promise<FolderResponse> {
  const response = await client.put<FolderResponse>(
    `${basePath}/folders/${encodeURIComponent(id)}/owner`,
    request
  );
  return response.data;
}

/**
 * Soft-delete a folder. Cascade-trashes every active descendant in a single
 * transaction. Permanent deletion happens after the configured retention
 * window via the empty-trash background job (F9.2).
 *
 * `DELETE {basePath}/folders/{id}`
 */
export async function trashFolder(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<FolderResponse> {
  const response = await client.delete<FolderResponse>(
    `${basePath}/folders/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Restore a trashed folder. Restore is non-cascading by design — descendants
 * stay trashed unless restored individually. Returns 409 when the parent
 * folder is itself trashed.
 *
 * `POST {basePath}/folders/{id}/restore`
 */
export async function restoreFolder(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<FolderResponse> {
  const response = await client.post<FolderResponse>(
    `${basePath}/folders/${encodeURIComponent(id)}/restore`
  );
  return response.data;
}
