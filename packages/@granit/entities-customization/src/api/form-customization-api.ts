import type {
  EntityCustomizationRequest,
  EntityCustomizationResponse,
  LayoutKind,
} from '../types/customization';
import type { AxiosInstance } from '@granit/api-client';

function customizationPath(apiBase: string, entityName: string, layoutKind: LayoutKind): string {
  return `${apiBase}/entities/${encodeURIComponent(entityName)}/customization/${encodeURIComponent(layoutKind)}`;
}

/**
 * Read the active layout deltas for `entityName`/`layoutKind`.
 *
 * `GET {apiBase}/entities/{name}/customization/{layoutKind}`
 */
export async function getEntityCustomization(
  client: AxiosInstance,
  apiBase: string,
  entityName: string,
  layoutKind: LayoutKind
): Promise<EntityCustomizationResponse> {
  const response = await client.get<EntityCustomizationResponse>(
    customizationPath(apiBase, entityName, layoutKind)
  );
  return response.data;
}

/**
 * Replace the layout deltas for `entityName`/`layoutKind`. The backend
 * audits the change (ADR-053 §7) and rejects unknown delta kinds.
 *
 * `PUT {apiBase}/entities/{name}/customization/{layoutKind}`
 */
export async function putEntityCustomization(
  client: AxiosInstance,
  apiBase: string,
  entityName: string,
  layoutKind: LayoutKind,
  request: EntityCustomizationRequest
): Promise<EntityCustomizationResponse> {
  const response = await client.put<EntityCustomizationResponse>(
    customizationPath(apiBase, entityName, layoutKind),
    request
  );
  return response.data;
}

/**
 * Delete the customization record for `entityName`/`layoutKind`, restoring
 * the base-layer layout.
 *
 * `DELETE {apiBase}/entities/{name}/customization/{layoutKind}`
 */
export async function deleteEntityCustomization(
  client: AxiosInstance,
  apiBase: string,
  entityName: string,
  layoutKind: LayoutKind
): Promise<void> {
  await client.delete(customizationPath(apiBase, entityName, layoutKind));
}
