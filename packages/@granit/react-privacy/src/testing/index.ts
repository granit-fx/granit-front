// ---------------------------------------------------------------------------
// @granit/react-privacy/testing — Mock data & MSW handlers
// ---------------------------------------------------------------------------

export {
  mockAgreementHistory,
  mockAgreementStatuses,
  mockDeletionRequests,
  mockExports,
  mockLegalDocumentDetails,
  mockLegalDocuments,
} from './data.js';
export {
  createPrivacyHandlers,
  legalDocumentQueryMetadata,
  privacyDeletionQueryMetadata,
  privacyExportQueryMetadata,
} from './handlers.js';
