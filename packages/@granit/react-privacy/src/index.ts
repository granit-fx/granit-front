// Provider
export {
  PrivacyProvider,
  buildPrivacyQueryKey,
  usePrivacyConfig,
} from './providers/privacy-provider.js';
export type { PrivacyConfig, PrivacyProviderProps } from './providers/privacy-provider.js';

// Hooks — Data export
export {
  usePrivacyExportStatus,
  usePrivacyExports,
  useRequestExport,
} from './hooks/use-privacy-export.js';

// Hooks — Data deletion
export {
  useCancelDeletion,
  useDeletionRequests,
  useDeletionStatus,
  useRequestDeletion,
} from './hooks/use-privacy-deletion.js';

// Hooks — Legal agreements
export {
  useAcceptAgreement,
  useAgreementDocuments,
  useAgreementHistory,
  useAgreementStatuses,
} from './hooks/use-privacy-agreements.js';

// Hooks — Legal document admin
export {
  useCreateLegalDocument,
  useLegalDocument,
  useLegalDocuments,
  usePublishLegalDocument,
  useUpdateLegalDocument,
} from './hooks/use-legal-documents.js';
export type { UpdateLegalDocumentVariables } from './hooks/use-legal-documents.js';
