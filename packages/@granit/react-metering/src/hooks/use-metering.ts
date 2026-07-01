import {
  archiveMeterDefinition,
  backfillUsageEvents,
  checkMeteringQuota,
  createMeterDefinition,
  deprecateMeterEvent,
  getMeterDefinition,
  getUsageForPeriod,
  listActiveMeters,
  publishMeterDefinition,
  recomputeMeterUsage,
  recordUsageEvents,
  updateMeterDefinition,
} from '@granit/metering';
import { useQueryEndpoint } from '@granit/react-query-engine';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildMeteringQueryKey, useMeteringConfig } from '../providers/metering-provider';

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
  UsageAggregate,
  UsageAggregateResponse,
} from '@granit/metering';
import type { UseQueryEndpointOptions, UseQueryEndpointReturn } from '@granit/react-query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List the active meter catalog (Published meters only).
 *
 * @example
 * ```tsx
 * const { data: meters } = useActiveMeters();
 * ```
 */
export function useActiveMeters(): UseQueryResult<readonly MeterDefinitionResponse[]> {
  const config = useMeteringConfig();

  return useQuery({
    queryKey: buildMeteringQueryKey(config, 'meters'),
    queryFn: () => listActiveMeters(config.client, config.basePath),
  });
}

/**
 * QueryEngine endpoint for meter definitions ({@link MeterDefinitionResponse}),
 * backed by the `MapGranitQuery<MeterDefinitionResponse>()` group under
 * `{basePath}/meters`. Owns the pagination / filter / sort / group-by state and
 * exposes the dispatchers plus the paged result — the standard surface for the
 * interactive meter catalog grid.
 *
 * Unlike {@link useActiveMeters} (Published-only, unpaginated array), this lists
 * ALL meters server-side paginated and filterable — the admin grid surface. Must
 * be used within a {@link MeteringProvider}, which wires the inner `QueryProvider`.
 *
 * @example
 * ```tsx
 * const { query, params, setPage, setPageSize } = useMetersQuery();
 * query.data?.items.map((meter) => meter.name);
 * ```
 */
export function useMetersQuery(
  options?: UseQueryEndpointOptions
): UseQueryEndpointReturn<MeterDefinitionResponse> {
  return useQueryEndpoint<MeterDefinitionResponse>(options);
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

  return useQuery({
    queryKey: buildMeteringQueryKey(config, 'meters', id),
    queryFn: () => getMeterDefinition(config.client, config.basePath, id),
    enabled: id.length > 0,
  });
}

/** Identifies the meter + period bounds for {@link useUsageForPeriod}. */
export interface UsageForPeriodParams {
  readonly meterId: string;
  /** ISO 8601 inclusive lower bound of the aggregation period. */
  readonly periodStart: string;
  /** ISO 8601 exclusive upper bound of the aggregation period. */
  readonly periodEnd: string;
}

/**
 * Get the pre-computed usage aggregate for a meter over a specific period.
 *
 * The query is disabled until `params` is provided (non-null). The backend
 * returns the single aggregate matching the exact period bounds.
 *
 * @example
 * ```tsx
 * const { data: usage } = useUsageForPeriod({ meterId, periodStart, periodEnd });
 * ```
 */
export function useUsageForPeriod(
  params: UsageForPeriodParams | null
): UseQueryResult<UsageAggregateResponse> {
  const config = useMeteringConfig();

  return useQuery({
    queryKey: buildMeteringQueryKey(
      config,
      'usage',
      params?.meterId ?? '',
      params?.periodStart ?? '',
      params?.periodEnd ?? ''
    ),
    queryFn: () =>
      getUsageForPeriod(
        config.client,
        config.basePath,
        params!.meterId,
        params!.periodStart,
        params!.periodEnd
      ),
    enabled: params !== null,
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

  return useQuery({
    queryKey: buildMeteringQueryKey(config, 'quota', meterId),
    queryFn: () => checkMeteringQuota(config.client, config.basePath, meterId),
    enabled: meterId.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new meter definition (starts in `Draft` status).
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

  return useMutation({
    mutationFn: (request: MeterDefinitionCreateRequest) =>
      createMeterDefinition(config.client, config.basePath, request),
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
 * Update a `Draft` meter definition.
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

  return useMutation({
    mutationFn: ({ id, request }: UpdateMeterDefinitionVariables) =>
      updateMeterDefinition(config.client, config.basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'meters'),
      });
    },
  });
}

/**
 * Publish a `Draft` meter definition (`Draft → Published`).
 * Invalidates meters queries on success.
 *
 * @example
 * ```tsx
 * const publish = usePublishMeterDefinition();
 * await publish.mutateAsync('meter-1');
 * ```
 */
export function usePublishMeterDefinition(): UseMutationResult<void, Error, string> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => publishMeterDefinition(config.client, config.basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'meters'),
      });
    },
  });
}

