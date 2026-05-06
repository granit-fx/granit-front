import type {
  FormCustomizationRequest,
  FormCustomizationResponse,
  FormVariant,
} from '../types/customization.js';
import type { AxiosInstance } from '@granit/api-client';

/** Builds the form-customization endpoint for a given entity + variant. */
function formPath(apiBase: string, entityName: string, variant: FormVariant): string {
  return `${apiBase}/entities/${encodeURIComponent(entityName)}/customization/forms/${encodeURIComponent(variant)}`;
}

/**
 * Read the active form layout deltas for `entityName`/`variant`.
 *
 * `GET {apiBase}/entities/{name}/customization/forms/{variant}`
 */
export async function getFormCustomization(
  client: AxiosInstance,
  apiBase: string,
  entityName: string,
  variant: FormVariant
): Promise<FormCustomizationResponse> {
  const response = await client.get<FormCustomizationResponse>(
    formPath(apiBase, entityName, variant)
  );
  return response.data;
}

/**
 * Replace the form layout deltas for `entityName`/`variant`. The backend
 * audits the change (ADR-053 §7) and rejects unknown delta kinds.
 *
 * `PUT {apiBase}/entities/{name}/customization/forms/{variant}`
 */
export async function putFormCustomization(
  client: AxiosInstance,
  apiBase: string,
  entityName: string,
  variant: FormVariant,
  request: FormCustomizationRequest
): Promise<FormCustomizationResponse> {
  const response = await client.put<FormCustomizationResponse>(
    formPath(apiBase, entityName, variant),
    request
  );
  return response.data;
}
