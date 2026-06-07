import {
  acceptAgreement,
  getAgreementStatuses,
  listAgreementDocuments,
  listAgreementHistory,
} from '@granit/privacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider';

import type {
  PrivacyAcceptAgreementRequest,
  PrivacyConsentStatusResponse,
  PrivacyLegalDocumentResponse,
  PrivacyUserAgreementResponse,
} from '@granit/privacy';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** List all legal documents. */
export function useAgreementDocuments(): UseQueryResult<PrivacyLegalDocumentResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'agreements', 'documents'),
    queryFn: () => listAgreementDocuments(config.client, config.basePath!),
  });
}

/** Get the acceptance status for each legal document. */
export function useAgreementStatuses(): UseQueryResult<PrivacyConsentStatusResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'agreements', 'status'),
    queryFn: () => getAgreementStatuses(config.client, config.basePath!),
  });
}

/** Get the full acceptance history. */
export function useAgreementHistory(): UseQueryResult<PrivacyUserAgreementResponse[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'agreements', 'history'),
    queryFn: () => listAgreementHistory(config.client, config.basePath!),
  });
}

/** Accept a legal document version. */
export function useAcceptAgreement(): UseMutationResult<
  void,
  Error,
  PrivacyAcceptAgreementRequest
> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PrivacyAcceptAgreementRequest) =>
      acceptAgreement(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'agreements'),
      });
    },
  });
}
