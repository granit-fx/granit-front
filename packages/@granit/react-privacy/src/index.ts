// Provider
export {
  PrivacyProvider,
  buildPrivacyQueryKey,
  usePrivacyConfig,
} from './providers/privacy-provider';
export type { PrivacyConfig, PrivacyProviderProps } from './providers/privacy-provider';

// Hooks — Data export
export {
  useExportScopes,
  usePrivacyExportStatus,
  usePrivacyExports,
  useRequestExport,
  useRequestExportOnBehalfOf,
} from './hooks/use-privacy-export';

// Hooks — Data deletion
export {
  useCancelDeletion,
  useDeletionRequests,
  useDeletionStatus,
  useRequestDeletion,
} from './hooks/use-privacy-deletion';

// Hooks — Legal agreements
export {
  useAcceptAgreement,
  useAgreementDocuments,
  useAgreementHistory,
  useAgreementStatuses,
} from './hooks/use-privacy-agreements';

// Hooks — Regulation & purposes
export { useApplicableRegulation, useProcessingPurposes } from './hooks/use-privacy-regulation';

// Hooks — Opt-out
export { useOptOutStatus, useRequestOptOut } from './hooks/use-privacy-opt-out';

// Hooks — Legal document admin
export {
  useCreateLegalDocument,
  useLegalDocument,
  useLegalDocuments,
  usePublishLegalDocument,
  useUpdateLegalDocument,
} from './hooks/use-legal-documents';
export type { UpdateLegalDocumentVariables } from './hooks/use-legal-documents';
