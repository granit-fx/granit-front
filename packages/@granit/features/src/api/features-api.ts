import type {
  FeatureGroupResponse,
  FeatureValueResponse,
  SetFeatureOverrideRequest,
} from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetch all feature definitions grouped by category.
 *
 * `GET {basePath}/definitions`
 */
export async function getFeatureDefinitions(
  client: AxiosInstance,
  basePath: string
): Promise<readonly FeatureGroupResponse[]> {
  const response = await client.get<readonly FeatureGroupResponse[]>(`${basePath}/definitions`);
  return response.data;
}

/**
 * Fetch all resolved feature values for the current tenant.
 *
 * `GET {basePath}/values`
 */
export async function getAllFeatureValues(
  client: AxiosInstance,
  basePath: string
): Promise<readonly FeatureValueResponse[]> {
  const response = await client.get<readonly FeatureValueResponse[]>(`${basePath}/values`);
  return response.data;
}

/**
 * Fetch the resolved value of a single feature flag.
 *
 * `GET {basePath}/values/{name}`
 */
export async function getFeatureValue(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<FeatureValueResponse> {
  const response = await client.get<FeatureValueResponse>(
    `${basePath}/values/${encodeURIComponent(name)}`
  );
  return response.data;
}

/**
 * Set a tenant-level override for a feature flag.
 *
 * `PUT {basePath}/overrides/{name}`
 */
export async function setFeatureOverride(
  client: AxiosInstance,
  basePath: string,
  name: string,
  request: SetFeatureOverrideRequest
): Promise<void> {
  await client.put(`${basePath}/overrides/${encodeURIComponent(name)}`, request);
}

/**
 * Delete a tenant-level override, reverting to the default value.
 *
 * `DELETE {basePath}/overrides/{name}`
 */
export async function deleteFeatureOverride(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<void> {
  await client.delete(`${basePath}/overrides/${encodeURIComponent(name)}`);
}
