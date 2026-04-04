import type { EntityId, ISODateString } from '@granit/types';

export type MeterDefinitionId = EntityId<'MeterDefinition'>;
export type UsageAggregateId = EntityId<'UsageAggregate'>;

export type AggregationType = 'Sum' | 'Count' | 'Max' | 'Last' | 'UniqueCount';

export type AggregationPeriod = 'Hourly' | 'Daily' | 'Monthly';

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
  readonly meterDefinitionId: MeterDefinitionId;
  readonly idempotencyKey: string;
  readonly quantity: number;
  readonly timestamp: ISODateString;
  readonly metadata: string | null;
}

export interface RecordUsageRequest {
  readonly events: readonly MeterEventRequest[];
}

export interface MeterDefinitionResponse {
  readonly id: MeterDefinitionId;
  readonly name: string;
  readonly unit: string;
  readonly description: string | null;
  readonly aggregationType: AggregationType;
  readonly isActive: boolean;
}

export interface UsageAggregateResponse {
  readonly id: UsageAggregateId;
  readonly meterDefinitionId: MeterDefinitionId;
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
