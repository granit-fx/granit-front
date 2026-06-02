import {
  deleteSeoMetadata,
  invalidateSitemap,
  updateSeoDefaults,
  upsertSeoMetadata,
} from '@granit/cms-seo';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCmsSeoConfig } from '../providers/cms-seo-provider';

import { cmsSeoKeys } from './query-keys';

import type {
  SeoMetadataRequest,
  SeoMetadataResponse,
  SiteSeoDefaultsRequest,
  SiteSeoDefaultsResponse,
} from '@granit/cms-seo';
import type { UseMutationResult } from '@tanstack/react-query';

interface SeoContentKey {
  readonly siteId: string;
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string;
}

export function useUpsertSeoMetadata(): UseMutationResult<
  SeoMetadataResponse,
  Error,
  { key: SeoContentKey; request: SeoMetadataRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, request }) => upsertSeoMetadata(client, basePath, key, request),
    onSuccess: (data, { key }) => {
      qc.setQueryData(cmsSeoKeys.metadata.detail(queryKeyPrefix, key), data);
      qc.invalidateQueries({ queryKey: cmsSeoKeys.metadata.serp(queryKeyPrefix, key) });
      qc.invalidateQueries({ queryKey: cmsSeoKeys.metadata.og(queryKeyPrefix, key) });
      qc.invalidateQueries({ queryKey: cmsSeoKeys.metadata.jsonld(queryKeyPrefix, key) });
    },
  });
}

export function useDeleteSeoMetadata(): UseMutationResult<void, Error, SeoContentKey> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key) => deleteSeoMetadata(client, basePath, key),
    onSuccess: (_data, key) => {
      qc.removeQueries({ queryKey: cmsSeoKeys.metadata.detail(queryKeyPrefix, key) });
      qc.invalidateQueries({ queryKey: cmsSeoKeys.audit.list(queryKeyPrefix) });
    },
  });
}

export function useUpdateSeoDefaults(): UseMutationResult<
  SiteSeoDefaultsResponse,
  Error,
  { siteId: string; request: SiteSeoDefaultsRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ siteId, request }) => updateSeoDefaults(client, basePath, siteId, request),
    onSuccess: (data, { siteId }) => {
      qc.setQueryData(cmsSeoKeys.defaults.detail(queryKeyPrefix, siteId), data);
    },
  });
}

export function useInvalidateSitemap(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useCmsSeoConfig();
  return useMutation({
    mutationFn: (siteId) => invalidateSitemap(client, basePath, siteId),
  });
}
