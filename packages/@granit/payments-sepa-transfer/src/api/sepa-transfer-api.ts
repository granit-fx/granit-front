import type {
  SepaTransferConfigurationRequest,
  SepaTransferConfigurationResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the current tenant's SEPA bank transfer configuration.
 *
 * `GET {basePath}/configuration`
 *
 * The backend returns 404 when SEPA transfer has not been configured for the tenant.
 */
export async function getSepaTransferConfiguration(
  client: AxiosInstance,
  basePath: string
): Promise<SepaTransferConfigurationResponse> {
  const response = await client.get<SepaTransferConfigurationResponse>(`${basePath}/configuration`);
  return response.data;
}

/**
 * Create or update the current tenant's SEPA bank transfer configuration.
 *
 * `PUT {basePath}/configuration`
 *
 * When a `beneficiaryIban` is supplied, the account is provisioned into the
 * company's `BankAccounts` referential and stamped onto the configuration.
 */
export async function upsertSepaTransferConfiguration(
  client: AxiosInstance,
  basePath: string,
  request: SepaTransferConfigurationRequest
): Promise<SepaTransferConfigurationResponse> {
  const response = await client.put<SepaTransferConfigurationResponse>(
    `${basePath}/configuration`,
    request
  );
  return response.data;
}
