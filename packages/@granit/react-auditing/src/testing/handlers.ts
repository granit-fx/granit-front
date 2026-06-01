import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { notFound, pagedResponse } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockAuditEntries } from './data';

import type { AuditEntry, AuditEntryDetail } from '@granit/auditing';
import type { QueryMetadata } from '@granit/query-engine';

const AUDIT_CATEGORIES = ['DataMutation', 'ConfigurationChange', 'DataAccess', 'AccessDenied'];

/** Mock /meta payload for the audit-entries resource. */
export const auditEntryQueryMetadata: QueryMetadata = {
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
      name: 'timestamp',
      label: 'Timestamp',
      type: 'DateTime',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'userName',
      label: 'User',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'ipAddress',
      label: 'IP address',
      type: 'String',
      order: 4,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'correlationId',
      label: 'Correlation ID',
      type: 'String',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'entityChangeCount',
      label: 'Changes',
      type: 'Int32',
      order: 7,
      isSortable: true,
      isFilterable: false,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'timestamp', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'userName', type: 'String', operators: STRING_OPERATORS },
    { name: 'userId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'category', type: 'String', operators: ENUM_OPERATORS, enumValues: AUDIT_CATEGORIES },
    { name: 'ipAddress', type: 'String', operators: STRING_OPERATORS },
    { name: 'entityType', type: 'String', operators: STRING_OPERATORS },
    { name: 'entityId', type: 'String', operators: STRING_OPERATORS },
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'correlationId', type: 'String', operators: STRING_OPERATORS },
    { name: 'entityChangeCount', type: 'Int32', operators: NUMBER_OPERATORS },
  ],
  sortableFields: [
    { name: 'timestamp' },
    { name: 'userName' },
    { name: 'category' },
    { name: 'entityChangeCount' },
  ],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [
    {
      name: 'timestamp',
      defaultPeriod: 'ThisMonth',
      availablePeriods: [
        'Today',
        'ThisWeek',
        'ThisMonth',
        'LastMonth',
        'ThisQuarter',
        'ThisYear',
        'Custom',
      ],
    },
  ],
  groupByFields: [
    { name: 'category', type: 'String' },
    { name: 'userName', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-timestamp',
};

/**
 * Create stateful MSW handlers for audit log endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/auditing`)
 */
export function createAuditHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const auditEntriesUrl = `${baseUrl}/audit-entries`;
  return [
    // GET /audit-entries/meta — query metadata
    createQueryMetaHandler(auditEntriesUrl, auditEntryQueryMetadata),

    // GET list — filtered, sorted newest-first, paginated
    http.get(auditEntriesUrl, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const category = url.searchParams.get('category');

      let filtered: AuditEntry[] = [...mockAuditEntries];

      if (category) {
        filtered = filtered.filter((e) => e.category === category);
      }

      // Default sort: newest first
      filtered.sort((a, b) => (b.timestamp as string).localeCompare(a.timestamp as string));

      const start = (page - 1) * pageSize;
      return pagedResponse<AuditEntry>(filtered.slice(start, start + pageSize), filtered.length);
    }),

    // GET single entry detail
    http.get(`${auditEntriesUrl}/:id`, ({ params }) => {
      const entry = mockAuditEntries.find((e) => e.id === params.id);
      if (!entry) return notFound();

      const detail: AuditEntryDetail = {
        ...entry,
        entityChanges: [
          {
            entityType: 'User',
            entityId: 'user-001',
            changeType: 'Modified',
            propertyChanges: [
              { propertyName: 'email', originalValue: 'old@test.com', newValue: 'new@test.com' },
            ],
          },
        ],
      };
      return HttpResponse.json(detail);
    }),
  ];
}
