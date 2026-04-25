import {
  archiveMeterDefinition,
  backfillUsageEvents,
  checkMeteringQuota,
  createMeterDefinition,
  deactivateMeterDefinition,
  deprecateMeterEvent,
  getMeterDefinition,
  getUsageForPeriod,
  listActiveMeters,
  publishMeterDefinition,
  recomputeMeterUsage,
  recordUsageEvents,
  updateMeterDefinition,
} from '@granit/metering';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildMeteringQueryKey, useMeteringConfig } from '../providers/metering-provider.js';

import type {
  BackfillUsageRequest,
  BackfillUsageResponse,
  DeprecateEventRequest,
  DeprecateEventResponse,
  MeterDefinitionCreateRequest,
  MeterDefinitionResponse,
  MeterDefinitionUpdateRequest,
  MeteringQuotaStatusResponse,
  RecomputeUsageRequest,
  RecomputeUsageResponse,
  RecordUsageRequest,
  UsageAggregateResponse,
} from '@granit/metering';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all active meter definitions.
 *
 * @example
 * ```tsx
 * const { data: meters } = useActiveMeters();
 * ```
 */
export function useActiveMeters(): UseQueryResult<readonly MeterDefinitionResponse[]> {
  const config = useMeteringConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildMeteringQueryKey(config, 'meters'),
    queryFn: () => listActiveMeters(config.client, basePath),
  });
}

/**
 * Get a single meter definition by ID.
 *
 * The query is automatically disabled when `id` is empty.
 *
 * @example
 * ```tsx
 * const { data: meter } = useMeterDefinition(selectedId);
 * ```
 */
export function useMeterDefinition(id: string): UseQueryResult<MeterDefinitionResponse> {
  const config = useMeteringConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildMeteringQueryKey(config, 'meters', id),
    queryFn: () => getMeterDefinition(config.client, basePath, id),
    enabled: id.length > 0,
  });
}

/**
 * Get aggregated usage for the current period.
 *
 * @example
 * ```tsx
 * const { data: usage } = useUsageForPeriod();
 * ```
 */
export function useUsageForPeriod(): UseQueryResult<readonly UsageAggregateResponse[]> {
  const config = useMeteringConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildMeteringQueryKey(config, 'usage'),
    queryFn: () => getUsageForPeriod(config.client, basePath),
  });
}

/**
 * Check quota status for a specific meter.
 *
 * The query is automatically disabled when `meterId` is empty.
 *
 * @example
 * ```tsx
 * const { data: quota } = useMeteringQuota(meterId);
 * ```
 */
export function useMeteringQuota(meterId: string): UseQueryResult<MeteringQuotaStatusResponse> {
  const config = useMeteringConfig();
  const basePath = config.basePath!;

  return useQuery({
    queryKey: buildMeteringQueryKey(config, 'quota', meterId),
    queryFn: () => checkMeteringQuota(config.client, basePath, meterId),
    enabled: meterId.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new meter definition.
 * Invalidates meters queries on success.
 *
 * @example
 * ```tsx
 * const create = useCreateMeterDefinition();
 * await create.mutateAsync({ name: 'API Calls', unit: 'calls', aggregationType: 'Sum', description: null });
 * ```
 */
export function useCreateMeterDefinition(): UseMutationResult<
  MeterDefinitionResponse,
  Error,
  MeterDefinitionCreateRequest
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: MeterDefinitionCreateRequest) =>
      createMeterDefinition(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'meters'),
      });
    },
  });
}

/** Variables for `useUpdateMeterDefinition`. */
export type UpdateMeterDefinitionVariables = {
  readonly id: string;
  readonly request: MeterDefinitionUpdateRequest;
};

/**
 * Update an existing meter definition.
 * Invalidates meters queries on success.
 *
 * @example
 * ```tsx
 * const update = useUpdateMeterDefinition();
 * await update.mutateAsync({ id: 'meter-1', request: { name: 'Updated', unit: 'calls', description: null } });
 * ```
 */
