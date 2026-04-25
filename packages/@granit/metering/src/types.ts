import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

/**
 * Supported aggregation strategies. `CountDistinct` requires
 * {@link MeterDefinitionResponse.distinctProperty} to be set.
 */
export type AggregationType = 'Sum' | 'Count' | 'Max' | 'Last' | 'CountDistinct';

export type AggregationPeriod = 'Hourly' | 'Daily' | 'BillingPeriod';

/** Workflow lifecycle status of a meter definition (mirrors Granit.Workflow). */
export type MeterLifecycleStatus = 'Draft' | 'Published' | 'Archived';

export interface MeterDefinitionCreateRequest {
  readonly name: string;
  readonly unit: string;
  readonly aggregationType: AggregationType;
  readonly description?: string | null;
  /**
   * Optional reference to a `Granit.Catalog.Product` identifier — the
   * catalog item this meter measures. Soft reference (no SQL FK across modules).
   */
  readonly productId?: string | null;
  /**
   * JSON property name inside `MeterEvent.metadata` whose distinct values
   * are counted. **Required** when `aggregationType === 'CountDistinct'`;
   * must be omitted (or `null`) for any other aggregation type.
   */
  readonly distinctProperty?: string | null;
}

export interface MeterDefinitionUpdateRequest {
  readonly name: string;
  readonly unit: string;
  readonly description?: string | null;
}

export interface MeterEventRequest {
  readonly meterDefinitionId: string;
  readonly idempotencyKey: string;
  readonly quantity: number;
  readonly timestamp: string;
  readonly metadata: string | null;
}

export interface RecordUsageRequest {
  readonly events: readonly MeterEventRequest[];
}

export interface MeterDefinitionResponse {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly description: string | null;
  readonly aggregationType: AggregationType;
  /**
   * @deprecated Removed in next major release.
   * Use {@link lifecycleStatus} instead — `activated === true` iff
   * `lifecycleStatus === 'Published'`.
   */
  readonly activated: boolean;
  /** Optional `Granit.Catalog.Product` reference (soft, no SQL FK). */
  readonly productId: string | null;
  /** Workflow lifecycle status. Only `Published` meters accept ingestion. */
  readonly lifecycleStatus: MeterLifecycleStatus;
  /** JSON property name counted distinctly when `aggregationType === 'CountDistinct'`. */
  readonly distinctProperty: string | null;
}

// ---------------------------------------------------------------------------
// Recompute / backfill / deprecate (admin operations on usage data)
// ---------------------------------------------------------------------------

/** Request body for `POST {basePath}/meters/{id}/recompute`. */
export interface RecomputeUsageRequest {
  /** Inclusive lower bound of the recompute window (UTC, ISO 8601). */
  readonly from: string;
  /** Exclusive upper bound of the recompute window (UTC, ISO 8601). */
  readonly to: string;
}

/** Response from a recompute invocation. */
export interface RecomputeUsageResponse {
  readonly meterDefinitionId: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly eventsScanned: number;
  readonly aggregatesRebuilt: number;
  readonly durationMilliseconds: number;
}

/**
 * Request body for `POST {basePath}/events/backfill` — same shape as
 * {@link RecordUsageRequest} but accepts events up to 365 days old.
 */
export interface BackfillUsageRequest {
  readonly events: readonly MeterEventRequest[];
}

/** Response from a backfill batch. */
export interface BackfillUsageResponse {
  readonly eventsAccepted: number;
  readonly metersAffected: number;
  readonly aggregatesRebuilt: number;
}

/** Request body for `POST {basePath}/events/{id}/deprecate`. */
export interface DeprecateEventRequest {
  /** Free-text justification (max 500 chars; audit log + admin UI). */
  readonly reason: string;
}

/** Response from a successful event deprecation. */
export interface DeprecateEventResponse {
  readonly eventId: string;
  readonly meterDefinitionId: string;
  readonly deprecatedAt: string;
  readonly aggregatesRebuilt: number;
}

export interface UsageAggregateResponse {
  readonly id: string;
  readonly meterDefinitionId: string;
  readonly period: AggregationPeriod;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly aggregatedValue: number;
  readonly eventCount: number;
}

export interface MeteringQuotaStatusResponse {
  readonly meterName: string;
  readonly currentUsage: number;
  readonly limit: number | null;
  readonly percentUsed: number | null;
  readonly isExceeded: boolean;
}

// ---------------------------------------------------------------------------
// QueryEngine entities — raw (non-projected) shapes returned by
// `GET /meter-definitions` and `GET /usage-aggregates`.
// ---------------------------------------------------------------------------

/**
 * Meter definition entity as returned by the QueryEngine endpoint.
 *
 * Distinct from {@link MeterDefinitionResponse}: the query endpoint returns the
 * raw entity (including `tenantId`, `createdAt`, `modifiedAt`) without the
 * projection applied by the CRUD endpoints.
 */
export interface MeterDefinition {
  readonly id: string;
  readonly tenantId: TenantId | null;
  readonly name: string;
  readonly unit: string;
  readonly aggregationType: AggregationType;
  /** @deprecated Use {@link lifecycleStatus} — `activated === lifecycleStatus === 'Published'`. */
  readonly activated: boolean;
  readonly lifecycleStatus: MeterLifecycleStatus;
  readonly distinctProperty: string | null;
  readonly productId: string | null;
  readonly createdAt: ISODateString;
  readonly modifiedAt: ISODateString;
}

/**
 * Usage aggregate entity as returned by the QueryEngine endpoint.
 *
 * Includes `tenantId` (may be null on host-admin cross-tenant queries) which
 * is absent from the realtime {@link UsageAggregateResponse} DTO.
 */
export interface UsageAggregate {
  readonly id: string;
  readonly tenantId: TenantId | null;
  readonly meterDefinitionId: string;
  readonly period: AggregationPeriod;
  readonly periodStart: ISODateString;
  readonly periodEnd: ISODateString;
  readonly aggregatedValue: number;
  readonly eventCount: number;
}

/** Paginated page of {@link MeterDefinition} entities. */
export type MeterDefinitionPage = PagedResult<MeterDefinition>;

/** Paginated page of {@link UsageAggregate} entities. */
export type UsageAggregatePage = PagedResult<UsageAggregate>;

/** Query parameters accepted by `GET /meter-definitions`. */
export type MeterDefinitionListParams = QueryRequest;

/** Query parameters accepted by `GET /usage-aggregates`. */
export type UsageAggregateListParams = QueryRequest;
