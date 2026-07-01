import type { ExportJobStatus, ImportJobStatus } from '@granit/data-exchange';
import type { ExportConfig, ImportConfig } from '@granit/react-data-exchange';

/**
 * Static provider config for the export/import history pages. The Axios client
 * is intentionally omitted: {@link ExportProvider}/{@link ImportProvider} resolve
 * it from the host's `GranitClientProvider`, so this UI package never touches
 * `@granit/react-api-client` (aligned with `@granit/react-ui-catalog`'s
 * `QUERY_CONFIG`, which passes only a `basePath`).
 */
const DATA_EXCHANGE_BASE_PATH = '/api/v1/data-exchange';

export const EXPORT_CONFIG: ExportConfig = { basePath: DATA_EXCHANGE_BASE_PATH };

export const IMPORT_CONFIG: ImportConfig = { basePath: DATA_EXCHANGE_BASE_PATH };

export const DEFAULT_PAGE_SIZE = 20;

export const IMPORT_STATUSES: ImportJobStatus[] = [
  'Created',
  'Previewed',
  'Mapped',
  'Executing',
  'Completed',
  'PartiallyCompleted',
  'Failed',
  'Cancelled',
];

export const IMPORT_TERMINAL_STATUSES: ImportJobStatus[] = [
  'Completed',
  'PartiallyCompleted',
  'Failed',
  'Cancelled',
];

export const EXPORT_STATUSES: ExportJobStatus[] = ['Queued', 'Exporting', 'Completed', 'Failed'];

export const EXPORT_TERMINAL_STATUSES: ExportJobStatus[] = ['Completed', 'Failed'];
