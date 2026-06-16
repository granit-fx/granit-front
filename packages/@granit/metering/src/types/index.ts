import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

/**
 * How meter events are aggregated into rollups. Mirrors
 * `Granit.Metering.Domain.AggregationType` (serialized to its string name).
 */
export type AggregationType = 'Sum' | 'Max' | 'Count' | 'Last' | 'CountDistinct';

export type AggregationPeriod = 'Hourly' | 'Daily' | 'BillingPeriod';

/**
 * Lifecycle status of a meter definition. Mirrors the reachable subset of
 * `Granit.Workflow.Domain.WorkflowLifecycleStatus` for `MeterDefinition`: the
 * state machine is `Draft → Published → Archived`. Only `Published` meters
 * accept ingestion.
 */
export type MeterLifecycleStatus = 'Draft' | 'Published' | 'Archived';

export interface MeterDefinitionCreateRequest {
  readonly name: string;
  readonly unit: string;
  readonly aggregationType: AggregationType;
  readonly description?: string | null;
  /** Optional soft reference to a `Granit.Catalog.Product` identifier (no SQL FK). */
  readonly productId?: string | null;
  /**
   * JSON property name inside `MeterEvent.metadata` whose distinct values are
   * counted. Required when `aggregationType === 'CountDistinct'`; `null` otherwise.
   */
  readonly distinctProperty?: string | null;
}

export interface MeterDefinitionUpdateRequest {
  readonly name: string;
  readonly unit: string;
  readonly description: string | null;
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

/**
 * Historical events with timestamps up to 365 days in the past. Distinct from
 * {@link RecordUsageRequest} so the backend can apply the backfill-specific
 * (≤365-day) validator.
 */
export interface BackfillUsageRequest {
  readonly events: readonly MeterEventRequest[];
}

export interface MeterDefinitionResponse {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly description: string | null;
  readonly aggregationType: AggregationType;
  /** Optional soft reference to a `Granit.Catalog.Product` identifier. */
  readonly productId: string | null;
  /** Current lifecycle status. Only `Published` meters accept ingestion. */
  readonly lifecycleStatus: MeterLifecycleStatus;
  /** Set when `aggregationType === 'CountDistinct'`; `null` otherwise. */
  readonly distinctProperty: string | null;
}

export interface UsageAggregateResponse {
  readonly id: string;
  readonly meterDefinitionId: string;
  readonly period: AggregationPeriod;
  readonly periodStart: ISODateString;
  readonly periodEnd: ISODateString;
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
// Lifecycle / maintenance endpoint DTOs
// ---------------------------------------------------------------------------

/** Window (`[from, to)`) over which to recompute a meter's usage aggregates. */
export interface RecomputeUsageRequest {
  readonly from: string;
  readonly to: string;
}

export interface RecomputeUsageResponse {
  readonly meterDefinitionId: string;
  readonly windowStart: ISODateString;
  readonly windowEnd: ISODateString;
  readonly eventsScanned: number;
  readonly aggregatesRebuilt: number;
  readonly durationMilliseconds: number;
}

export interface BackfillUsageResponse {
  readonly eventsAccepted: number;
  readonly metersAffected: number;
  readonly aggregatesRebuilt: number;
}

/** Soft-deprecate a single meter event (audit-safe alternative to DELETE). */
export interface DeprecateEventRequest {
  readonly reason: string;
}

export interface DeprecateEventResponse {
  readonly eventId: string;
  readonly meterDefinitionId: string;
  readonly deprecatedAt: ISODateString;
  readonly aggregatesRebuilt: number;
}

// ---------------------------------------------------------------------------
// QueryEngine entities — raw (non-projected) shapes returned by the
// `GET /meters` and `GET /usage-aggregates` QueryEngine endpoints.
// ---------------------------------------------------------------------------

/**
 * Meter definition entity as returned by the QueryEngine admin grid.
 *
 * Distinct from {@link MeterDefinitionResponse}: the query endpoint returns the
 * raw audited entity (including `tenantId` and audit columns) without the
 * projection applied by the CRUD endpoints.
 */
export interface MeterDefinition {
  readonly name: string;
  readonly unit: string;
  readonly description: string | null;
  readonly aggregationType: AggregationType;
  readonly distinctProperty: string | null;
  readonly lifecycleStatus: MeterLifecycleStatus;
  readonly productId: string | null;
  readonly tenantId: TenantId | null;
  readonly modifiedAt: ISODateString | null;
  readonly modifiedBy: string | null;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
  readonly id: string;
}

/**
 * Usage aggregate entity as returned by the QueryEngine endpoint.
 *
 * Includes `tenantId` (may be null on host-admin cross-tenant queries) which
 * is absent from the realtime {@link UsageAggregateResponse} DTO. Not an
 * audited entity — no `createdAt` / `modifiedAt`.
 */
export interface UsageAggregate {
  readonly meterDefinitionId: string;
  readonly period: AggregationPeriod;
  readonly periodStart: ISODateString;
  readonly periodEnd: ISODateString;
  readonly aggregatedValue: number;
  readonly eventCount: number;
  readonly tenantId: TenantId | null;
  readonly id: string;
}

/** Paginated page of {@link MeterDefinition} entities. */
export type MeterDefinitionPage = PagedResult<MeterDefinition>;

/** Paginated page of {@link UsageAggregate} entities. */
export type UsageAggregatePage = PagedResult<UsageAggregate>;

/** Query parameters accepted by `GET /meters` (QueryEngine admin grid). */
export type MeterDefinitionListParams = QueryRequest;

/** Query parameters accepted by `GET /usage-aggregates`. */
export type UsageAggregateListParams = QueryRequest;
