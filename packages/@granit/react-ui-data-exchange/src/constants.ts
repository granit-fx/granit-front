import type { ExportJobStatus, ImportJobStatus } from '@granit/data-exchange';

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
