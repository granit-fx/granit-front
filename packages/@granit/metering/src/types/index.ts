import type { PagedResult, QueryRequest } from '@granit/query-engine';
import type { ISODateString, TenantId } from '@granit/types';

export type AggregationType = 'Sum' | 'Count' | 'Max' | 'Last';

export type AggregationPeriod = 'Hourly' | 'Daily' | 'BillingPeriod';

export interface MeterDefinitionCreateRequest {
  readonly name: string;
  readonly unit: string;
  readonly aggregationType: AggregationType;
  readonly description: string | null;
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

export interface MeterDefinitionResponse {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly description: string | null;
  readonly aggregationType: AggregationType;
  readonly activated: boolean;
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
  readonly activated: boolean;
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
