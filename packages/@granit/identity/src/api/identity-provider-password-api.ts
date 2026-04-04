import type { IdentityPasswordChangedAtResponse } from '../types/index.js';
import type { UserId } from '@granit/types';
import type { AxiosInstance } from 'axios';

/**
 * Get the last password change timestamp for a user.
 *
 * `GET {basePath}/users/{userId}/password/changed-at`
 */
export async function fetchPasswordChangedAt(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<IdentityPasswordChangedAtResponse> {
  const response = await client.get<IdentityPasswordChangedAtResponse>(
    `${basePath}/users/${encodeURIComponent(userId)}/password/changed-at`
  );
  return response.data;
}

/**
 * Send a password reset email to a user.
 * May return 501 if `supportsNativePasswordResetEmail` is false.
 *
 * `POST {basePath}/users/{userId}/password/reset-email`
 */
export async function sendPasswordResetEmail(
  client: AxiosInstance,
  basePath: string,
  userId: UserId
): Promise<void> {
  await client.post(`${basePath}/users/${encodeURIComponent(userId)}/password/reset-email`);
}

/**
 * Set a temporary password for a user.
 *
 * `POST {basePath}/users/{userId}/password/temporary`
 */
export async function setTemporaryPassword(
  client: AxiosInstance,
  basePath: string,
  userId: string,
  password: string
): Promise<void> {
  await client.post(`${basePath}/users/${encodeURIComponent(userId)}/password/temporary`, {
    password,
  });
}
