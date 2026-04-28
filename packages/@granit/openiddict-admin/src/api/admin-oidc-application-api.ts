import type {
  AdminOidcApplication,
  AdminOidcApplicationCreateRequest,
  AdminOidcApplicationSecretResponse,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

// ── OIDC Application CRUD ────────────────────────────────────────────────────

/**
 * List all OIDC applications.
 *
 * `GET {basePath}/oidc/applications`
 */
export async function listApplications(
  client: AxiosInstance,
  basePath: string
): Promise<readonly AdminOidcApplication[]> {
  const { data } = await client.get<readonly AdminOidcApplication[]>(
    `${basePath}/oidc/applications`
  );
  return data;
}

/**
 * Create a new OIDC application.
 *
 * `POST {basePath}/oidc/applications`
 */
export async function createApplication(
  client: AxiosInstance,
  basePath: string,
  request: AdminOidcApplicationCreateRequest
): Promise<AdminOidcApplication> {
  const { data } = await client.post<AdminOidcApplication>(
    `${basePath}/oidc/applications`,
    request
  );
  return data;
}

/**
 * Delete an OIDC application by client ID.
 *
 * `DELETE {basePath}/oidc/applications/{clientId}`
 */
export async function deleteApplication(
  client: AxiosInstance,
  basePath: string,
  clientId: string
): Promise<void> {
  await client.delete(`${basePath}/oidc/applications/${encodeURIComponent(clientId)}`);
}

/**
 * Rotate the client secret for an OIDC application.
 *
 * `POST {basePath}/oidc/applications/{clientId}/rotate-secret`
 */
export async function rotateApplicationSecret(
  client: AxiosInstance,
  basePath: string,
  clientId: string
): Promise<AdminOidcApplicationSecretResponse> {
  const { data } = await client.post<AdminOidcApplicationSecretResponse>(
    `${basePath}/oidc/applications/${encodeURIComponent(clientId)}/rotate-secret`
  );
  return data;
}
