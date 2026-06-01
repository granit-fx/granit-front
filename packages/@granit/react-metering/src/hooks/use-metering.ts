import {
  checkMeteringQuota,
  createMeterDefinition,
  deactivateMeterDefinition,
  getMeterDefinition,
  getUsageForPeriod,
  listActiveMeters,
  recordUsageEvents,
  updateMeterDefinition,
} from '@granit/metering';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildMeteringQueryKey, useMeteringConfig } from '../providers/metering-provider';

import type {
  MeterDefinitionCreateRequest,
  MeterDefinitionResponse,
  MeterDefinitionUpdateRequest,
  MeteringQuotaStatusResponse,
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
 * @example
 * ```tsx
 * const deactivate = useDeactivateMeterDefinition();
 * await deactivate.mutateAsync('meter-1');
 * ```
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
