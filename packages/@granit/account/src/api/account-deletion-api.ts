import type { AccountDeleteRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Request account deletion (GDPR Art. 17). Deletion is asynchronous.
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
