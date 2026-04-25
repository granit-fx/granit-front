import {
  createSavedView,
  deleteSavedView,
  getPage,
  getQueryMeta,
  listSavedViews,
  setDefaultSavedView,
  updateSavedView,
} from '@granit/query-engine';

import type {
  BackfillUsageRequest,
  BackfillUsageResponse,
  DeprecateEventRequest,
  DeprecateEventResponse,
  MeterDefinition,
  MeterDefinitionCreateRequest,
  MeterDefinitionListParams,
  MeterDefinitionPage,
  MeterDefinitionResponse,
  MeterDefinitionUpdateRequest,
  MeteringQuotaStatusResponse,
  RecomputeUsageRequest,
  RecomputeUsageResponse,
  RecordUsageRequest,
  UsageAggregate,
  UsageAggregateListParams,
  UsageAggregatePage,
  UsageAggregateResponse,
} from '../types.js';
import type {
  CreateSavedViewRequest,
  QueryMetadata,
  SavedViewSummary,
  UpdateSavedViewRequest,
} from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

const METER_DEFINITIONS_SUBPATH = 'meter-definitions';
const USAGE_AGGREGATES_SUBPATH = 'usage-aggregates';

function meterDefinitionsPath(basePath: string): string {
  return `${basePath}/${METER_DEFINITIONS_SUBPATH}`;
}

function usageAggregatesPath(basePath: string): string {
  return `${basePath}/${USAGE_AGGREGATES_SUBPATH}`;
}

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
  id: string
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
  id: string,
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
 *
 * @deprecated Use {@link archiveMeterDefinition} instead. This endpoint
 * remains a backend alias for one release; the lifecycle action is now
 * `Publish → Archive` (see {@link MeterLifecycleStatus}).
 */
