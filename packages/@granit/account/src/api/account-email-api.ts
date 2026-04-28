import type {
  AccountChangeEmailRequest,
  AccountConfirmEmailChangeRequest,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Request an email change (authenticated).
 * Always returns 202 regardless of whether the email exists (anti-enumeration).
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
 * Confirm an email change using the token from the confirmation email (anonymous).
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
