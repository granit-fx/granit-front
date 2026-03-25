// ---------------------------------------------------------------------------
// Saved views API — CRUD operations
// ---------------------------------------------------------------------------

import type {
  CreateSavedViewRequest,
  SavedViewSummary,
  UpdateSavedViewRequest,
} from '../types/saved-views.js';
import type { AxiosInstance } from 'axios';

/**
 * List all saved views for the current entity type.
 */
export async function fetchSavedViews(
  client: AxiosInstance,
  basePath: string
): Promise<SavedViewSummary[]> {
  const response = await client.get<SavedViewSummary[]>(`${basePath}/saved-views`);
  return response.data;
}

/**
 * Create a new saved view.
 */
export async function createSavedView(
  client: AxiosInstance,
  basePath: string,
  request: CreateSavedViewRequest
): Promise<SavedViewSummary> {
  const response = await client.post<SavedViewSummary>(`${basePath}/saved-views`, request);
  return response.data;
}

/**
 * Update an existing saved view. Returns `void` (backend responds with 204 NoContent).
 */
export async function updateSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateSavedViewRequest
): Promise<void> {
  await client.put(`${basePath}/saved-views/${id}`, request);
}

/**
 * Delete a saved view.
 */
export async function deleteSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/saved-views/${id}`);
}

/**
 * Set a saved view as the default. Returns `void` (backend responds with 204 NoContent).
 */
export async function setDefaultSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/saved-views/${id}/set-default`);
}
