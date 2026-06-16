import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { paginate } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockExportHistory, mockImportHistory } from './data';

import type { ExportJobResponse, ImportJobResponse } from '@granit/data-exchange';
import type { QueryMetadata } from '@granit/query-engine';

const EXPORT_JOB_STATUSES = ['Queued', 'Exporting', 'Completed', 'Failed'];
const IMPORT_JOB_STATUSES = [
  'Created',
  'Previewed',
  'Mapped',
  'Executing',
  'Completed',
  'PartiallyCompleted',
  'Failed',
  'Cancelled',
];

/** Mock /meta payload for the export jobs resource. */
export const exportJobQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'definitionName',
      label: 'Definition',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'format',
      label: 'Format',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'rowCount',
      label: 'Rows',
      type: 'Int32',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'fileName',
      label: 'File name',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'completedAt',
      label: 'Completed at',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'definitionName', type: 'String', operators: ENUM_OPERATORS },
    { name: 'format', type: 'String', operators: ENUM_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: EXPORT_JOB_STATUSES },
    { name: 'rowCount', type: 'Int32', operators: NUMBER_OPERATORS },
    { name: 'fileName', type: 'String', operators: STRING_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'completedAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'definitionName' },
    { name: 'format' },
    { name: 'status' },
    { name: 'rowCount' },
    { name: 'createdAt' },
    { name: 'completedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'completed', label: 'Completed', isDefault: false },
    { name: 'failed', label: 'Failed', isDefault: false },
    { name: 'inProgress', label: 'In progress', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'createdAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'LastMonth', 'Custom'],
    },
  ],
  groupByFields: [
    { name: 'definitionName', type: 'String' },
    { name: 'status', type: 'String' },
    { name: 'format', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

/** Mock /meta payload for the import jobs resource. */
export const importJobQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'definitionName',
      label: 'Definition',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'originalFileName',
      label: 'File name',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'mimeType',
      label: 'MIME type',
      type: 'String',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'fileSizeBytes',
      label: 'Size',
      type: 'Int64',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'completedAt',
      label: 'Completed at',
      type: 'DateTime',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'definitionName', type: 'String', operators: ENUM_OPERATORS },
    { name: 'originalFileName', type: 'String', operators: STRING_OPERATORS },
    { name: 'mimeType', type: 'String', operators: ENUM_OPERATORS },
    { name: 'fileSizeBytes', type: 'Int64', operators: NUMBER_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS, enumValues: IMPORT_JOB_STATUSES },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'completedAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'definitionName' },
    { name: 'originalFileName' },
    { name: 'fileSizeBytes' },
    { name: 'status' },
    { name: 'createdAt' },
    { name: 'completedAt' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'completed', label: 'Completed', isDefault: false },
    { name: 'failed', label: 'Failed', isDefault: false },
    { name: 'inProgress', label: 'In progress', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'createdAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'LastMonth', 'Custom'],
    },
  ],
  groupByFields: [
    { name: 'definitionName', type: 'String' },
    { name: 'status', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: '-createdAt',
};

// ---------------------------------------------------------------------------
// Static metadata
// ---------------------------------------------------------------------------

const mockDefinitions = [
  {
    name: 'Admin.CountryExport',
    entityType: 'Country',
    supportedFormats: ['csv', 'xlsx'],
    isAutoGenerated: false,
  },
  {
    name: 'Admin.UserExport',
    entityType: 'IdentityUser',
    supportedFormats: ['csv', 'xlsx'],
    isAutoGenerated: false,
  },
  {
    name: 'Admin.AuditingExport',
    entityType: 'AuditEntry',
    supportedFormats: ['csv'],
    isAutoGenerated: true,
  },
  {
    name: 'Admin.TemplateExport',
    entityType: 'Template',
    supportedFormats: ['csv', 'xlsx'],
    isAutoGenerated: false,
  },
  {
    name: 'Admin.LocalizationOverrideExport',
    entityType: 'LocalizationOverride',
    supportedFormats: ['csv', 'xlsx'],
    isAutoGenerated: false,
  },
];

const mockFields: Record<
  string,
  Array<{
    propertyPath: string;
    clrTypeName: string;
    header: string | null;
    format: string | null;
    order: number;
    isNavigation: boolean;
  }>
> = {
  'Admin.CountryExport': [
    {
      propertyPath: 'code',
      clrTypeName: 'String',
      header: 'Code',
      format: null,
      order: 0,
      isNavigation: false,
    },
    {
      propertyPath: 'alpha3',
      clrTypeName: 'String',
      header: 'Alpha-3',
      format: null,
      order: 1,
      isNavigation: false,
    },
    {
      propertyPath: 'labelEn',
      clrTypeName: 'String',
      header: 'Label EN',
      format: null,
      order: 2,
      isNavigation: false,
    },
    {
      propertyPath: 'labelFr',
      clrTypeName: 'String',
      header: 'Label FR',
      format: null,
      order: 3,
      isNavigation: false,
    },
    {
      propertyPath: 'region',
      clrTypeName: 'String',
      header: 'Region',
      format: null,
      order: 4,
      isNavigation: false,
    },
    {
      propertyPath: 'activated',
      clrTypeName: 'Boolean',
      header: 'Active',
      format: null,
      order: 5,
      isNavigation: false,
    },
  ],
  'Admin.UserExport': [
    {
      propertyPath: 'email',
      clrTypeName: 'String',
      header: 'Email',
      format: null,
      order: 0,
      isNavigation: false,
    },
    {
      propertyPath: 'firstName',
      clrTypeName: 'String',
      header: 'First Name',
      format: null,
      order: 1,
      isNavigation: false,
    },
    {
      propertyPath: 'lastName',
      clrTypeName: 'String',
      header: 'Last Name',
      format: null,
      order: 2,
      isNavigation: false,
    },
    {
      propertyPath: 'username',
      clrTypeName: 'String',
      header: 'Username',
      format: null,
      order: 3,
      isNavigation: false,
    },
    {
      propertyPath: 'enabled',
      clrTypeName: 'Boolean',
      header: 'Enabled',
      format: null,
      order: 4,
      isNavigation: false,
    },
    {
      propertyPath: 'emailVerified',
      clrTypeName: 'Boolean',
      header: 'Email Verified',
      format: null,
      order: 5,
      isNavigation: false,
    },
  ],
  'Admin.AuditExport': [
    {
      propertyPath: 'timestamp',
      clrTypeName: 'DateTime',
      header: 'Timestamp',
      format: 'yyyy-MM-dd HH:mm:ss',
      order: 0,
      isNavigation: false,
    },
    {
      propertyPath: 'user',
      clrTypeName: 'String',
      header: 'User',
      format: null,
      order: 1,
      isNavigation: false,
    },
    {
      propertyPath: 'action',
      clrTypeName: 'String',
      header: 'Action',
      format: null,
      order: 2,
      isNavigation: false,
    },
    {
      propertyPath: 'resource',
      clrTypeName: 'String',
      header: 'Resource',
      format: null,
      order: 3,
      isNavigation: false,
    },
  ],
  'Admin.TemplateExport': [
    {
      propertyPath: 'name',
      clrTypeName: 'String',
      header: 'Name',
      format: null,
      order: 0,
      isNavigation: false,
    },
    {
      propertyPath: 'category',
      clrTypeName: 'String',
      header: 'Category',
      format: null,
      order: 1,
      isNavigation: false,
    },
    {
      propertyPath: 'status',
      clrTypeName: 'Int32',
      header: 'Status',
      format: null,
      order: 2,
      isNavigation: false,
    },
    {
      propertyPath: 'mimeType',
      clrTypeName: 'String',
      header: 'MIME Type',
      format: null,
      order: 3,
      isNavigation: false,
    },
    {
      propertyPath: 'lastModifiedAt',
      clrTypeName: 'DateTime',
      header: 'Last Modified',
      format: 'yyyy-MM-dd HH:mm:ss',
      order: 4,
      isNavigation: false,
    },
    {
      propertyPath: 'lastModifiedBy',
      clrTypeName: 'String',
      header: 'Last Modified By',
      format: null,
      order: 5,
      isNavigation: false,
    },
  ],
  'Admin.LocalizationOverrideExport': [
    {
      propertyPath: 'resourceName',
      clrTypeName: 'String',
      header: 'Resource',
      format: null,
      order: 0,
      isNavigation: false,
    },
    {
      propertyPath: 'cultureName',
      clrTypeName: 'String',
      header: 'Culture',
      format: null,
      order: 1,
      isNavigation: false,
    },
    {
      propertyPath: 'key',
      clrTypeName: 'String',
      header: 'Key',
      format: null,
      order: 2,
      isNavigation: false,
    },
    {
      propertyPath: 'value',
      clrTypeName: 'String',
      header: 'Value',
      format: null,
      order: 3,
      isNavigation: false,
    },
    {
      propertyPath: 'createdAt',
      clrTypeName: 'DateTime',
      header: 'Created At',
      format: 'yyyy-MM-dd HH:mm:ss',
      order: 4,
      isNavigation: false,
    },
    {
      propertyPath: 'createdBy',
      clrTypeName: 'String',
      header: 'Created By',
      format: null,
      order: 5,
      isNavigation: false,
    },
  ],
};

const mockPresets: Record<
  string,
  Array<{
    definitionName: string;
    presetName: string;
    selectedFields: string[];
    format: string;
    includeIdForImport: boolean;
  }>
> = {};

// ---------------------------------------------------------------------------
// Import in-memory state
// ---------------------------------------------------------------------------

const mockImportJobs: Record<
  string,
  {
    id: string;
    definitionName: string;
    originalFileName: string;
    mimeType: string;
    fileSizeBytes: number;
    status: string;
    createdAt: string;
    completedAt: string | null;
    concurrencyStamp: string;
  }
> = {};

let importJobCounter = 0;

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create stateful MSW handlers for data exchange (import/export) endpoints.
 *
 * @param metadataBase   - Export metadata base path (default: `/api/v1/data-exchange/metadata`)
 * @param importBase     - Import base path (default: `/api/v1/data-exchange/import`)
 * @param exportJobsBase - Export jobs base path (default: `/api/v1/data-exchange/export/jobs`)
 */
export function createDataExchangeHandlers(
  metadataBase = `${DEFAULT_BASE_PATH}/metadata`,
  importBase = `${DEFAULT_BASE_PATH}/import`,
  exportJobsBase = `${DEFAULT_BASE_PATH}/export/jobs`
) {
  return [
    // Query metadata: export jobs
    createQueryMetaHandler(exportJobsBase, exportJobQueryMetadata),

    // Query metadata: import jobs
    createQueryMetaHandler(`${importBase}/jobs`, importJobQueryMetadata),

    // Export: definitions
    http.get(`${metadataBase}/definitions`, () => {
      return HttpResponse.json(mockDefinitions);
    }),

    // Export: fields for a definition
    http.get(`${metadataBase}/definitions/:name/fields`, ({ params }) => {
      const name = params.name as string;
      const fields = mockFields[name] ?? [];
      return HttpResponse.json(fields);
    }),

    // Export: presets for a definition
    http.get(`${metadataBase}/presets/:definitionName`, ({ params }) => {
      const definitionName = params.definitionName as string;
      return HttpResponse.json(mockPresets[definitionName] ?? []);
    }),

    // Export: save preset
    http.post(`${metadataBase}/presets`, async ({ request }) => {
      const body = (await request.json()) as {
        definitionName: string;
        presetName: string;
        selectedFields: string[];
        format: string;
        includeIdForImport: boolean;
      };
      const defPresets = mockPresets[body.definitionName] ?? [];
      mockPresets[body.definitionName] = defPresets;
      const existing = defPresets.findIndex((p) => p.presetName === body.presetName);
      if (existing >= 0) {
        defPresets[existing] = body;
      } else {
        defPresets.push(body);
      }
      return new HttpResponse(null, { status: 204 });
    }),

    // Export: delete preset
    http.delete(`${metadataBase}/presets/:definitionName/:presetName`, ({ params }) => {
      const definitionName = params.definitionName as string;
      const presetName = params.presetName as string;
      if (mockPresets[definitionName]) {
        mockPresets[definitionName] = mockPresets[definitionName].filter(
          (p) => p.presetName !== presetName
        );
      }
      return new HttpResponse(null, { status: 204 });
    }),

    // Export: create job
    http.post(exportJobsBase, async ({ request }) => {
      const body = (await request.json()) as { definitionName: string; format: string };
      const job = {
        id: crypto.randomUUID(),
        definitionName: body.definitionName,
        format: body.format,
        status: 'Completed' as const,
        rowCount: 42,
        fileName: `${body.definitionName}-export.${body.format}`,
        errorMessage: null,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        modifiedAt: null,
        modifiedBy: null,
        concurrencyStamp: crypto.randomUUID(),
      };
      return HttpResponse.json(job);
    }),

    // Export: job status
    http.get(`${exportJobsBase}/:jobId`, () => {
      return HttpResponse.json({
        id: 'mock',
        definitionName: 'countries',
        format: 'csv',
        status: 'Completed',
        rowCount: 42,
        fileName: 'export.csv',
        errorMessage: null,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        modifiedAt: null,
        modifiedBy: null,
        concurrencyStamp: 'mock-stamp',
      });
    }),

    // Export: download file
    http.get(`${exportJobsBase}/:jobId/download`, () => {
      const csv =
        'code,alpha3,labelEn,labelFr,region,activated\nBE,BEL,Belgium,Belgique,Europe,true\n';
      return new HttpResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="export.csv"',
        },
      });
    }),

    // Import: upload file (create job)
    http.post(`${importBase}/jobs`, async () => {
      importJobCounter++;
      const jobId = `import-${importJobCounter}`;
      const job = {
        id: jobId,
        definitionName: 'countries',
        originalFileName: 'import.csv',
        mimeType: 'text/csv',
        fileSizeBytes: 1024,
        status: 'Created',
        createdAt: new Date().toISOString(),
        completedAt: null,
        concurrencyStamp: `stamp-${jobId}`,
      };
      mockImportJobs[jobId] = job;
      return HttpResponse.json(job);
    }),

    // Import jobs: paginated list — must come before /:jobId wildcard
    http.get(`${importBase}/jobs`, ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');

      let filtered: ImportJobResponse[] = [...mockImportHistory];
      if (status) {
        filtered = filtered.filter((j) => j.status === status);
      }
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return HttpResponse.json(paginate(filtered, url));
    }),

    // Export jobs: paginated list
    http.get(exportJobsBase, ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');

      let filtered: ExportJobResponse[] = [...mockExportHistory];
      if (status) {
        filtered = filtered.filter((j) => j.status === status);
      }
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return HttpResponse.json(paginate(filtered, url));
    }),

    // Import: get job status
    http.get(`${importBase}/:jobId`, ({ params }) => {
      const jobId = params.jobId as string;
      const job = mockImportJobs[jobId];
      if (!job) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(job);
    }),

    // Import: preview
    http.post(`${importBase}/:jobId/preview`, ({ params }) => {
      const jobId = params.jobId as string;
      if (mockImportJobs[jobId]) {
        mockImportJobs[jobId].status = 'Previewed';
      }
      return HttpResponse.json({
        headers: ['code', 'alpha3', 'labelEn', 'labelFr', 'region', 'activated'],
        previewRows: [
          ['BE', 'BEL', 'Belgium', 'Belgique', 'Europe', 'true'],
          ['FR', 'FRA', 'France', 'France', 'Europe', 'true'],
        ],
        suggestions: [
          { sourceColumn: 'code', targetProperty: 'code', confidence: 'Exact' },
          { sourceColumn: 'alpha3', targetProperty: 'alpha3', confidence: 'Exact' },
          { sourceColumn: 'labelEn', targetProperty: 'labelEn', confidence: 'Exact' },
          { sourceColumn: 'labelFr', targetProperty: 'labelFr', confidence: 'Exact' },
          { sourceColumn: 'region', targetProperty: 'region', confidence: 'Exact' },
          { sourceColumn: 'activated', targetProperty: 'activated', confidence: 'Exact' },
        ],
        fieldMetadata: [
          {
            propertyPath: 'code',
            clrTypeName: 'String',
            displayName: 'Code',
            description: null,
            isRequired: true,
          },
          {
            propertyPath: 'alpha3',
            clrTypeName: 'String',
            displayName: 'Alpha-3',
            description: null,
            isRequired: true,
          },
          {
            propertyPath: 'labelEn',
            clrTypeName: 'String',
            displayName: 'Label EN',
            description: null,
            isRequired: true,
          },
          {
            propertyPath: 'labelFr',
            clrTypeName: 'String',
            displayName: 'Label FR',
            description: null,
            isRequired: true,
          },
          {
            propertyPath: 'region',
            clrTypeName: 'String',
            displayName: 'Region',
            description: null,
            isRequired: false,
          },
          {
            propertyPath: 'activated',
            clrTypeName: 'Boolean',
            displayName: 'Active',
            description: null,
            isRequired: false,
          },
        ],
      });
    }),

    // Import: confirm mappings
    http.put(`${importBase}/:jobId/mappings`, ({ params }) => {
      const jobId = params.jobId as string;
      if (mockImportJobs[jobId]) {
        mockImportJobs[jobId].status = 'Mapped';
      }
      return new HttpResponse(null, { status: 204 });
    }),

    // Import: execute
    http.post(`${importBase}/:jobId/execute`, ({ params }) => {
      const jobId = params.jobId as string;
      if (mockImportJobs[jobId]) {
        mockImportJobs[jobId].status = 'Completed';
        mockImportJobs[jobId].completedAt = new Date().toISOString();
      }
      return new HttpResponse(null, { status: 204 });
    }),

    // Import: dry-run
    http.post(`${importBase}/:jobId/dry-run`, ({ params }) => {
      const jobId = params.jobId as string;
      return HttpResponse.json({
        importJobId: jobId,
        finalStatus: 'Completed',
        totalRows: 2,
        succeededRows: 2,
        failedRows: 0,
        skippedRows: 0,
        insertedRows: 2,
        updatedRows: 0,
        duration: '00:00:00.125',
        rowErrors: [],
      });
    }),

    // Import: report
    http.get(`${importBase}/:jobId/report`, ({ params }) => {
      const jobId = params.jobId as string;
      const historyJob = mockImportHistory.find((j) => j.id === jobId);

      const mockReports: Record<
        string,
        { totalRows: number; succeeded: number; failed: number; skipped: number }
      > = {
        'imp-001': { totalRows: 195, succeeded: 195, failed: 0, skipped: 0 },
        'imp-002': { totalRows: 50, succeeded: 47, failed: 3, skipped: 0 },
        'imp-003': { totalRows: 120, succeeded: 0, failed: 120, skipped: 0 },
        'imp-004': { totalRows: 85, succeeded: 85, failed: 0, skipped: 0 },
        'imp-005': { totalRows: 10, succeeded: 0, failed: 0, skipped: 0 },
        'imp-006': { totalRows: 250, succeeded: 248, failed: 0, skipped: 2 },
        'imp-007': { totalRows: 200, succeeded: 190, failed: 8, skipped: 2 },
      };

      const stats = mockReports[jobId] ?? { totalRows: 2, succeeded: 2, failed: 0, skipped: 0 };
      const rowErrors =
        stats.failed > 0
          ? Array.from({ length: Math.min(stats.failed, 5) }, (_, i) => ({
              rowNumber: i + 2,
              field: 'alpha3',
              message: 'Invalid ISO 3166-1 alpha-3 code',
              value: `XX${i}`,
            }))
          : [];

      return HttpResponse.json({
        importJobId: jobId,
        finalStatus: historyJob?.status ?? 'Completed',
        totalRows: stats.totalRows,
        succeededRows: stats.succeeded,
        failedRows: stats.failed,
        skippedRows: stats.skipped,
        insertedRows: stats.succeeded,
        updatedRows: 0,
        duration: '00:00:00.250',
        rowErrors,
      });
    }),

    // Import: cancel
    http.delete(`${importBase}/:jobId`, ({ params }) => {
      const jobId = params.jobId as string;
      if (mockImportJobs[jobId]) {
        mockImportJobs[jobId].status = 'Cancelled';
      }
      return new HttpResponse(null, { status: 204 });
    }),

    // Import: correction file
    http.get(`${importBase}/:jobId/correction-file`, () => {
      const csv = 'row,error\n';
      return new HttpResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="correction.csv"',
        },
      });
    }),
  ];
}
