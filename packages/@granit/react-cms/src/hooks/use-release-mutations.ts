import {
  addReleaseAction,
  cancelRelease,
  createRelease,
  deleteRelease,
  publishRelease,
  removeReleaseAction,
  scheduleRelease,
  updateRelease,
} from '@granit/cms';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsConfig } from '../providers/cms-provider';

import { cmsKeys } from './query-keys';

import type {
  AddReleaseActionRequest,
  CreateReleaseRequest,
  ReleaseResponse,
  ScheduleReleaseRequest,
  UpdateReleaseRequest,
} from '@granit/cms';
import type { UseMutationResult } from '@tanstack/react-query';

export function useCreateRelease(): UseMutationResult<
  ReleaseResponse,
  Error,
  CreateReleaseRequest
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => createRelease(client, basePath, req),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: cmsKeys.releases.list(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useUpdateRelease(): UseMutationResult<
  ReleaseResponse,
  Error,
  { id: string; request: UpdateReleaseRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => updateRelease(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.releases.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsKeys.releases.list(queryKeyPrefix, data.siteId) });
    },
  });
}

export function useDeleteRelease(): UseMutationResult<void, Error, { id: string; siteId: string }> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteRelease(client, basePath, id),
    onSuccess: (_data, { id, siteId }) => {
      qc.removeQueries({ queryKey: cmsKeys.releases.detail(queryKeyPrefix, id) });
      qc.invalidateQueries({ queryKey: cmsKeys.releases.list(queryKeyPrefix, siteId) });
    },
  });
}

export function useAddReleaseAction(): UseMutationResult<
  ReleaseResponse,
  Error,
  { id: string; request: AddReleaseActionRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => addReleaseAction(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.releases.detail(queryKeyPrefix, data.id), data);
    },
  });
}

export function useRemoveReleaseAction(): UseMutationResult<
  void,
  Error,
  { id: string; actionId: string }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionId }) => removeReleaseAction(client, basePath, id, actionId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.releases.detail(queryKeyPrefix, id) });
    },
  });
}

export function useScheduleRelease(): UseMutationResult<
  ReleaseResponse,
  Error,
  { id: string; request: ScheduleReleaseRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => scheduleRelease(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.releases.detail(queryKeyPrefix, data.id), data);
    },
  });
}

export function useCancelRelease(): UseMutationResult<void, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => cancelRelease(client, basePath, id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: cmsKeys.releases.detail(queryKeyPrefix, id) });
    },
  });
}

export function usePublishRelease(): UseMutationResult<ReleaseResponse, Error, string> {
  const { client, basePath, queryKeyPrefix } = useCmsConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => publishRelease(client, basePath, id),
    onSuccess: (data) => {
      qc.setQueryData(cmsKeys.releases.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsKeys.releases.list(queryKeyPrefix, data.siteId) });
    },
  });
}
