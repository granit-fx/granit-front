import type {
  AccountForgotPasswordRequest,
  AccountPasswordChangeRequest,
  AccountPasswordResetRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Change the current user's password (authenticated).
 *
 * `POST {basePath}/change-password`
 */
export async function changePassword(
  client: AxiosInstance,
  basePath: string,
  request: AccountPasswordChangeRequest
): Promise<void> {
  await client.post(`${basePath}/change-password`, request);
}

/**
 * Request a password reset email (anonymous).
 * Always returns 202 regardless of whether the email exists (anti-enumeration).
 *
 * `POST {basePath}/forgot-password`
 */
export async function forgotPassword(
  client: AxiosInstance,
  basePath: string,
  request: AccountForgotPasswordRequest
): Promise<void> {
  await client.post(`${basePath}/forgot-password`, request);
}

/**
 * Reset a password using the token from the reset email (anonymous).
 *
 * `POST {basePath}/reset-password`
 */
export async function resetPassword(
  client: AxiosInstance,
  basePath: string,
  request: AccountPasswordResetRequest
): Promise<void> {
  await client.post(`${basePath}/reset-password`, request);
}
