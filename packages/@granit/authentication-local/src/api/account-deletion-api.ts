import type { AccountDeleteRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Request deletion of the authenticated account (step-up: password).
 *
 * Returns 202 Accepted; the account is scheduled for erasure.
 *
 * `POST {basePath}/delete`
 */
export async function deleteAccount(
  client: AxiosInstance,
  basePath: string,
  request: AccountDeleteRequest
): Promise<void> {
  await client.post(`${basePath}/delete`, request);
}
