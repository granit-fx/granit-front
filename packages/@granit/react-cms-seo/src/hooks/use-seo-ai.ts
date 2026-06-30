import {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from '@granit/cms-seo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logger } from '../logger';
import { useCmsSeoConfig } from '../providers/cms-seo-provider';

import { cmsSeoKeys } from './query-keys';

import type {
  SeoSuggestionApplyRequest,
  ListSeoSuggestionsParams,
  SeoSuggestionRejectRequest,
  SeoSuggestRequest,
  SeoSuggestResponse,
  SeoSuggestionResponse,
  SeoSuggestionDiff,
  SeoSuggestionListResponse,
} from '@granit/cms-seo';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export function useSeoSuggestions(
  params?: ListSeoSuggestionsParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SeoSuggestionListResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.suggestions.list(queryKeyPrefix, params),
    queryFn: () => listSeoSuggestions(client, basePath, params),
    enabled: options?.enabled ?? true,
  });
}

export function useSeoSuggestionDiff(
  id: string,
  options?: { readonly enabled?: boolean }
): UseQueryResult<SeoSuggestionDiff> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.suggestions.diff(queryKeyPrefix, id),
    queryFn: () => getSeoSuggestionDiff(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function useSuggestSeo(): UseMutationResult<SeoSuggestResponse, Error, SeoSuggestRequest> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => {
      logger.debug('Requesting SEO suggestion', {
        contentType: req.contentType,
        scope: req.scope,
      });
      return suggestSeo(client, basePath, req);
    },
    onSuccess: (data) => {
      logger.debug('SEO suggestion outcome', { outcome: data.outcome });
      qc.invalidateQueries({ queryKey: cmsSeoKeys.suggestions.all(queryKeyPrefix) });
    },
  });
}

export function useApplySeoSuggestion(): UseMutationResult<
  SeoSuggestionResponse,
  Error,
  { id: string; request: SeoSuggestionApplyRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => {
      logger.debug('Applying SEO suggestion', { id, fields: request.fields });
      return applySeoSuggestion(client, basePath, id, request);
    },
    onSuccess: (data) => {
      logger.info('SEO suggestion applied', { id: data.id, appliedFields: data.appliedFields });
      qc.setQueryData(cmsSeoKeys.suggestions.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsSeoKeys.suggestions.list(queryKeyPrefix) });
      // The apply writes live SEO metadata: refresh the raw/effective row, the
      // audit grid and the cascade-derived previews for the affected content.
      qc.invalidateQueries({ queryKey: cmsSeoKeys.metadata.all(queryKeyPrefix) });
      qc.invalidateQueries({ queryKey: cmsSeoKeys.audit.all(queryKeyPrefix) });
    },
  });
}

export function useRejectSeoSuggestion(): UseMutationResult<
  SeoSuggestionResponse,
  Error,
  { id: string; request?: SeoSuggestionRejectRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => {
      logger.debug('Rejecting SEO suggestion', { id });
      return rejectSeoSuggestion(client, basePath, id, request);
    },
    onSuccess: (data) => {
      qc.setQueryData(cmsSeoKeys.suggestions.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsSeoKeys.suggestions.list(queryKeyPrefix) });
    },
  });
}

export function useTriggerBulkSeoAudit(): UseMutationResult<void, Error, string> {
  const { client, basePath } = useCmsSeoConfig();
  return useMutation({
    mutationFn: (siteId) => triggerBulkSeoAudit(client, basePath, siteId),
  });
}