/**
 * Archive a `Published` meter definition (`Published → Archived`).
 * Invalidates meters queries on success.
 *
 * @example
 * ```tsx
 * const archive = useArchiveMeterDefinition();
 * await archive.mutateAsync('meter-1');
 * ```
 */
export function useArchiveMeterDefinition(): UseMutationResult<void, Error, string> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveMeterDefinition(config.client, config.basePath, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'meters'),
      });
    },
  });
}

/**
 * Record one or more usage events. A fresh `Idempotency-Key` is generated per
 * mutation to protect the batch against network-level replay.
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

  return useMutation({
    mutationFn: (request: RecordUsageRequest) =>
      recordUsageEvents(config.client, config.basePath, request, crypto.randomUUID()),
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

/**
 * Backfill historical usage events (timestamps up to 365 days in the past). A
 * fresh `Idempotency-Key` is generated per mutation to protect the batch
 * against network-level replay. Invalidates usage, quota and usage-aggregate
 * queries on success.
 *
 * @example
 * ```tsx
 * const backfill = useBackfillUsageEvents();
 * await backfill.mutateAsync({ events: [...] });
 * ```
 */
export function useBackfillUsageEvents(): UseMutationResult<
  BackfillUsageResponse,
  Error,
  BackfillUsageRequest
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BackfillUsageRequest) =>
      backfillUsageEvents(config.client, config.basePath, request, crypto.randomUUID()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'usage') });
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'quota') });
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'usage-aggregates'),
      });
    },
  });
}

/** Variables for `useDeprecateMeterEvent`. */
export type DeprecateMeterEventVariables = {
  readonly id: string;
  readonly request: DeprecateEventRequest;
};

/**
 * Soft-deprecate a single meter event so it stops contributing to aggregates.
 * Invalidates usage and usage-aggregate queries on success.
 *
 * @example
 * ```tsx
 * const deprecate = useDeprecateMeterEvent();
 * await deprecate.mutateAsync({ id: 'event-1', request: { reason: 'Duplicate' } });
 * ```
 */
export function useDeprecateMeterEvent(): UseMutationResult<
  DeprecateEventResponse,
  Error,
  DeprecateMeterEventVariables
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: DeprecateMeterEventVariables) =>
      deprecateMeterEvent(config.client, config.basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'usage') });
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'usage-aggregates'),
      });
    },
  });
}

/** Variables for `useRecomputeMeterUsage`. */
export type RecomputeMeterUsageVariables = {
  readonly id: string;
  readonly request: RecomputeUsageRequest;
};

/**
 * Recompute usage aggregates for a meter over the requested `[from, to)`
 * window. Invalidates usage and usage-aggregate queries on success.
 *
 * @example
 * ```tsx
 * const recompute = useRecomputeMeterUsage();
 * await recompute.mutateAsync({ id: 'meter-1', request: { from, to } });
 * ```
 */
export function useRecomputeMeterUsage(): UseMutationResult<
  RecomputeUsageResponse,
  Error,
  RecomputeMeterUsageVariables
> {
  const config = useMeteringConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: RecomputeMeterUsageVariables) =>
      recomputeMeterUsage(config.client, config.basePath, id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildMeteringQueryKey(config, 'usage') });
      queryClient.invalidateQueries({
        queryKey: buildMeteringQueryKey(config, 'usage-aggregates'),
      });
    },
  });
}

/**
 * QueryEngine endpoint for usage aggregates ({@link UsageAggregate}), backed by
 * the `MapGranitQuery<UsageAggregate>()` group under `{basePath}/usage-aggregates`.
 * Owns the pagination / filter / sort / group-by state and exposes the
 * dispatchers plus the paged result — the standard surface for the interactive
 * usage grid.
 *
 * Must be used within the usage-aggregates {@link QueryProvider} scope wired by
 * `MeteringUsagePage` (a sibling grid to the meter catalog).
 *
 * @example
 * ```tsx
 * const { query, params, setPage } = useUsageAggregatesQuery();
 * query.data?.items.map((agg) => agg.aggregatedValue);
 * ```
 */
export function useUsageAggregatesQuery(
  options?: UseQueryEndpointOptions
): UseQueryEndpointReturn<UsageAggregate> {
  return useQueryEndpoint<UsageAggregate>(options);
}
