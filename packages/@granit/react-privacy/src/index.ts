// Provider
export {
  PrivacyProvider,
  buildPrivacyQueryKey,
  usePrivacyConfig,
} from './providers/privacy-provider';
export type { PrivacyConfig, PrivacyProviderProps } from './providers/privacy-provider';

// Hooks — Data export
export {
  usePrivacyExportStatus,
  usePrivacyExports,
  useRequestExport,
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

// Hooks — Legal document admin
export {
  useCreateLegalDocument,
  useLegalDocument,
  useLegalDocuments,
  usePublishLegalDocument,
  useUpdateLegalDocument,
} from './hooks/use-legal-documents';
export type { UpdateLegalDocumentVariables } from './hooks/use-legal-documents';
