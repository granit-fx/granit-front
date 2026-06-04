import { getPage, getQueryMeta } from '@granit/query-engine';

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
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { QueryMetadata } from '@granit/query-engine';

const METERS_SUBPATH = 'meters';
const USAGE_AGGREGATES_SUBPATH = 'usage-aggregates';

function metersQueryPath(basePath: string): string {
  return `${basePath}/${METERS_SUBPATH}`;
}

function usageAggregatesPath(basePath: string): string {
  return `${basePath}/${USAGE_AGGREGATES_SUBPATH}`;
}

function idempotencyConfig(idempotencyKey: string | undefined) {
  return idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined;
}

// ---------------------------------------------------------------------------
// Meter definitions — catalog + CRUD + lifecycle
// ---------------------------------------------------------------------------

/**
 * List the active meter catalog (Published meters only).
 *
 * `GET {basePath}/meters/active` — returns a plain array (no paged envelope).
 * For the admin grid with full lifecycle visibility, use {@link listMeterDefinitions}.
 */
export async function listActiveMeters(
  client: AxiosInstance,
  basePath: string
): Promise<readonly MeterDefinitionResponse[]> {
  const response = await client.get<readonly MeterDefinitionResponse[]>(`${basePath}/meters/active`);
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
 * Create a new meter definition. The meter starts in `Draft` status and must
 * be published before it accepts events.
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
 * Update a `Draft` meter definition. The aggregation type cannot be changed
 * after creation.
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
 * Publish a `Draft` meter definition (`Draft → Published`). Only `Published`
 * meters accept ingestion.
 *
 * `POST {basePath}/meters/{id}/publish`
 */
export async function publishMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/meters/${encodeURIComponent(id)}/publish`);
}

/**
 * Archive a `Published` meter definition (`Published → Archived`). Existing
 * aggregates are preserved; new ingestion is rejected.
 *
 * `POST {basePath}/meters/{id}/archive`
 */
export async function archiveMeterDefinition(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/meters/${encodeURIComponent(id)}/archive`);
}

/**
 * Recompute usage aggregates for a meter over the requested `[from, to)` window.
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

// ---------------------------------------------------------------------------
// Usage & quota
// ---------------------------------------------------------------------------

/**
 * Get the aggregated usage for a meter over a specific period. Returns the
 * single pre-computed aggregate matching the exact period bounds (the request
 * fails with 404 when none exists).
 *
 * `GET {basePath}/usage?meterId&periodStart&periodEnd`
 */
export async function getUsageForPeriod(
  client: AxiosInstance,
  basePath: string,
  meterId: string,
  periodStart: string,
  periodEnd: string
): Promise<UsageAggregateResponse> {
  const response = await client.get<UsageAggregateResponse>(`${basePath}/usage`, {
    params: { meterId, periodStart, periodEnd },
  });
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

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Record one or more usage events. The backend enforces network-level
 * idempotency via the `Idempotency-Key` header — pass `idempotencyKey` to
 * protect against batch replay.
 *
 * `POST {basePath}/events`
 */
export async function recordUsageEvents(
  client: AxiosInstance,
  basePath: string,
  request: RecordUsageRequest,
  idempotencyKey?: string
): Promise<void> {
  await client.post(`${basePath}/events`, request, idempotencyConfig(idempotencyKey));
}

/**
 * Backfill historical usage events (timestamps up to 365 days in the past).
 *
 * `POST {basePath}/events/backfill`
 */
export async function backfillUsageEvents(
  client: AxiosInstance,
  basePath: string,
  request: BackfillUsageRequest,
  idempotencyKey?: string
): Promise<BackfillUsageResponse> {
  const response = await client.post<BackfillUsageResponse>(
    `${basePath}/events/backfill`,
    request,
    idempotencyConfig(idempotencyKey)
  );
  return response.data;
}

/**
 * Soft-deprecate a single meter event so it stops contributing to aggregates.
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

// ---------------------------------------------------------------------------
// QueryEngine — meter definitions (admin grid: GET {basePath}/meters)
// ---------------------------------------------------------------------------

/**
 * List meter definitions via the QueryEngine admin grid (paginated, filterable,
 * full lifecycle visibility).
 *
 * `GET {basePath}/meters`
 */
export async function listMeterDefinitions(
  client: AxiosInstance,
  basePath: string,
  params?: MeterDefinitionListParams
): Promise<MeterDefinitionPage> {
  return getPage<MeterDefinition>(client, metersQueryPath(basePath), params ?? {});
}

/**
 * Get the QueryEngine metadata (columns, filterable fields, presets) for
 * meter definitions.
 *
 * `GET {basePath}/meters/meta`
 */
export async function getMeterDefinitionsQueryMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, metersQueryPath(basePath));
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
