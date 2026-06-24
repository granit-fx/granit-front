import {
  createLegalDocument,
  getLegalDocument,
  listLegalDocuments,
  publishLegalDocument,
  updateLegalDocument,
} from '@granit/privacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider';

import type {
  LegalDocumentCreateRequest,
  LegalDocumentDetailResponse,
  LegalDocumentListParams,
  LegalDocumentUpdateRequest,
} from '@granit/privacy';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** List legal document versions, optionally filtered by document ID. */
export function useLegalDocuments(
  params?: LegalDocumentListParams
): UseQueryResult<LegalDocumentDetailResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: [...buildPrivacyQueryKey(config, 'legal-documents'), params],
    queryFn: async () => {
      const result = await listLegalDocuments(config.client, config.basePath!, params);
      return result.items as LegalDocumentDetailResponse[];
    },
  });
}

/** Fetch a single legal document version by ID. Disabled when id is empty. */
export function useLegalDocument(id: string): UseQueryResult<LegalDocumentDetailResponse> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: [...buildPrivacyQueryKey(config, 'legal-documents'), id],
    queryFn: () => getLegalDocument(config.client, config.basePath!, id),
    enabled: id.length > 0,
  });
}

/** Create a new legal document draft. Invalidates legal-documents on success. */
export function useCreateLegalDocument(): UseMutationResult<
  LegalDocumentDetailResponse,
  Error,
  LegalDocumentCreateRequest
> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: LegalDocumentCreateRequest) =>
      createLegalDocument(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'legal-documents'),
      });
    },
  });
}

export interface UpdateLegalDocumentVariables {
  readonly id: string;
  readonly request: LegalDocumentUpdateRequest;
}

/** Update a legal document draft. Invalidates legal-documents on success. */
export function useUpdateLegalDocument(): UseMutationResult<
  LegalDocumentDetailResponse,
  Error,
  UpdateLegalDocumentVariables
> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: UpdateLegalDocumentVariables) =>
      updateLegalDocument(config.client, config.basePath!, id, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'legal-documents'),
      });
    },
  });
}

/** Publish a legal document draft. Invalidates legal-documents on success. */
export function usePublishLegalDocument(): UseMutationResult<
  LegalDocumentDetailResponse,
  Error,
  string
> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => publishLegalDocument(config.client, config.basePath!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'legal-documents'),
      });
    },
  });
}
