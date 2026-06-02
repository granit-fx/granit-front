import {
  applySeoSuggestion,
  getSeoSuggestionDiff,
  listSeoSuggestions,
  rejectSeoSuggestion,
  suggestSeo,
  triggerBulkSeoAudit,
} from '@granit/cms-seo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCmsSeoConfig } from '../providers/cms-seo-provider';

import { cmsSeoKeys } from './query-keys';

import type {
  ApplySeoAiRequest,
  ListSeoSuggestionsParams,
  PagedResponse,
  RejectSeoAiRequest,
  SeoAiSuggestRequest,
  SeoAiSuggestResponse,
  SeoAiSuggestionResponse,
} from '@granit/cms-seo';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export function useSeoSuggestions(
  params?: ListSeoSuggestionsParams,
  options?: { readonly enabled?: boolean }
): UseQueryResult<PagedResponse<SeoAiSuggestionResponse>> {
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
): UseQueryResult<SeoAiSuggestionResponse> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  return useQuery({
    queryKey: cmsSeoKeys.suggestions.diff(queryKeyPrefix, id),
    queryFn: () => getSeoSuggestionDiff(client, basePath, id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function useSuggestSeo(): UseMutationResult<
  SeoAiSuggestResponse,
  Error,
  SeoAiSuggestRequest
> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req) => suggestSeo(client, basePath, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsSeoKeys.suggestions.all(queryKeyPrefix) });
    },
  });
}

export function useApplySeoSuggestion(): UseMutationResult<
  SeoAiSuggestionResponse,
  Error,
  { id: string; request: ApplySeoAiRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => applySeoSuggestion(client, basePath, id, request),
    onSuccess: (data) => {
      qc.setQueryData(cmsSeoKeys.suggestions.detail(queryKeyPrefix, data.id), data);
      qc.invalidateQueries({ queryKey: cmsSeoKeys.suggestions.list(queryKeyPrefix) });
      qc.invalidateQueries({ queryKey: cmsSeoKeys.metadata.all(queryKeyPrefix) });
    },
  });
}

export function useRejectSeoSuggestion(): UseMutationResult<
  SeoAiSuggestionResponse,
  Error,
  { id: string; request?: RejectSeoAiRequest }
> {
  const { client, basePath, queryKeyPrefix } = useCmsSeoConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => rejectSeoSuggestion(client, basePath, id, request),
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
