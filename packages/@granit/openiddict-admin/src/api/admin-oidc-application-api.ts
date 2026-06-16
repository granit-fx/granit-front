import type {
  AdminOidcApplicationResponse,
  AdminOidcCreateApplicationRequest,
  AdminOidcRotateSecretResponse,
  AdminOidcUpdateApplicationRequest,
} from '../types/index';
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
): Promise<readonly AdminOidcApplicationResponse[]> {
  const { data } = await client.get<readonly AdminOidcApplicationResponse[]>(
    `${basePath}/oidc/applications`
  );
  return data;
}

/**
 * Get a single OIDC application by client ID.
 *
 * `GET {basePath}/oidc/applications/{clientId}`
 */
export async function getApplication(
  client: AxiosInstance,
  basePath: string,
  clientId: string
): Promise<AdminOidcApplicationResponse> {
  const { data } = await client.get<AdminOidcApplicationResponse>(
    `${basePath}/oidc/applications/${encodeURIComponent(clientId)}`
  );
  return data;
}

/**
 * Get public display info for an OIDC application (non-admin, consent page use).
 *
 * `GET {oidcBasePath}/applications/{clientId}`
 */
export async function getApplicationInfo(
  client: AxiosInstance,
  oidcBasePath: string,
  clientId: string
): Promise<{ clientId: string | null; displayName: string | null }> {
  const { data } = await client.get<{ clientId: string | null; displayName: string | null }>(
    `${oidcBasePath}/applications/${encodeURIComponent(clientId)}`
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
  request: AdminOidcCreateApplicationRequest
): Promise<AdminOidcApplicationResponse> {
  const { data } = await client.post<AdminOidcApplicationResponse>(
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
 * Update an OIDC application by client ID.
 *
 * `PUT {basePath}/oidc/applications/{clientId}`
 */
export async function updateApplication(
  client: AxiosInstance,
  basePath: string,
  clientId: string,
  request: AdminOidcUpdateApplicationRequest
): Promise<AdminOidcApplicationResponse> {
  const { data } = await client.put<AdminOidcApplicationResponse>(
    `${basePath}/oidc/applications/${encodeURIComponent(clientId)}`,
    request
  );
  return data;
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
): Promise<AdminOidcRotateSecretResponse> {
  const { data } = await client.post<AdminOidcRotateSecretResponse>(
    `${basePath}/oidc/applications/${encodeURIComponent(clientId)}/rotate-secret`
  );
  return data;
}
