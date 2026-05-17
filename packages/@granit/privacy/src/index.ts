// Types
export type {
  AcceptAgreementRequest,
  AgreementHistoryEntry,
  AgreementStatus,
  DeletionStatusValue,
  LegalDocument,
  LegalDocumentCreateRequest,
  LegalDocumentDetail,
  LegalDocumentLifecycleStatus,
  LegalDocumentListParams,
  LegalDocumentUpdateRequest,
  PrivacyDeletionRequest,
  PrivacyDeletionResponse,
  PrivacyExportRequestResponse,
  PrivacyExportStatus,
  PrivacyExportStatusResponse,
} from './types/index.js';

// API — Data export
export { getExportStatus, listExports, requestExport } from './api/privacy-api.js';

// API — Data deletion
export {
  cancelDeletion,
  getDeletionStatus,
  listDeletions,
  requestDeletion,
} from './api/privacy-api.js';

// API — Legal agreements
export {
  acceptAgreement,
  getAgreementDocuments,
  getAgreementHistory,
  getAgreementStatuses,
} from './api/privacy-api.js';

// API — Legal document admin
export {
  createLegalDocument,
  getLegalDocument,
  listLegalDocuments,
  publishLegalDocument,
  updateLegalDocument,
} from './api/privacy-api.js';
export { PrivacyPermissions } from './permissions.js';
