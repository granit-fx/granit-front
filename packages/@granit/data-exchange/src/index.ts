// ---------------------------------------------------------------------------
// @granit/data-exchange — public API
// ---------------------------------------------------------------------------

// Export types
export type {
  CreateExportJobRequest,
  ExportDefinitionResponse,
  ExportField,
  ExportJobListParams,
  ExportJobResponse,
  ExportJobStatus,
  ExportPresetResponse,
  SaveExportPresetRequest,
} from './export/index.js';

// Export API
export {
  createExportJob,
  deleteExportPreset,
  downloadExportFile,
  getExportFields,
  getExportJobStatus,
  listExportDefinitions,
  listExportJobs,
  listExportPresets,
  saveExportPreset,
} from './export/index.js';

// Import types
export type {
  ConfirmMappingsRequest,
  ImportColumnMapping,
  ImportFieldMetadata,
  ImportJobListParams,
  ImportJobResponse,
  ImportJobStatus,
  ImportPreviewResponse,
  ImportReportResponse,
  ImportRowError,
  ImportRowErrorKind,
  MappingConfidence,
} from './import/index.js';

// Import API
export {
  cancelImportJob,
  confirmMappings,
  downloadCorrectionFile,
  dryRunImport,
  executeImport,
  getImportJob,
  getImportReport,
  listImportJobs,
  previewImport,
  uploadImportFile,
} from './import/index.js';
export { DataExchangePermissions } from './permissions.js';
