import { serializeQueryRequest } from '@granit/query-engine';

import type {
  AppendVersionRequest,
  DocumentResponse,
  DocumentStatus,
  DocumentVersionResponse,
  DownloadUrlResponse,
  FinalizeUploadRequest,
  ListDocumentVersionsResponse,
  ListTrashedDocumentsResponse,
  MoveDocumentRequest,
  PageFilter,
  RenameDocumentRequest,
  TransferOwnerRequest,
  UploadTicketRequest,
  UploadTicketResponse,
} from '../types/index';
import type { AxiosInstance, RequestFetchOptions } from '@granit/api-client';
import type { PagedResult, QueryRequest, SortEntry } from '@granit/query-engine';

/**
 * Issue a presigned upload ticket. The client PUTs the bytes directly to the
 * returned `uploadUrl` (no proxying through the API), then calls
 * {@link finalizeUpload} with the returned `blobId`.
 *
 * `POST {basePath}/documents/upload-ticket`
 */
export async function requestUploadTicket(
  client: AxiosInstance,
  basePath: string,
  request: UploadTicketRequest
): Promise<UploadTicketResponse> {
  const response = await client.post<UploadTicketResponse>(
    `${basePath}/documents/upload-ticket`,
    request
  );
  return response.data;
}

/**
 * Confirm the upload and create the Document + initial version atomically.
 * Returns 422 when the blob fails validation, 404 when the target folder is
 * missing, 403 with a `quota-exceeded` problem URI when the tenant is over
 * its storage quota (F7.2).
 *
 * `POST {basePath}/documents/finalize`
 */
export async function finalizeUpload(
  client: AxiosInstance,
  basePath: string,
  request: FinalizeUploadRequest
): Promise<DocumentResponse> {
  const response = await client.post<DocumentResponse>(`${basePath}/documents/finalize`, request);
  return response.data;
}

/**
 * Get a document by id, including its current version pointer and folder
 * placement.
 *
 * `GET {basePath}/documents/{id}`
 */
