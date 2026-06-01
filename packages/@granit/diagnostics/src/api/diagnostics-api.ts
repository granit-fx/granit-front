import type { MonitoringHealthResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/** Default base path for the diagnostics API. */
export const DEFAULT_DIAGNOSTICS_BASE_PATH = '/api/v1/diagnostics';

/**
 * Get the monitoring health status of all registered services.
 *
 * `GET {basePath}/health`
 */
export async function getMonitoringHealth(
  client: AxiosInstance,
  basePath: string
): Promise<MonitoringHealthResponse> {
  const { data } = await client.get<MonitoringHealthResponse>(`${basePath}/health`);
  return data;
}
