import type { AccountChangeEmailRequest, AccountConfirmEmailChangeRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Request an email-address change (authenticated, step-up: current password).
 *
 * Returns 202 and sends a confirmation link to the new address.
 *
 * `POST {basePath}/change-email`
 */
export async function changeEmail(
  client: AxiosInstance,
  basePath: string,
  request: AccountChangeEmailRequest
): Promise<void> {
  await client.post(`${basePath}/change-email`, request);
}

/**
 * Confirm an email-address change (anonymous — called from the e-mailed link).
 *
 * `POST {basePath}/confirm-email-change`
 */
export async function confirmEmailChange(
  client: AxiosInstance,
  basePath: string,
  request: AccountConfirmEmailChangeRequest
): Promise<void> {
  await client.post(`${basePath}/confirm-email-change`, request);
}