export async function getDocument(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<DocumentResponse> {
  const response = await client.get<DocumentResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Patch a document — rename and/or update description. Send
 * `clearDescription: true` to drop an existing description.
 *
 * `PATCH {basePath}/documents/{id}`
 */
export async function renameDocument(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RenameDocumentRequest
): Promise<DocumentResponse> {
  const response = await client.patch<DocumentResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Move a document under a different folder (or under the tenant root when
 * `newFolderId` is `null`). Cross-tenant moves and moves into trashed /
 * missing folders surface as 409.
 *
 * `POST {basePath}/documents/{id}/move`
 */
export async function moveDocument(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: MoveDocumentRequest
): Promise<DocumentResponse> {
  const response = await client.post<DocumentResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/move`,
    request
  );
  return response.data;
}

/**
 * Transfer ownership of a document to another user. Requires the
 * `Documents.Documents.TransferOwnership` permission. Returns 422 when
 * {@link TransferOwnerRequest.newOwnerId} is `Guid.Empty` or the document is
 * trashed, 404 when the document does not exist, 403 when the caller lacks
 * the permission.
 *
 * `PUT {basePath}/documents/{id}/owner`
 */
export async function transferDocumentOwner(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: TransferOwnerRequest
): Promise<DocumentResponse> {
  const response = await client.put<DocumentResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/owner`,
    request
  );
  return response.data;
}

/**
 * Soft-delete a document. Permanent deletion happens after the configured
 * retention period via the empty-trash background job (F9.2).
 *
 * `DELETE {basePath}/documents/{id}`
 */
export async function trashDocument(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<DocumentResponse> {
  const response = await client.delete<DocumentResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Restore a trashed document. Returns 409 when the parent folder is itself
 * trashed (restore the folder first).
 *
 * `POST {basePath}/documents/{id}/restore`
 */
export async function restoreDocument(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<DocumentResponse> {
  const response = await client.post<DocumentResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/restore`
  );
  return response.data;
}

/**
 * Permanently delete a trashed document. Soft-deletes every version's blob
 * descriptor, releases the tenant quota, and promotes the row to
 * `PermanentlyDeleted` (tombstone for the audit trail).
 *
 * `DELETE {basePath}/documents/{id}/permanent`
 */
export async function permanentlyDeleteDocument(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete<void>(`${basePath}/documents/${encodeURIComponent(id)}/permanent`);
}

/**
 * Issue a presigned download URL. Defaults to the document's current version;
 * pass `versionId` to download a specific historical version.
 *
 * `GET {basePath}/documents/{id}/download`
 */
export async function getDocumentDownloadUrl(
  client: AxiosInstance,
  basePath: string,
  id: string,
  versionId?: string
): Promise<DownloadUrlResponse> {
  const params: Record<string, string> = {};
  if (versionId !== undefined) {
    params.versionId = versionId;
  }
  const response = await client.get<DownloadUrlResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/download`,
    { params }
  );
  return response.data;
}

/**
 * List the version history of a document (latest first). Defaults are
 * `skip=0`, `take=50`; the backend caps `take` at 200.
 *
 * `GET {basePath}/documents/{id}/versions`
 */
export async function listDocumentVersions(
  client: AxiosInstance,
  basePath: string,
  id: string,
  page: PageFilter = {}
): Promise<ListDocumentVersionsResponse> {
  const params: Record<string, number> = {};
  if (page.skip !== undefined) params.skip = page.skip;
  if (page.take !== undefined) params.take = page.take;
  const response = await client.get<ListDocumentVersionsResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/versions`,
    { params }
  );
  return response.data;
}

/**
 * Append a new version to an existing document. The bytes must already have
 * been uploaded via {@link requestUploadTicket}.
 *
 * `POST {basePath}/documents/{id}/versions`
 */
export async function appendDocumentVersion(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: AppendVersionRequest
): Promise<DocumentVersionResponse> {
  const response = await client.post<DocumentVersionResponse>(
    `${basePath}/documents/${encodeURIComponent(id)}/versions`,
    request
  );
  return response.data;
}

/**
 * List trashed documents for the current tenant, ordered by `trashedAt`
 * descending. Each row carries `daysUntilPermanentDeletion`.
 *
 * `GET {basePath}/documents/trash`
 */
export async function listTrashedDocuments(
  client: AxiosInstance,
  basePath: string,
  page: PageFilter = {}
): Promise<ListTrashedDocumentsResponse> {
  const params: Record<string, number> = {};
  if (page.skip !== undefined) params.skip = page.skip;
  if (page.take !== undefined) params.take = page.take;
  const response = await client.get<ListTrashedDocumentsResponse>(`${basePath}/documents/trash`, {
    params,
  });
  return response.data;
}

/** Parameters accepted by {@link queryDocuments}. */
export interface QueryDocumentsParams {
  /** Free-text search (backend GlobalSearch over Name + Description). */
  readonly search?: string;
  /** Status filter, emitted as `filter[status.Eq]=<status>`. */
  readonly status?: DocumentStatus;
  /** Sort field; prefix with `-` for descending (e.g. `-name`). Backend defaults to `name`. */
  readonly sort?: string;
  /** One-based page number. */
  readonly page?: number;
  /** Items per page (backend clamps to 1..500). */
  readonly pageSize?: number;
}

function parseDocumentSort(sort: string): SortEntry {
  return sort.startsWith('-')
    ? { field: sort.slice(1), direction: 'desc' }
    : { field: sort, direction: 'asc' };
}

/**
 * Query the documents grid via the QueryEngine listing endpoint
 * (`GET /` on the nested `documents` sub-group). Filterable / sortable / paged.
 * Used by the CMS renderer's document picker.
 *
 * `GET {basePath}/documents?search=…&filter[status.Eq]=Active&sort=-name&page=1&pageSize=20`
 *
 * Query params are built through `serializeQueryRequest` from `@granit/query-engine`
 * so the operator casing and `filter[...]` encoding stay consistent with every
 * other Granit grid. `fetchOptions` is forwarded verbatim to the fetch adapter.
 */
export async function queryDocuments(
  client: AxiosInstance,
  basePath: string,
  params?: QueryDocumentsParams,
  fetchOptions?: RequestFetchOptions
): Promise<PagedResult<DocumentResponse>> {
  const request: QueryRequest = {
    page: params?.page,
    pageSize: params?.pageSize,
    search: params?.search,
    filters: params?.status
      ? [{ field: 'status', operator: 'Eq', value: params.status }]
      : undefined,
    sort: params?.sort ? [parseDocumentSort(params.sort)] : undefined,
  };
  const qs = serializeQueryRequest(request);
  const url = qs ? `${basePath}/documents?${qs}` : `${basePath}/documents`;
  const response = await client.get<PagedResult<DocumentResponse>>(
    url,
    fetchOptions ? { fetchOptions } : undefined
  );
  return response.data;
}
