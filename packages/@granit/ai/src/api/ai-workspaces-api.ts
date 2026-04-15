// ---------------------------------------------------------------------------
// Workspace management API functions.
// Mirrors Granit.AI.Endpoints workspace CRUD endpoints.
// ---------------------------------------------------------------------------

import type {
  AIWorkspaceCreateRequest,
  AIWorkspaceListResponse,
  AIWorkspaceResponse,
  AIWorkspaceUpdateRequest,
} from '../types/index.js';
import type { AxiosInstance } from 'axios';

/**
 * List all AI workspaces.
 *
 * `GET /ai/workspaces`
 */
export async function listAIWorkspaces(
  client: AxiosInstance,
  basePath: string
): Promise<AIWorkspaceListResponse> {
  const response = await client.get<AIWorkspaceListResponse>(`${basePath}/ai/workspaces`);
  return response.data;
}

/**
 * Get a single AI workspace by name.
 *
 * `GET /ai/workspaces/{name}`
 */
export async function getAIWorkspace(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<AIWorkspaceResponse> {
  const response = await client.get<AIWorkspaceResponse>(
    `${basePath}/ai/workspaces/${encodeURIComponent(name)}`
  );
  return response.data;
}

/**
 * Create a new dynamic AI workspace.
 *
 * `POST /ai/workspaces`
 */
export async function createAIWorkspace(
  client: AxiosInstance,
  basePath: string,
  request: AIWorkspaceCreateRequest
): Promise<AIWorkspaceResponse> {
  const response = await client.post<AIWorkspaceResponse>(`${basePath}/ai/workspaces`, request);
  return response.data;
}

/**
 * Update an existing dynamic AI workspace.
 *
 * `PUT /ai/workspaces/{name}`
 */
export async function updateAIWorkspace(
  client: AxiosInstance,
  basePath: string,
  name: string,
  request: AIWorkspaceUpdateRequest
): Promise<AIWorkspaceResponse> {
  const response = await client.put<AIWorkspaceResponse>(
    `${basePath}/ai/workspaces/${encodeURIComponent(name)}`,
    request
  );
  return response.data;
}

/**
 * Delete a dynamic AI workspace.
 *
 * `DELETE /ai/workspaces/{name}`
 */
export async function deleteAIWorkspace(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<void> {
  await client.delete(`${basePath}/ai/workspaces/${encodeURIComponent(name)}`);
}
