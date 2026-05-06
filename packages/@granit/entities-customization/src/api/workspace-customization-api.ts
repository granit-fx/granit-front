import type {
  WorkspaceCustomizationRequest,
  WorkspaceCustomizationResponse,
} from '../types/customization.js';
import type { AxiosInstance } from '@granit/api-client';

function workspacePath(apiBase: string, workspaceName: string): string {
  return `${apiBase}/workspaces/${encodeURIComponent(workspaceName)}/customization`;
}

/**
 * Read the active workspace layout deltas for `workspaceName`.
 *
 * `GET {apiBase}/workspaces/{name}/customization`
 */
export async function getWorkspaceCustomization(
  client: AxiosInstance,
  apiBase: string,
  workspaceName: string
): Promise<WorkspaceCustomizationResponse> {
  const response = await client.get<WorkspaceCustomizationResponse>(
    workspacePath(apiBase, workspaceName)
  );
  return response.data;
}

/**
 * Replace the workspace layout deltas for `workspaceName`.
 *
 * `PUT {apiBase}/workspaces/{name}/customization`
 */
export async function putWorkspaceCustomization(
  client: AxiosInstance,
  apiBase: string,
  workspaceName: string,
  request: WorkspaceCustomizationRequest
): Promise<WorkspaceCustomizationResponse> {
  const response = await client.put<WorkspaceCustomizationResponse>(
    workspacePath(apiBase, workspaceName),
    request
  );
  return response.data;
}
