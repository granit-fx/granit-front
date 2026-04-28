import type { AccountImpersonationResult } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Send a session heartbeat to prevent idle timeout.
 * Should be called every 5 minutes when the user is active.
 *
 * `POST {basePath}/session/heartbeat`
 */
export async function sessionHeartbeat(client: AxiosInstance, basePath: string): Promise<void> {
  await client.post(`${basePath}/session/heartbeat`);
}

/**
 * End an impersonation session and return to the original admin account.
 * Only valid when the current token contains an `impersonator_id` claim.
 *
 * `POST {basePath}/session/back-to-impersonator`
 */
export async function backToImpersonator(
  client: AxiosInstance,
  basePath: string
): Promise<AccountImpersonationResult> {
  const { data } = await client.post<AccountImpersonationResult>(
    `${basePath}/session/back-to-impersonator`
  );
  return data;
}
