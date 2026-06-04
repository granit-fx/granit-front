import type { AxiosInstance } from '@granit/api-client';

/**
 * Send a session keep-alive heartbeat for the authenticated user.
 *
 * `POST {basePath}/session/heartbeat`
 */
export async function sendSessionHeartbeat(client: AxiosInstance, basePath: string): Promise<void> {
  await client.post(`${basePath}/session/heartbeat`);
}
