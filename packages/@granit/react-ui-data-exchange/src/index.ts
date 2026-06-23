// @granit/react-ui-data-exchange — admin UI for the Granit.DataExchange module.
// Composes the headless @granit/react-data-exchange (data hooks + providers) with
// the foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree.

export { ExportListPage } from './export-list-page';
export { ImportListPage } from './import-list-page';

export { HistoryFilters } from './components/history-filters';
export { ImportReportDialog } from './components/import-report-dialog';
export { JobStatusBadge } from './components/job-status-badge';

export { ExportButton } from './components/export/export-button';
export { ExportDialog } from './components/export/export-dialog';
export { ImportButton } from './components/import/import-button';
export { ImportDialog } from './components/import/import-dialog';
export { ColumnMappingTable } from './components/import/column-mapping-table';
export { FileDropZone } from './components/import/file-drop-zone';
export { ImportRowErrors } from './components/import/import-row-errors';
export { ImportReportSummary } from './components/import/import-report-summary';
export { MappingConfidenceBadge } from './components/import/mapping-confidence-badge';
export { createExportHistoryColumns } from './components/export-history-columns';
export { createImportHistoryColumns } from './components/import-history-columns';
export {
  createJobActionColumn,
  createJobDateColumn,
  createJobEntityColumn,
  createJobStatusColumn,
} from './components/job-history-columns';

export {
  DEFAULT_PAGE_SIZE,
  EXPORT_STATUSES,
  EXPORT_TERMINAL_STATUSES,
  IMPORT_STATUSES,
  IMPORT_TERMINAL_STATUSES,
} from './constants';

// i18next resource bundles (flat keys, "translation" ns)
export { dataExchangeTranslationsEn, dataExchangeTranslationsFr } from './locales/index';
export type { DataExchangeTranslations } from './locales/index';
