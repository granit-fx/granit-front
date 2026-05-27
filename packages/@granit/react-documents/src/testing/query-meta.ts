// ---------------------------------------------------------------------------
// @granit/react-documents/testing — QueryEngine /meta payload for /documents
// ---------------------------------------------------------------------------

import {
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';

import type { FilterOperator, QueryMetadata } from '@granit/query-engine';

/** Equality-only operator set (used for opaque Guid columns). */
const GUID_OPERATORS: readonly FilterOperator[] = ['Eq'];

/**
 * Mock /meta payload for the documents resource. Mirrors the columns the
 * `DocumentsList` component depends on (`folderId Eq`, `status Eq Active`)
 * plus the admin-grid audit / size / content-type columns exposed by the
 * backend (granit-business !72). Column names are camelCase, matching the
 * QueryEngine projection: audit timestamps are `createdAt` / `modifiedAt`,
 * while size + content type are derived from the current version and exposed
 * as `currentVersionSizeBytes` / `currentVersionContentType`.
 */
export const documentQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'name',
      label: 'Name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 1,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'folderId',
      label: 'Folder',
      type: 'Guid',
      order: 2,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'ownerId',
      label: 'Owner',
      type: 'Guid',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created At',
      type: 'DateTime',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'modifiedAt',
      label: 'Modified At',
      type: 'DateTime',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currentVersionSizeBytes',
      label: 'Size',
      type: 'Int64',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'currentVersionContentType',
      label: 'Content Type',
      type: 'String',
      order: 7,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS },
    { name: 'folderId', type: 'Guid', operators: GUID_OPERATORS },
    { name: 'ownerId', type: 'Guid', operators: GUID_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'modifiedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'currentVersionSizeBytes', type: 'Int64', operators: NUMBER_OPERATORS },
    { name: 'currentVersionContentType', type: 'String', operators: STRING_OPERATORS },
  ],
  sortableFields: [
    { name: 'name' },
    { name: 'createdAt' },
    { name: 'modifiedAt' },
    { name: 'currentVersionSizeBytes' },
    { name: 'currentVersionContentType' },
  ],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [
    {
      name: 'createdAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'ThisYear', 'Custom'],
    },
    {
      name: 'modifiedAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: ['Today', 'ThisWeek', 'ThisMonth', 'ThisYear', 'Custom'],
    },
  ],
  groupByFields: [{ name: 'folderId', type: 'Guid' }],
  pagination: {
    defaultPageSize: 50,
    maxPageSize: 200,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'name',
};
