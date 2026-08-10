import type {
  ReferenceDataCreateRequest,
  ReferenceDataResponse,
  ReferenceDataQuery,
  ReferenceDataUpdateRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult } from '@granit/query-engine';

/**
 * List reference data entries (paginated).
 *
 * `GET {basePath}?activeOnly=&search=&sortBy=&descending=&page=&pageSize=`
 */
export async function listReferenceData<T extends ReferenceDataResponse>(
  client: AxiosInstance,
  basePath: string,
  params?: ReferenceDataQuery
): Promise<PagedResult<T>> {
  const { data } = await client.get<PagedResult<T>>(basePath, { params });
  return data;
}

/**
 * Get a single reference data entry by its unique code.
 *
 * `GET {basePath}/{code}`
 */
export async function getReferenceDataEntry<T extends ReferenceDataResponse>(
  client: AxiosInstance,
  basePath: string,
  code: string
): Promise<T> {
  const { data } = await client.get<T>(`${basePath}/${encodeURIComponent(code)}`);
  return data;
}

/**
 * Create a new reference data entry.
 *
 * `POST {basePath}`
 */
export async function createReferenceDataEntry(
  client: AxiosInstance,
  basePath: string,
  payload: ReferenceDataCreateRequest
): Promise<void> {
  await client.post(basePath, payload);
}

/**
 * Update an existing reference data entry.
 *
 * `PUT {basePath}/{code}`
 */
export async function updateReferenceDataEntry(
  client: AxiosInstance,
  basePath: string,
  code: string,
  payload: ReferenceDataUpdateRequest
): Promise<void> {
  await client.put(`${basePath}/${encodeURIComponent(code)}`, payload);
}

/**
 * List the direct children of a hierarchical reference data entry.
 *
 * `GET {basePath}/{code}/children`
 *
 * Returns active children ordered by sortOrder, then code.
 * Throws 404 if the parent code does not exist.
 */
export async function listReferenceDataChildren<T extends ReferenceDataResponse>(
  client: AxiosInstance,
  basePath: string,
  code: string
): Promise<T[]> {
  const { data } = await client.get<T[]>(`${basePath}/${encodeURIComponent(code)}/children`);
  return data;
}

/**
 * Deactivate a reference data entry (soft delete).
 *
 * `DELETE {basePath}/{code}`
 */
export async function deactivateReferenceDataEntry(
  client: AxiosInstance,
  basePath: string,
  code: string
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(code)}`);
}