export async function deactivateMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/meters/${encodeURIComponent(id)}/deactivate`);
}

/**
 * Publish a `Draft` meter definition. Only `Published` meters accept ingestion.
 *
 * `POST {basePath}/meters/{id}/publish`
 */
export async function publishMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<MeterDefinitionResponse> {
  const response = await client.post<MeterDefinitionResponse>(
    `${basePath}/meters/${encodeURIComponent(id)}/publish`
  );
  return response.data;
}

/**
 * Archive a `Published` meter definition. Existing aggregates remain readable;
 * new event ingestion is rejected.
 *
 * `POST {basePath}/meters/{id}/archive`
 */
export async function archiveMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<MeterDefinitionResponse> {
  const response = await client.post<MeterDefinitionResponse>(
    `${basePath}/meters/${encodeURIComponent(id)}/archive`
  );
  return response.data;
}

/**
 * Recompute the usage aggregates for a meter over an arbitrary window.
 * Window edges are snapped to hourly buckets server-side; the global ingestion
 * watermark is never rewound — concurrent ingestion past `to` is unaffected.
 *
 * `POST {basePath}/meters/{id}/recompute`
 */
export async function recomputeMeterUsage(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RecomputeUsageRequest
): Promise<RecomputeUsageResponse> {
  const response = await client.post<RecomputeUsageResponse>(
    `${basePath}/meters/${encodeURIComponent(id)}/recompute`,
    request
  );
  return response.data;
}

/**
 * Backfill historical events older than the standard 7-day ingestion window
 * (up to 365 days). Triggers automatic recomputes on past `UsageAggregate` rows.
 *
 * `POST {basePath}/events/backfill`
 */
export async function backfillUsageEvents(
  client: AxiosInstance,
  basePath: string,
  request: BackfillUsageRequest
): Promise<BackfillUsageResponse> {
  const response = await client.post<BackfillUsageResponse>(`${basePath}/events/backfill`, request);
  return response.data;
}

/**
 * Soft-deprecate an individual meter event. The event row is preserved
 * (audit trail); the affected hourly aggregate is auto-rebuilt without the
 * deprecated event's contribution.
 *
 * `POST {basePath}/events/{id}/deprecate`
 */
export async function deprecateMeterEvent(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: DeprecateEventRequest
): Promise<DeprecateEventResponse> {
  const response = await client.post<DeprecateEventResponse>(
    `${basePath}/events/${encodeURIComponent(id)}/deprecate`,
    request
  );
  return response.data;
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
  meterId: string
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

// ---------------------------------------------------------------------------
// QueryEngine — meter definitions
// ---------------------------------------------------------------------------

/**
 * List meter definitions via the QueryEngine endpoint (paginated, filterable).
 *
 * `GET {basePath}/meter-definitions`
 */
export async function listMeterDefinitions(
  client: AxiosInstance,
  basePath: string,
  params?: MeterDefinitionListParams
): Promise<MeterDefinitionPage> {
  return getPage<MeterDefinition>(client, meterDefinitionsPath(basePath), params ?? {});
}

/**
 * Get the QueryEngine metadata (columns, filterable fields, presets) for
 * meter definitions.
 *
 * `GET {basePath}/meter-definitions/meta`
 */
export async function getMeterDefinitionsQueryMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, meterDefinitionsPath(basePath));
}

/**
 * List saved views for the meter definitions query endpoint.
 *
 * `GET {basePath}/meter-definitions/saved-views`
 */
export async function listMeterDefinitionsSavedViews(
  client: AxiosInstance,
  basePath: string
): Promise<SavedViewSummary[]> {
  return listSavedViews(client, meterDefinitionsPath(basePath));
}

/**
 * Create a saved view for the meter definitions query endpoint.
 *
 * `POST {basePath}/meter-definitions/saved-views`
 */
export async function createMeterDefinitionsSavedView(
  client: AxiosInstance,
  basePath: string,
  request: CreateSavedViewRequest
): Promise<SavedViewSummary> {
  return createSavedView(client, meterDefinitionsPath(basePath), request);
}

/**
 * Update a saved view on the meter definitions query endpoint.
 *
 * `PUT {basePath}/meter-definitions/saved-views/{id}`
 */
export async function updateMeterDefinitionsSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateSavedViewRequest
): Promise<void> {
  await updateSavedView(client, meterDefinitionsPath(basePath), id, request);
}

/**
 * Delete a saved view from the meter definitions query endpoint.
 *
 * `DELETE {basePath}/meter-definitions/saved-views/{id}`
 */
export async function deleteMeterDefinitionsSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await deleteSavedView(client, meterDefinitionsPath(basePath), id);
}

/**
 * Set a saved view as the default for the meter definitions query endpoint.
 *
 * `POST {basePath}/meter-definitions/saved-views/{id}/set-default`
 */
export async function setDefaultMeterDefinitionsSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await setDefaultSavedView(client, meterDefinitionsPath(basePath), id);
}

// ---------------------------------------------------------------------------
// QueryEngine — usage aggregates
// ---------------------------------------------------------------------------

/**
 * List usage aggregates via the QueryEngine endpoint (paginated, filterable).
 *
 * `GET {basePath}/usage-aggregates`
 */
export async function listUsageAggregates(
  client: AxiosInstance,
  basePath: string,
  params?: UsageAggregateListParams
): Promise<UsageAggregatePage> {
  return getPage<UsageAggregate>(client, usageAggregatesPath(basePath), params ?? {});
}

/**
 * Get the QueryEngine metadata (columns, filterable fields, presets) for
 * usage aggregates.
 *
 * `GET {basePath}/usage-aggregates/meta`
 */
export async function getUsageAggregatesQueryMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, usageAggregatesPath(basePath));
}

/**
 * List saved views for the usage aggregates query endpoint.
 *
 * `GET {basePath}/usage-aggregates/saved-views`
 */
export async function listUsageAggregatesSavedViews(
  client: AxiosInstance,
  basePath: string
): Promise<SavedViewSummary[]> {
  return listSavedViews(client, usageAggregatesPath(basePath));
}

/**
 * Create a saved view for the usage aggregates query endpoint.
 *
 * `POST {basePath}/usage-aggregates/saved-views`
 */
export async function createUsageAggregatesSavedView(
  client: AxiosInstance,
  basePath: string,
  request: CreateSavedViewRequest
): Promise<SavedViewSummary> {
  return createSavedView(client, usageAggregatesPath(basePath), request);
}

/**
 * Update a saved view on the usage aggregates query endpoint.
 *
 * `PUT {basePath}/usage-aggregates/saved-views/{id}`
 */
export async function updateUsageAggregatesSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateSavedViewRequest
): Promise<void> {
  await updateSavedView(client, usageAggregatesPath(basePath), id, request);
}

/**
 * Delete a saved view from the usage aggregates query endpoint.
 *
 * `DELETE {basePath}/usage-aggregates/saved-views/{id}`
 */
export async function deleteUsageAggregatesSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await deleteSavedView(client, usageAggregatesPath(basePath), id);
}

/**
 * Set a saved view as the default for the usage aggregates query endpoint.
 *
 * `POST {basePath}/usage-aggregates/saved-views/{id}/set-default`
 */
export async function setDefaultUsageAggregatesSavedView(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await setDefaultSavedView(client, usageAggregatesPath(basePath), id);
}