export function useUpdateMeterDefinition(): UseMutationResult<
  MeterDefinitionResponse,
  Error,
  UpdateMeterDefinitionVariables
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }: UpdateMeterDefinitionVariables) =>
      updateMeterDefinition(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'meters'),
      });
    },
  });
}

/**
 * Deactivate a meter definition.
 * Invalidates meters queries on success.
 *
 * @deprecated Use {@link useArchiveMeterDefinition} instead — the lifecycle action is
 * now `Publish → Archive`. The backend keeps the deactivate endpoint as an alias for
 * one release; this hook will be removed in the next major version.
 */
export function useDeactivateMeterDefinition(): UseMutationResult<void, Error, string> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: string) => deactivateMeterDefinition(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'meters'),
      });
    },
  });
}

/**
 * Publish a `Draft` meter definition. Only `Published` meters accept ingestion.
 * Invalidates meters queries on success.
 */
export function usePublishMeterDefinition(): UseMutationResult<
  MeterDefinitionResponse,
  Error,
  string
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: string) => publishMeterDefinition(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'meters') });
    },
  });
}

/**
 * Archive a `Published` meter definition. Existing aggregates remain readable;
 * new event ingestion is rejected.
 * Invalidates meters queries on success.
 */
export function useArchiveMeterDefinition(): UseMutationResult<
  MeterDefinitionResponse,
  Error,
  string
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (id: string) => archiveMeterDefinition(config.client, basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'meters') });
    },
  });
}

/** Variables for `useRecomputeMeterUsage`. */
export type RecomputeMeterUsageVariables = {
  readonly id: string;
  readonly request: RecomputeUsageRequest;
};

/**
 * Recompute the usage aggregates of a meter for an arbitrary time window.
 * Invalidates usage and quota queries on success.
 */
export function useRecomputeMeterUsage(): UseMutationResult<
  RecomputeUsageResponse,
  Error,
  RecomputeMeterUsageVariables
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }: RecomputeMeterUsageVariables) =>
      recomputeMeterUsage(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'usage') });
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'quota') });
    },
  });
}

/**
 * Backfill historical events older than the standard 7-day ingestion window
 * (up to 365 days). Triggers automatic recomputes; invalidates usage and quota
 * queries on success.
 */
export function useBackfillUsageEvents(): UseMutationResult<
  BackfillUsageResponse,
  Error,
  BackfillUsageRequest
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: BackfillUsageRequest) =>
      backfillUsageEvents(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'usage') });
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'quota') });
    },
  });
}

/** Variables for `useDeprecateMeterEvent`. */
export type DeprecateMeterEventVariables = {
  readonly id: string;
  readonly request: DeprecateEventRequest;
};

/**
 * Soft-deprecate an individual meter event. The event is preserved (audit
 * trail); the affected aggregate is auto-rebuilt without the deprecated
 * event's contribution. Invalidates usage and quota queries on success.
 */
export function useDeprecateMeterEvent(): UseMutationResult<
  DeprecateEventResponse,
  Error,
  DeprecateMeterEventVariables
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: ({ id, request }: DeprecateMeterEventVariables) =>
      deprecateMeterEvent(config.client, basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'usage') });
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'quota') });
    },
  });
}

/**
 * Record one or more usage events.
 * Invalidates usage and quota queries on success.
 *
 * @example
 * ```tsx
 * const record = useRecordUsageEvents();
 * await record.mutateAsync({ events: [{ meterDefinitionId: 'meter-1', idempotencyKey: 'key-1', quantity: 1, timestamp: new Date().toISOString(), metadata: null }] });
 * ```
 */
export function useRecordUsageEvents(): UseMutationResult<void, Error, RecordUsageRequest> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();
  const basePath = config.basePath!;

  return useMutation({
    mutationFn: (request: RecordUsageRequest) =>
      recordUsageEvents(config.client, basePath, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'usage'),
      });
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'quota'),
      });
    },
  });
}
