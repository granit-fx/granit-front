// ---------------------------------------------------------------------------
// @granit/react-documents/testing — QueryEngine /meta payload for /documents
// ---------------------------------------------------------------------------

import { ENUM_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';

import type { FilterOperator, QueryMetadata } from '@granit/query-engine';

/** Equality-only operator set (used for opaque Guid columns). */
const GUID_OPERATORS: readonly FilterOperator[] = ['Eq'];

/**
 * Mock /meta payload for the documents resource. Mirrors the columns the
 * `DocumentsList` component depends on (`folderId Eq`, `status Eq Active`)
 * plus a few extras useful for exploratory filtering in Storybook.
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
      name: 'ownerUserId',
      label: 'Owner',
      type: 'Guid',
      order: 3,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 4,
      isSortable: true,
      isFilterable: false,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'name', type: 'String', operators: STRING_OPERATORS },
    { name: 'status', type: 'String', operators: ENUM_OPERATORS },
    { name: 'folderId', type: 'Guid', operators: GUID_OPERATORS },
    { name: 'ownerUserId', type: 'Guid', operators: GUID_OPERATORS },
  ],
  sortableFields: [{ name: 'name' }, { name: 'createdAt' }],
  presetFilterGroups: [],
  quickFilters: [],
  dateFilters: [
    {
      name: 'createdAt',
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
