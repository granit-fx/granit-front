import type {
  MeterDefinitionCreateRequest,
  MeterDefinitionId,
  MeterDefinitionResponse,
  MeterDefinitionUpdateRequest,
  MeteringQuotaStatusResponse,
  RecordUsageRequest,
  UsageAggregateResponse,
} from '../types.js';
import type { AxiosInstance } from 'axios';

/**
 * List all active meter definitions.
 *
 * `GET {basePath}/meters`
 */
export async function listActiveMeters(
  client: AxiosInstance,
  basePath: string
): Promise<readonly MeterDefinitionResponse[]> {
  const response = await client.get<readonly MeterDefinitionResponse[]>(`${basePath}/meters`);
  return response.data;
}

/**
 * Get a single meter definition by ID.
 *
 * `GET {basePath}/meters/{id}`
 */
export async function getMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: MeterDefinitionId
): Promise<MeterDefinitionResponse> {
  const response = await client.get<MeterDefinitionResponse>(
    `${basePath}/meters/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Create a new meter definition.
 *
 * `POST {basePath}/meters`
 */
export async function createMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  request: MeterDefinitionCreateRequest
): Promise<MeterDefinitionResponse> {
  const response = await client.post<MeterDefinitionResponse>(`${basePath}/meters`, request);
  return response.data;
}

/**
 * Update an existing meter definition.
 *
 * `PUT {basePath}/meters/{id}`
 */
export async function updateMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: MeterDefinitionId,
  request: MeterDefinitionUpdateRequest
): Promise<MeterDefinitionResponse> {
  const response = await client.put<MeterDefinitionResponse>(
    `${basePath}/meters/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Deactivate a meter definition.
 *
 * `POST {basePath}/meters/{id}/deactivate`
 */
export async function deactivateMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: MeterDefinitionId
): Promise<void> {
  await client.post(`${basePath}/meters/${encodeURIComponent(id)}/deactivate`);
}

/**
 * Get aggregated usage for the current period.
 *
 * `GET {basePath}/usage`
 */
export async function getUsageForPeriod(
  client: AxiosInstance,
  basePath: string
): Promise<readonly UsageAggregateResponse[]> {
  const response = await client.get<readonly UsageAggregateResponse[]>(`${basePath}/usage`);
  return response.data;
}

/**
 * Check quota status for a specific meter.
 *
 * `GET {basePath}/quota/{meterId}`
 */
export async function checkMeteringQuota(
  client: AxiosInstance,
  basePath: string,
  meterId: MeterDefinitionId
): Promise<MeteringQuotaStatusResponse> {
  const response = await client.get<MeteringQuotaStatusResponse>(
    `${basePath}/quota/${encodeURIComponent(meterId)}`
  );
  return response.data;
}

/**
 * Record one or more usage events.
 *
 * `POST {basePath}/events`
 */
export async function recordUsageEvents(
  client: AxiosInstance,
  basePath: string,
  request: RecordUsageRequest
): Promise<void> {
  await client.post(`${basePath}/events`, request);
}
