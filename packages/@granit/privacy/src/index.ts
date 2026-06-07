// Types
export type {
  // Legal agreements
  PrivacyLegalDocumentResponse,
  PrivacyConsentStatusResponse,
  PrivacyUserAgreementResponse,
  PrivacyAcceptAgreementRequest,
  // Legal document admin
  LegalDocumentDetailResponse,
  // Legal document admin — shared
  DeletionState,
  DeletionStatusValue,
  LegalDocumentCreateRequest,
  LegalDocumentLifecycleStatus,
  LegalDocumentListParams,
  LegalDocumentUpdateRequest,
  // Data deletion
  PrivacyDeletionRequest,
  PrivacyDeletionRequestResponse,
  PrivacyDeletionStatusResponse,
  // Data export
  PrivacyExportRequestResponse,
  PrivacyExportScopeResponse,
  PrivacyExportStatus,
  PrivacyExportStatusResponse,
  PrivacyExportRequest,
  PrivacyExportOnBehalfOfRequest,
  // Regulation & purposes
  PrivacyRegulationProfileResponse,
  PrivacyProcessingPurposeResponse,
  // Opt-out
  PrivacyOptOutStatusResponse,
} from './types/index';

// API — Data export
export {
  downloadExport,
  downloadExportManifest,
  downloadExportShard,
  getExportStatus,
  listExportScopes,
  listExports,
  requestExport,
  requestExportOnBehalfOf,
} from './api/privacy-api';

// API — Data deletion
export {
  cancelDeletion,
  getDeletionStatus,
  listDeletions,
  requestDeletion,
} from './api/privacy-api';

// API — Legal agreements (canonical names)
export {
  acceptAgreement,
  getAgreementStatuses,
  listAgreementDocuments,
  listAgreementHistory,
} from './api/privacy-api';

// API — Legal document admin
export {
  createLegalDocument,
  getLegalDocument,
  listLegalDocuments,
  publishLegalDocument,
  updateLegalDocument,
} from './api/privacy-api';

// API — Regulation & purposes
export { getApplicableRegulation, listProcessingPurposes } from './api/privacy-api';

// API — Opt-out
export { getOptOutStatus, requestOptOut } from './api/privacy-api';

export { PrivacyPermissions } from './permissions';
