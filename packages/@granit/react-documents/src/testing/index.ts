// ---------------------------------------------------------------------------
// @granit/react-documents/testing — Mock data & MSW handlers
// ---------------------------------------------------------------------------

export {
  DOC_INVOICE_001_ID,
  DOC_INVOICE_002_ID,
  DOC_INVOICE_003_ID,
  DOC_MSA_ID,
  DOC_NDA_ID,
  DOC_SOW_2025_ID,
  DOC_SOW_2026_ID,
  DOC_TRASH_OK_ID,
  DOC_TRASH_URGENT_ID,
  FOLDER_CONTRACTS_2025_ID,
  FOLDER_CONTRACTS_2026_ID,
  FOLDER_CONTRACTS_ID,
  FOLDER_INVOICES_ID,
  MOCK_ANCHOR_TIME,
  MOCK_OWNER_USER_ID,
  mockDocumentsData,
  mockFoldersData,
  mockQuotaData,
  mockSharesData,
  mockTrashedDocumentsData,
  mockVersionsData,
} from './data.js';
export { createDocumentsHandlers } from './handlers.js';
export type { CreateDocumentsHandlersOptions } from './handlers.js';
export { documentQueryMetadata } from './query-meta.js';
