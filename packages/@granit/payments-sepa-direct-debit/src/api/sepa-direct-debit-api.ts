import type {
  ConfirmMandateRequest,
  CreateMandateRequest,
  MandateResponse,
  MandateSetupResponse,
  SepaConfigurationRequest,
  SepaConfigurationResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Set up a SEPA Direct Debit mandate for the current tenant.
 *
 * `POST {basePath}/mandates` → 201 Created
 *
 * Returns the new mandate (Pending) together with any provider-hosted signature
 * URL. The backend returns 409 when the tenant has no active SEPA configuration.
 */
export async function createMandate(
  client: AxiosInstance,
  basePath: string,
  request: CreateMandateRequest
): Promise<MandateSetupResponse> {
  const response = await client.post<MandateSetupResponse>(`${basePath}/mandates`, request);
  return response.data;
}

/**
 * Get a single mandate by ID. The debtor IBAN is masked.
 *
 * `GET {basePath}/mandates/{id}`
 */
export async function getMandate(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<MandateResponse> {
  const response = await client.get<MandateResponse>(
    `${basePath}/mandates/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Confirm (activate) a pending mandate after the debtor's signature.
 *
 * `POST {basePath}/mandates/{id}/confirm`
 *
 * Confirming a provider-backed mandate requires the
 * `SepaDirectDebit.Mandates.ConfirmOverride` permission (such mandates normally
 * activate via the provider's verified flow); the backend returns 403 otherwise.
 */
export async function confirmMandate(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: ConfirmMandateRequest
): Promise<MandateResponse> {
  const response = await client.post<MandateResponse>(
    `${basePath}/mandates/${encodeURIComponent(id)}/confirm`,
    request
  );
  return response.data;
}

/**
 * Cancel (revoke) a mandate.
 *
 * `POST {basePath}/mandates/{id}/cancel`
 *
 * The backend returns 409 when the mandate is already in a terminal status.
 */
export async function cancelMandate(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<MandateResponse> {
  const response = await client.post<MandateResponse>(
    `${basePath}/mandates/${encodeURIComponent(id)}/cancel`
  );
  return response.data;
}

/**
 * Get the current tenant's SEPA Direct Debit configuration.
 *
 * `GET {basePath}/configuration`
 *
 * The backend returns 404 when SEPA has not been configured for the tenant.
 */
export async function getSepaConfiguration(
  client: AxiosInstance,
  basePath: string
): Promise<SepaConfigurationResponse> {
  const response = await client.get<SepaConfigurationResponse>(`${basePath}/configuration`);
  return response.data;
}

/**
 * Create or update the current tenant's SEPA Direct Debit configuration.
 *
 * `PUT {basePath}/configuration`
 *
 * The Creditor Identifier (SCI) is locked once the tenant has mandates: changing
 * it then returns 409 (it requires a SEPA mandate migration, not an in-place edit).
 */
export async function upsertSepaConfiguration(
  client: AxiosInstance,
  basePath: string,
  request: SepaConfigurationRequest
): Promise<SepaConfigurationResponse> {
  const response = await client.put<SepaConfigurationResponse>(
    `${basePath}/configuration`,
    request
  );
  return response.data;
}
