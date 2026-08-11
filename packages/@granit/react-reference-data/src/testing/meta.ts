// ---------------------------------------------------------------------------
// @granit/react-reference-data/testing — QueryMetadata builder
//
// Every reference-data resource answers `GET {basePath}/meta` with the same
// shape: label-per-column, a status preset group, and identical pagination
// defaults. Only the column list and the filterable/sortable sets differ.
// ---------------------------------------------------------------------------

import type {
  ColumnDefinition,
  FilterGroupMeta,
  FilterableField,
  GroupByField,
  PaginationMeta,
  QueryMetadata,
  SortableField,
} from '@granit/query-engine';

/** Translate `key`, falling back to `fallback` when the culture has no entry. */
export type MetaTranslator = (key: string, fallback: string) => string;

export interface ReferenceDataColumnSpec {
  readonly name: string;
  /** English fallback, used when the key is missing from the active culture. */
  readonly label: string;
  /**
   * Suffix under `{i18nPrefix}.Columns.`. Defaults to `name` in PascalCase —
   * state it where the key diverges (`activated` → `Active`).
   */
  readonly key?: string;
  /** CLR type name. Defaults to `String`. */
  readonly type?: string;
  /** All three default to the safe end: sortable/filterable off, visible on. */
  readonly isSortable?: boolean;
  readonly isFilterable?: boolean;
  readonly isVisible?: boolean;
}

export interface ReferenceDataMetaConfig {
  readonly t: MetaTranslator;
  /** Flat-key prefix owning the column labels, e.g. `Countries`. */
  readonly i18nPrefix: string;
  /** Declaration order becomes the 1-based `order` of each column. */
  readonly columns: readonly ReferenceDataColumnSpec[];
  readonly filterableFields: readonly FilterableField[];
  readonly sortableFields: readonly SortableField[];
  /** Prepended before the shared status group; omit for status only. */
  readonly presetFilterGroups?: readonly FilterGroupMeta[];
  readonly groupByFields?: readonly GroupByField[];
  /** Merged over the shared defaults (20 / 100 / 1000, no cursor). */
  readonly pagination?: Partial<PaginationMeta>;
}

const DEFAULT_PAGINATION: PaginationMeta = {
  defaultPageSize: 20,
  maxPageSize: 100,
  maxStreamSize: 1000,
  supportsCursor: false,
};

function toPascalCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function buildStatusGroup(t: MetaTranslator): FilterGroupMeta {
  return {
    name: 'status',
    label: t('Common.Status', 'Status'),
    presets: [
      { name: 'active', label: t('Common.Enabled', 'Active'), isDefault: true },
      { name: 'inactive', label: t('Common.Disabled', 'Inactive'), isDefault: false },
    ],
  };
}

/**
 * Assemble the `GET {basePath}/meta` payload for a reference-data resource.
 *
 * The active/inactive status group is always appended last — every resource has
 * one, and it is the group `applyStatusPreset` reads.
 */
export function buildReferenceDataMeta(config: ReferenceDataMetaConfig): QueryMetadata {
  const { t, i18nPrefix } = config;

  const columns: ColumnDefinition[] = config.columns.map((column, index) => ({
    name: column.name,
    label: t(`${i18nPrefix}.Columns.${column.key ?? toPascalCase(column.name)}`, column.label),
    type: column.type ?? 'String',
    order: index + 1,
    isSortable: column.isSortable ?? false,
    isFilterable: column.isFilterable ?? false,
    isVisible: column.isVisible ?? true,
  }));

  return {
    columns,
    filterableFields: config.filterableFields,
    sortableFields: config.sortableFields,
    presetFilterGroups: [...(config.presetFilterGroups ?? []), buildStatusGroup(t)],
    quickFilters: [],
    dateFilters: [],
    groupByFields: config.groupByFields ?? [],
    pagination: { ...DEFAULT_PAGINATION, ...config.pagination },
  };
}
