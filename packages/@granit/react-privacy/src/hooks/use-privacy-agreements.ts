import {
  acceptAgreement,
  getAgreementDocuments,
  getAgreementHistory,
  getAgreementStatuses,
} from '@granit/privacy';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildPrivacyQueryKey, usePrivacyConfig } from '../providers/privacy-provider';

import type {
  AcceptAgreementRequest,
  AgreementHistoryEntry,
  AgreementStatus,
  LegalDocument,
} from '@granit/privacy';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** List all legal documents. */
export function useAgreementDocuments(): UseQueryResult<LegalDocument[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'agreements', 'documents'),
    queryFn: () => getAgreementDocuments(config.client, config.basePath!),
  });
}

/** Get the acceptance status for each legal document. */
export function useAgreementStatuses(): UseQueryResult<AgreementStatus[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'agreements', 'status'),
    queryFn: () => getAgreementStatuses(config.client, config.basePath!),
  });
}

/** Get the full acceptance history. */
export function useAgreementHistory(): UseQueryResult<AgreementHistoryEntry[]> {
  const config = usePrivacyConfig();

  return useQuery({
    queryKey: buildPrivacyQueryKey(config, 'agreements', 'history'),
    queryFn: () => getAgreementHistory(config.client, config.basePath!),
  });
}

/** Accept a legal document version. */
export function useAcceptAgreement(): UseMutationResult<void, Error, AcceptAgreementRequest> {
  const config = usePrivacyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AcceptAgreementRequest) =>
      acceptAgreement(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: buildPrivacyQueryKey(config, 'agreements'),
      });
    },
  });
}
