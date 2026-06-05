// Types
export type {
  AcceptAgreementRequest,
  AgreementHistoryEntry,
  AgreementStatus,
  DeletionState,
  DeletionStatusValue,
  LegalDocument,
  LegalDocumentCreateRequest,
  LegalDocumentDetail,
  LegalDocumentLifecycleStatus,
  LegalDocumentListParams,
  LegalDocumentUpdateRequest,
  PrivacyDeletionRequest,
  PrivacyDeletionRequestResponse,
  PrivacyDeletionStatusResponse,
  PrivacyExportRequestResponse,
  PrivacyExportStatus,
  PrivacyExportStatusResponse,
} from './types/index';

// API — Data export
export { getExportStatus, listExports, requestExport } from './api/privacy-api';

// API — Data deletion
export {
  cancelDeletion,
  getDeletionStatus,
  listDeletions,
  requestDeletion,
} from './api/privacy-api';

// API — Legal agreements
export {
  acceptAgreement,
  getAgreementDocuments,
  getAgreementHistory,
  getAgreementStatuses,
} from './api/privacy-api';

// API — Legal document admin
export {
  createLegalDocument,
  getLegalDocument,
  listLegalDocuments,
  publishLegalDocument,
  updateLegalDocument,
} from './api/privacy-api';
export { PrivacyPermissions } from './permissions';
