import type {
  EntityViewCreateBodyRequest,
  EntityViewResponse,
  EntityViewShareBodyRequest,
  EntityViewUpdateBodyRequest,
} from '../types/index';
import type { AxiosInstance, AxiosRequestConfig } from '@granit/api-client';

const viewsRoot = (basePath: string, entityName: string) =>
  `${basePath}/${encodeURIComponent(entityName)}/views`;

const viewById = (basePath: string, entityName: string, id: string) =>
  `${viewsRoot(basePath, entityName)}/${encodeURIComponent(id)}`;

/**
 * Lists every saved view the caller can access for an entity.
 *
 * `GET {basePath}/{entityName}/views`
 */
export async function listEntityViews(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  config?: AxiosRequestConfig
): Promise<readonly EntityViewResponse[]> {
  const { data } = await client.get<readonly EntityViewResponse[]>(
    viewsRoot(basePath, entityName),
    config
  );
  return data;
}

/**
 * Fetches one saved view by id.
 *
 * `GET {basePath}/{entityName}/views/{id}`
 */
export async function getEntityView(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  id: string,
  config?: AxiosRequestConfig
): Promise<EntityViewResponse> {
  const { data } = await client.get<EntityViewResponse>(viewById(basePath, entityName, id), config);
  return data;
}

/**
 * Resolves the user's effective default saved view per ADR-047 §4 precedence.
 * Returns `null` when the backend responds 204 No Content (consumer should
 * fall back to the compiled default).
 *
 * `GET {basePath}/{entityName}/views/_default`
 */
export async function getDefaultEntityView(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  config?: AxiosRequestConfig
): Promise<EntityViewResponse | null> {
  const response = await client.get<EntityViewResponse | ''>(
    `${viewsRoot(basePath, entityName)}/_default`,
    config
  );
  if (response.status === 204) {
    return null;
  }
  return response.data as EntityViewResponse;
}

/**
 * Creates a new Personal saved view owned by the caller.
 *
 * `POST {basePath}/{entityName}/views`
 */
export async function createEntityView(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  request: EntityViewCreateBodyRequest
): Promise<EntityViewResponse> {
  const { data } = await client.post<EntityViewResponse>(viewsRoot(basePath, entityName), request);
  return data;
}

/**
 * Updates the editable fields (`name`, `description`, `icon`, `state`) of an
 * existing saved view.
 *
 * `PUT {basePath}/{entityName}/views/{id}`
 */
export async function updateEntityView(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  id: string,
  request: EntityViewUpdateBodyRequest
): Promise<EntityViewResponse> {
  const { data } = await client.put<EntityViewResponse>(
    viewById(basePath, entityName, id),
    request
  );
  return data;
}

/**
 * Deletes a saved view.
 *
 * `DELETE {basePath}/{entityName}/views/{id}`
 */
export async function deleteEntityView(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  id: string
): Promise<void> {
  await client.delete(viewById(basePath, entityName, id));
}

/**
 * Sets or clears the pinned-as-tab flag (admin-promoted).
 *
 * `POST {basePath}/{entityName}/views/{id}/pin`
 */
export async function setEntityViewPinned(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  id: string,
  value: boolean
): Promise<EntityViewResponse> {
  const { data } = await client.post<EntityViewResponse>(
    `${viewById(basePath, entityName, id)}/pin`,
    { value }
  );
  return data;
}

/**
 * Sets or clears the tenant-default flag.
 *
 * `POST {basePath}/{entityName}/views/{id}/set-default`
 */
export async function setEntityViewTenantDefault(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  id: string,
  value: boolean
): Promise<EntityViewResponse> {
  const { data } = await client.post<EntityViewResponse>(
    `${viewById(basePath, entityName, id)}/set-default`,
    { value }
  );
  return data;
}

/**
 * Sets or clears the personal-default flag for the current user.
 *
 * `POST {basePath}/{entityName}/views/{id}/star`
 */
export async function setEntityViewPersonalDefault(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  id: string,
  value: boolean
): Promise<EntityViewResponse> {
  const { data } = await client.post<EntityViewResponse>(
    `${viewById(basePath, entityName, id)}/star`,
    { value }
  );
  return data;
}

/**
 * Promotes a Personal view to Shared, or updates the audience of an
 * already-Shared view.
 *
 * `POST {basePath}/{entityName}/views/{id}/share`
 */
export async function shareEntityView(
  client: AxiosInstance,
  basePath: string,
  entityName: string,
  id: string,
  request: EntityViewShareBodyRequest
): Promise<EntityViewResponse> {
  const { data } = await client.post<EntityViewResponse>(
    `${viewById(basePath, entityName, id)}/share`,
    request
  );
  return data;
}
