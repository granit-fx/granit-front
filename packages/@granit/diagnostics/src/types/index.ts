import type { ISODateString } from '@granit/types';

/** Health status of an individual service check. */
export type ServiceStatus = 'healthy' | 'degraded' | 'down';

/** Health information for a single monitored service. */
export interface ServiceHealthResponse {
  readonly id: string;
  readonly name: string;
  readonly status: ServiceStatus;
  readonly responseTimeMs: number | null;
  readonly description: string | null;
  readonly tags: readonly string[];
}

/** Response from the monitoring health endpoint. */
export interface MonitoringHealthResponse {
  readonly services: readonly ServiceHealthResponse[];
  /** ISO 8601 timestamp of when the health check was performed. */
  readonly checkedAt: ISODateString;
}
