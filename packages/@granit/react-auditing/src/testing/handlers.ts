import { AuditCategory, AuditChangeType } from '@granit/auditing';
import { ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { notFound, pagedResponse } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockAuditEntityChanges, mockAuditEntries } from './data';

import type {
  AuditEntityChangeSummaryResponse,
  AuditEntryResponse,
  AuditEntryDetailResponse,
} from '@granit/auditing';
import type { QueryMetadata } from '@granit/query-engine';

const AUDIT_CATEGORIES = Object.values(AuditCategory);
const CHANGE_TYPES = Object.values(AuditChangeType);

/**
 * Mock `/meta` payload for the audit-entries resource.
 * Mirrors `Granit.Auditing.Queries.AuditEntryQueryDefinition`.
 */
export const auditEntryQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'tenantId',
      label: 'Tenant',
      type: 'Guid',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'timestamp',
      label: 'Timestamp',
      type: 'DateTime',
      order: 1,
      isSortable: true,
      isFilterable: false,
      isVisible: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'userId',
      label: 'User ID',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'userName',
      label: 'User Name',
      type: 'String',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'ipAddress',
      label: 'IP Address',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
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
  ],
  filterableFields: [
    { name: 'tenantId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'category', type: 'String', operators: ENUM_OPERATORS, enumValues: AUDIT_CATEGORIES },
    { name: 'userId', type: 'String', operators: STRING_OPERATORS },
    { name: 'userName', type: 'String', operators: STRING_OPERATORS },
    { name: 'ipAddress', type: 'String', operators: STRING_OPERATORS },
    { name: 'correlationId', type: 'String', operators: STRING_OPERATORS },
  ],
  sortableFields: [
    { name: 'tenantId' },
    { name: 'timestamp' },
    { name: 'category' },
    { name: 'userId' },
    { name: 'userName' },
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
  groupByFields: [],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-timestamp',
};

/**
 * Mock `/meta` payload for the audit-entity-changes resource.
 * Mirrors `Granit.Auditing.Queries.AuditEntityChangeQueryDefinition`.
 */
export const auditEntityChangeQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'auditEntryId',
      label: 'Audit Entry ID',
      type: 'Guid',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'entityType',
      label: 'Entity Type',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'entityId',
      label: 'Entity ID',
      type: 'String',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'changeType',
      label: 'Change Type',
      type: 'String',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'auditEntryId', type: 'Guid', operators: ENUM_OPERATORS },
    { name: 'entityType', type: 'String', operators: STRING_OPERATORS },
    { name: 'entityId', type: 'String', operators: STRING_OPERATORS },
    { name: 'changeType', type: 'String', operators: ENUM_OPERATORS, enumValues: CHANGE_TYPES },
  ],
  sortableFields: [{ name: 'auditEntryId' }, { name: 'entityType' }, { name: 'changeType' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-auditEntryId',
};

/** Builds an {@link AuditEntryDetailResponse} from a summary entry (drops `entityChangeCount`). */
function toDetail(entry: AuditEntryResponse): AuditEntryDetailResponse {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    userId: entry.userId,
    userName: entry.userName,
    category: entry.category,
    ipAddress: entry.ipAddress,
    tenantId: entry.tenantId,
    correlationId: entry.correlationId,
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
}

/**
 * Create stateful MSW handlers for the audit-entries endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/auditing`)
 */
export function createAuditHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const auditEntriesUrl = `${baseUrl}/audit-entries`;
  return [
    // GET /audit-entries/meta — query metadata
    createQueryMetaHandler(auditEntriesUrl, auditEntryQueryMetadata),

    // GET /audit-entries — query-engine list (filtered by `filter[category.eq]`, sorted newest-first)
    http.get(auditEntriesUrl, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
      // QueryEngine serializes filters as `filter[field.op]=value`.
      const category =
        url.searchParams.get('filter[category.eq]') ?? url.searchParams.get('category');

      let filtered: AuditEntryResponse[] = [...mockAuditEntries];
      if (category) {
        filtered = filtered.filter((e) => e.category === category);
      }
      filtered.sort((a, b) => (b.timestamp as string).localeCompare(a.timestamp as string));

      const start = (page - 1) * pageSize;
      return pagedResponse<AuditEntryResponse>(
        filtered.slice(start, start + pageSize),
        filtered.length
      );
    }),

    // GET /audit-entries/entity/:entityType/:entityId — per-entity audit trail
    http.get(`${auditEntriesUrl}/entity/:entityType/:entityId`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
      const start = (page - 1) * pageSize;
      return pagedResponse<AuditEntryResponse>(
        mockAuditEntries.slice(start, start + pageSize),
        mockAuditEntries.length
      );
    }),

    // GET /audit-entries/correlation/:correlationId — correlated detail set
    http.get(`${auditEntriesUrl}/correlation/:correlationId`, () =>
      HttpResponse.json(mockAuditEntries.slice(0, 2).map(toDetail))
    ),

    // POST /audit-entries/pseudonymize/:userId — GDPR pseudonymization (204)
    http.post(
      `${auditEntriesUrl}/pseudonymize/:userId`,
      () => new HttpResponse(null, { status: 204 })
    ),

    // GET /audit-entries/:id — single entry detail
    http.get(`${auditEntriesUrl}/:id`, ({ params }) => {
      const entry = mockAuditEntries.find((e) => e.id === params.id);
      if (!entry) return notFound();
      return HttpResponse.json(toDetail(entry));
    }),
  ];
}

/**
 * Create stateful MSW handlers for the audit-entity-changes query endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/auditing`)
 */
export function createAuditEntityChangesHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const changesUrl = `${baseUrl}/audit-entity-changes`;
  return [
    createQueryMetaHandler(changesUrl, auditEntityChangeQueryMetadata),

    http.get(changesUrl, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 25);
      const entityType =
        url.searchParams.get('filter[entityType.eq]') ?? url.searchParams.get('entityType');

      let filtered: AuditEntityChangeSummaryResponse[] = [...mockAuditEntityChanges];
      if (entityType) {
        filtered = filtered.filter((c) => c.entityType === entityType);
      }

      const start = (page - 1) * pageSize;
      return pagedResponse<AuditEntityChangeSummaryResponse>(
        filtered.slice(start, start + pageSize),
        filtered.length
      );
    }),
  ];
}
